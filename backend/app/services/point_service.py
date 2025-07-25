"""
积分服务层 - 处理所有积分相关的业务逻辑
"""
import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Tuple, Union
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, text, case
from sqlalchemy.orm import joinedload
import logging
import asyncio
from functools import wraps

from app.models.scoring import (
    PointTransaction, PointDispute, UserLevel, PointPurchase,
    TransactionType, DisputeStatus, PurchaseStatus
)
from app.models.user import User
from app.core.database import get_db

logger = logging.getLogger(__name__)

# 简单的内存缓存
_balance_cache = {}
_cache_ttl = {}
CACHE_EXPIRE_SECONDS = 300  # 5分钟缓存过期


def cache_user_balance(func):
    """用户积分余额缓存装饰器"""
    @wraps(func)
    async def wrapper(self, user_id: int, *args, **kwargs):
        cache_key = f"balance_{user_id}"
        current_time = datetime.utcnow().timestamp()

        # 检查缓存是否有效
        if (cache_key in _balance_cache and
            cache_key in _cache_ttl and
            current_time - _cache_ttl[cache_key] < CACHE_EXPIRE_SECONDS):
            return _balance_cache[cache_key]

        # 缓存未命中或已过期，重新获取
        result = await func(self, user_id, *args, **kwargs)

        # 更新缓存
        _balance_cache[cache_key] = result
        _cache_ttl[cache_key] = current_time

        return result
    return wrapper


def invalidate_user_balance_cache(user_id: int):
    """清除用户积分余额缓存"""
    cache_key = f"balance_{user_id}"
    _balance_cache.pop(cache_key, None)
    _cache_ttl.pop(cache_key, None)


class PointService:
    """积分服务类"""

    def __init__(self, db: AsyncSession):
        self.db = db

    @cache_user_balance
    async def get_user_balance(self, user_id: int) -> Union[int, Decimal]:
        """获取用户当前积分余额（带缓存）"""
        # 优先从用户表获取，作为缓存
        user_result = await self.db.execute(
            select(User.points).filter(User.id == user_id)
        )
        user_points = user_result.scalar()

        if user_points is not None:
            return user_points

        # 如果用户表没有数据，从交易记录计算
        return await self.calculate_user_balance(user_id)

    async def calculate_user_balance(self, user_id: int) -> float:
        """通过交易记录计算用户积分余额（用于一致性检查）"""
        result = await self.db.execute(
            select(func.sum(PointTransaction.amount))
            .filter(PointTransaction.user_id == user_id)
        )
        balance = result.scalar()
        return balance if balance is not None else 0

    async def verify_user_balance_consistency(self, user_id: int) -> Tuple[bool, int, int]:
        """验证用户积分一致性"""
        user_balance = await self.get_user_balance(user_id)
        calculated_balance = await self.calculate_user_balance(user_id)
        is_consistent = user_balance == calculated_balance
        return is_consistent, user_balance, calculated_balance
    
    async def earn_points(
        self,
        user_id: int,
        amount: Union[int, float],
        reference_id: Optional[str] = None,
        reference_type: Optional[str] = None,
        description: Optional[str] = None,
        extra_data: Optional[Dict[str, Any]] = None,
        dispute_deadline_days: int = 90
    ) -> PointTransaction:
        """用户获得积分"""
        if amount <= 0:
            raise ValueError("积分数量必须大于0")

        # 检查是否存在重复交易
        if reference_id and reference_type:
            existing = await self._check_duplicate_transaction(
                user_id, reference_id, reference_type, TransactionType.EARN
            )
            if existing:
                logger.warning(f"重复的积分交易: user_id={user_id}, reference_id={reference_id}")
                return existing

        # 获取当前余额
        current_balance = await self.get_user_balance(user_id)
        new_balance = current_balance + amount

        # 创建交易记录
        transaction = PointTransaction(
            id=str(uuid.uuid4()),
            user_id=user_id,
            transaction_type=TransactionType.EARN,
            amount=amount,
            balance_after=new_balance,
            reference_id=reference_id,
            reference_type=reference_type,
            description=description,
            extra_data=extra_data,
            dispute_deadline=datetime.utcnow() + timedelta(days=dispute_deadline_days),
            created_at=datetime.utcnow().replace(microsecond=0)
        )

        self.db.add(transaction)

        # 更新用户积分
        await self._update_user_points(user_id, new_balance)

        # 检查用户等级变化
        await self._check_level_upgrade(user_id, new_balance)

        await self.db.commit()
        await self.db.refresh(transaction)

        logger.info(f"用户 {user_id} 获得 {amount} 积分，当前余额: {new_balance}")
        return transaction
    
    async def spend_points(
        self,
        user_id: int,
        amount: int,
        reference_id: Optional[str] = None,
        reference_type: Optional[str] = None,
        description: Optional[str] = None,
        extra_data: Optional[Dict[str, Any]] = None
    ) -> PointTransaction:
        """用户消费积分"""
        if amount <= 0:
            raise ValueError("积分数量必须大于0")

        # 获取当前余额并验证
        current_balance = await self.get_user_balance(user_id)
        if current_balance < amount:
            raise ValueError(f"积分余额不足，当前余额: {current_balance}，需要: {amount}")

        new_balance = current_balance - amount

        # 创建交易记录
        transaction = PointTransaction(
            id=str(uuid.uuid4()),
            user_id=user_id,
            transaction_type=TransactionType.SPEND,
            amount=-amount,  # 负数表示消费
            balance_after=new_balance,
            reference_id=reference_id,
            reference_type=reference_type,
            description=description,
            extra_data=extra_data,
            created_at=datetime.utcnow().replace(microsecond=0)
        )

        self.db.add(transaction)

        # 更新用户积分
        await self._update_user_points(user_id, new_balance)

        # 检查用户等级变化（可能降级）
        await self._check_level_upgrade(user_id, new_balance)

        await self.db.commit()
        await self.db.refresh(transaction)

        logger.info(f"用户 {user_id} 消费 {amount} 积分，当前余额: {new_balance}")
        return transaction
        await self._update_user_points(user_id, new_balance)
        
        await self.db.commit()
        await self.db.refresh(transaction)
        
        return transaction
    
    async def adjust_points(
        self,
        user_id: int,
        amount: int,
        admin_user_id: int,
        reason: str,
        reference_id: Optional[str] = None,
        reference_type: Optional[str] = None
    ) -> PointTransaction:
        """管理员调整积分"""
        # 获取当前余额
        current_balance = await self.get_user_balance(user_id)
        new_balance = current_balance + amount
        
        if new_balance < 0:
            raise ValueError("调整后积分不能为负数")
        
        # 创建交易记录
        transaction = PointTransaction(
            id=str(uuid.uuid4()),
            user_id=user_id,
            transaction_type=TransactionType.ADJUST,
            amount=amount,
            balance_after=new_balance,
            reference_id=reference_id,
            reference_type=reference_type,
            description=f"管理员调整: {reason}",
            extra_data={"admin_user_id": admin_user_id, "reason": reason},
            created_at=datetime.utcnow().replace(microsecond=0)
        )
        
        self.db.add(transaction)
        
        # 更新用户积分
        await self._update_user_points(user_id, new_balance)
        
        # 检查用户等级变化
        await self._check_level_upgrade(user_id, new_balance)
        
        await self.db.commit()
        await self.db.refresh(transaction)
        
        return transaction
    
    async def get_user_transactions(
        self,
        user_id: int,
        limit: int = 50,
        offset: int = 0,
        transaction_type: Optional[TransactionType] = None,
        include_disputes: bool = False
    ) -> Tuple[List[PointTransaction], int]:
        """获取用户积分交易记录（优化版，返回总数）"""
        # 构建基础查询
        base_query = select(PointTransaction).filter(PointTransaction.user_id == user_id)

        if transaction_type:
            base_query = base_query.filter(PointTransaction.transaction_type == transaction_type)

        # 获取总数（用于分页）
        count_query = select(func.count()).select_from(base_query.subquery())
        count_result = await self.db.execute(count_query)
        total_count = count_result.scalar() or 0

        # 获取分页数据
        query = base_query.order_by(desc(PointTransaction.created_at)).limit(limit).offset(offset)

        if include_disputes:
            query = query.options(joinedload(PointTransaction.disputes))

        result = await self.db.execute(query)
        if include_disputes:
            transactions = result.unique().scalars().all()
        else:
            transactions = result.scalars().all()

        return transactions, total_count

    async def get_user_transactions_summary(self, user_id: int) -> Dict[str, Any]:
        """获取用户交易摘要（性能优化版）"""
        # 使用单个查询获取所有统计信息
        result = await self.db.execute(
            select(
                func.count(PointTransaction.id).label('total_transactions'),
                func.sum(case((PointTransaction.amount > 0, PointTransaction.amount), else_=0)).label('total_earned'),
                func.sum(case((PointTransaction.amount < 0, -PointTransaction.amount), else_=0)).label('total_spent'),
                func.max(PointTransaction.created_at).label('last_transaction_date')
            )
            .filter(PointTransaction.user_id == user_id)
        )
        stats = result.first()

        return {
            "userId": user_id,
            "totalTransactions": stats.total_transactions or 0,
            "totalEarned": int(stats.total_earned or 0),
            "totalSpent": int(stats.total_spent or 0),
            "lastTransactionDate": stats.last_transaction_date.isoformat() if stats.last_transaction_date else None
        }

    async def get_user_monthly_stats(self, user_id: int) -> Dict[str, Any]:
        """获取用户本月积分统计"""
        from datetime import datetime, timezone

        # 获取本月开始时间
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # 查询本月统计
        result = await self.db.execute(
            select(
                func.count(PointTransaction.id).label('monthly_transactions'),
                func.sum(case((PointTransaction.amount > 0, PointTransaction.amount), else_=0)).label('monthly_earned'),
                func.sum(case((PointTransaction.amount < 0, -PointTransaction.amount), else_=0)).label('monthly_spent')
            )
            .filter(
                and_(
                    PointTransaction.user_id == user_id,
                    PointTransaction.created_at >= month_start
                )
            )
        )
        stats = result.first()

        return {
            "userId": user_id,
            "monthlyTransactions": stats.monthly_transactions or 0,
            "monthlyEarned": int(stats.monthly_earned or 0),
            "monthlySpent": int(stats.monthly_spent or 0),
            "monthStart": month_start.isoformat()
        }

    async def get_user_redemption_stats(self, user_id: int) -> Dict[str, Any]:
        """获取用户兑换统计"""
        from datetime import datetime, timezone

        # 获取本月开始时间
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # 查询总兑换统计
        total_result = await self.db.execute(
            select(
                func.count(PointPurchase.id).label('total_redemptions'),
                func.sum(PointPurchase.points_cost).label('total_points_spent')
            )
            .filter(PointPurchase.user_id == user_id)
        )
        total_stats = total_result.first()

        # 查询本月兑换统计
        monthly_result = await self.db.execute(
            select(
                func.count(PointPurchase.id).label('monthly_redemptions'),
                func.sum(PointPurchase.points_cost).label('monthly_points_spent')
            )
            .filter(
                and_(
                    PointPurchase.user_id == user_id,
                    PointPurchase.created_at >= month_start
                )
            )
        )
        monthly_stats = monthly_result.first()

        return {
            "userId": user_id,
            "totalRedemptions": total_stats.total_redemptions or 0,
            "totalPointsSpent": int(total_stats.total_points_spent or 0),
            "monthlyRedemptions": monthly_stats.monthly_redemptions or 0,
            "monthlyPointsSpent": int(monthly_stats.monthly_points_spent or 0),
            "monthStart": month_start.isoformat()
        }

    async def get_user_weekly_stats(self, user_id: int) -> Dict[str, Any]:
        """获取用户本周积分统计"""
        from datetime import datetime, timezone, timedelta

        # 获取本周开始时间（周一）
        now = datetime.now(timezone.utc)
        days_since_monday = now.weekday()  # 0=Monday, 6=Sunday
        week_start = (now - timedelta(days=days_since_monday)).replace(hour=0, minute=0, second=0, microsecond=0)

        # 查询本周统计
        result = await self.db.execute(
            select(
                func.count(PointTransaction.id).label('weekly_transactions'),
                func.sum(case((PointTransaction.amount > 0, PointTransaction.amount), else_=0)).label('weekly_earned'),
                func.sum(case((PointTransaction.amount < 0, -PointTransaction.amount), else_=0)).label('weekly_spent')
            )
            .filter(
                and_(
                    PointTransaction.user_id == user_id,
                    PointTransaction.created_at >= week_start
                )
            )
        )
        stats = result.first()

        return {
            "userId": user_id,
            "weeklyTransactions": stats.weekly_transactions or 0,
            "weeklyEarned": int(stats.weekly_earned or 0),
            "weeklySpent": int(stats.weekly_spent or 0),
            "weekStart": week_start.isoformat()
        }

    async def get_user_statistics(self, user_id: int) -> Dict[str, Any]:
        """获取用户积分统计信息"""
        try:
            # 获取当前余额
            current_balance = await self.get_user_balance(user_id)

            # 获取交易统计
            result = await self.db.execute(
                select(
                    func.count(PointTransaction.id).label('total_transactions'),
                    func.sum(case((PointTransaction.amount > 0, PointTransaction.amount), else_=0)).label('total_earned'),
                    func.sum(case((PointTransaction.amount < 0, -PointTransaction.amount), else_=0)).label('total_spent'),
                    func.max(PointTransaction.created_at).label('last_transaction_date')
                )
                .filter(PointTransaction.user_id == user_id)
            )
            stats = result.first()

            return {
                "currentBalance": current_balance,
                "totalTransactions": stats.total_transactions or 0,
                "totalEarned": int(stats.total_earned or 0),
                "totalSpent": int(stats.total_spent or 0),
                "lastTransactionDate": stats.last_transaction_date.isoformat() if stats.last_transaction_date else None
            }
        except Exception as e:
            print(f"获取用户积分统计错误: {e}")
            # 返回默认值
            current_balance = await self.get_user_balance(user_id)
            return {
                "currentBalance": current_balance,
                "totalTransactions": 0,
                "totalEarned": 0,
                "totalSpent": 0,
                "lastTransactionDate": None
            }
    
    async def _update_user_points(self, user_id: int, new_balance: int):
        """更新用户积分"""
        result = await self.db.execute(select(User).filter(User.id == user_id))
        user = result.scalars().first()
        if user:
            user.points = new_balance
            # 清除缓存
            invalidate_user_balance_cache(user_id)
    
    async def _check_level_upgrade(self, user_id: int, points: int):
        """检查并更新用户等级"""
        # 使用等级服务来处理等级升级
        from app.services.level_service import LevelService
        level_service = LevelService(self.db)

        level_changed, old_level, new_level = await level_service.check_level_upgrade(user_id, points)

        if level_changed:
            logger.info(f"用户 {user_id} 等级变化: {old_level.name if old_level else '无'} -> {new_level.name if new_level else '无'}")
            # 这里可以添加等级升级通知逻辑
            await self._notify_level_change(user_id, old_level, new_level)

    async def _notify_level_change(self, user_id: int, old_level: Optional[UserLevel], new_level: Optional[UserLevel]):
        """通知用户等级变化"""
        # TODO: 实现等级变化通知逻辑
        # 可以发送邮件、站内消息等
        pass
    
    async def check_consistency(self, user_id: int) -> Dict[str, Any]:
        """检查用户积分一致性"""
        current_balance = await self.get_user_balance(user_id)
        calculated_balance = await self.calculate_user_balance(user_id)
        
        # 获取用户表中的积分
        result = await self.db.execute(select(User.points).filter(User.id == user_id))
        user_points = result.scalar() or 0
        
        is_consistent = (current_balance == calculated_balance == user_points)
        
        return {
            "user_id": user_id,
            "is_consistent": is_consistent,
            "current_balance": current_balance,
            "calculated_balance": calculated_balance,
            "user_table_points": user_points,
            "discrepancy": {
                "transaction_vs_calculated": current_balance - calculated_balance,
                "user_vs_transaction": user_points - current_balance
            }
        }

    async def _check_duplicate_transaction(
        self,
        user_id: int,
        reference_id: str,
        reference_type: str,
        transaction_type: TransactionType
    ) -> Optional[PointTransaction]:
        """检查重复交易"""
        result = await self.db.execute(
            select(PointTransaction)
            .filter(
                PointTransaction.user_id == user_id,
                PointTransaction.reference_id == reference_id,
                PointTransaction.reference_type == reference_type,
                PointTransaction.transaction_type == transaction_type
            )
            .limit(1)
        )
        return result.scalar()

    async def create_purchase_record(
        self,
        user_id: int,
        item_id: str,
        item_name: str,
        item_description: str,
        points_cost: int,
        delivery_info: Optional[Dict] = None,
        redemption_code: Optional[str] = None
    ) -> PointPurchase:
        """创建购买记录"""
        # 先扣除积分
        transaction = await self.spend_points(
            user_id=user_id,
            amount=points_cost,
            reference_id=item_id,
            reference_type='purchase',
            description=f"购买商品: {item_name}"
        )

        # 创建购买记录
        purchase = PointPurchase(
            id=str(uuid.uuid4()),
            user_id=user_id,
            item_id=item_id,
            item_name=item_name,
            item_description=item_description,
            points_cost=points_cost,
            transaction_id=transaction.id,
            status=PurchaseStatus.COMPLETED,  # 直接设为已完成
            redemption_code=redemption_code,
            delivery_info=delivery_info,
            created_at=datetime.utcnow().replace(microsecond=0),
            completed_at=datetime.utcnow().replace(microsecond=0)
        )

        self.db.add(purchase)
        await self.db.commit()
        await self.db.refresh(purchase)

        logger.info(f"用户 {user_id} 购买商品 {item_name}，消费 {points_cost} 积分")
        return purchase

    async def adjust_points(
        self,
        user_id: int,
        amount: int,
        reference_id: Optional[str] = None,
        reference_type: Optional[str] = None,
        description: Optional[str] = None,
        extra_data: Optional[Dict[str, Any]] = None
    ) -> PointTransaction:
        """管理员积分调整"""
        if amount == 0:
            raise ValueError("调整积分数量不能为0")

        # 获取当前余额
        current_balance = await self.get_user_balance(user_id)
        new_balance = current_balance + amount

        # 确保余额不会变为负数
        if new_balance < 0:
            raise ValueError(f"积分调整后余额不能为负数，当前余额: {current_balance}，调整数量: {amount}")

        # 创建交易记录
        transaction = PointTransaction(
            id=str(uuid.uuid4()),
            user_id=user_id,
            transaction_type=TransactionType.ADJUSTMENT,
            amount=amount,
            balance_after=new_balance,
            reference_id=reference_id,
            reference_type=reference_type,
            description=description or f"管理员积分调整: {'+' if amount > 0 else ''}{amount}",
            extra_data=extra_data,
            created_at=datetime.utcnow().replace(microsecond=0)
        )

        self.db.add(transaction)

        # 更新用户积分
        await self._update_user_points(user_id, new_balance)

        # 检查用户等级变化
        await self._check_level_upgrade(user_id, new_balance)

        await self.db.commit()
        await self.db.refresh(transaction)

        logger.info(f"管理员调整用户 {user_id} 积分 {amount}，当前余额: {new_balance}")
        return transaction

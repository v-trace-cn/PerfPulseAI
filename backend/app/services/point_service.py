"""
积分服务层 - 处理所有积分相关的业务逻辑
"""
import uuid
from datetime import datetime, timedelta, timezone
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


class PointConverter:
    """积分转换工具类 - 处理积分的放大和缩小"""

    # 积分放大倍数：后端存储时放大10倍，前端正常展示
    SCALE_FACTOR = 10

    @classmethod
    def to_storage(cls, display_points: Union[int, float]) -> int:
        """将前端展示的积分转换为后端存储的积分（放大10倍）"""
        if display_points is None:
            return 0
        return int(float(display_points) * cls.SCALE_FACTOR)

    @classmethod
    def to_display(cls, storage_points: Union[int, float]) -> float:
        """将后端存储的积分转换为前端展示的积分"""
        if storage_points is None:
            return 0.0
        return float(storage_points) / cls.SCALE_FACTOR

    @classmethod
    def format_for_api(cls, storage_points: Union[int, float]) -> float:
        """格式化积分用于API返回（保留1位小数）"""
        display_points = cls.to_display(storage_points)
        return round(display_points, 1)
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
    async def get_user_balance(self, user_id: int) -> int:
        """获取用户当前积分余额（后端存储格式，放大10倍）"""
        # 优先从用户表获取，作为缓存
        user_result = await self.db.execute(
            select(User.points).filter(User.id == user_id)
        )
        user_points = user_result.scalar()

        if user_points is not None:
            return int(user_points)

        # 如果用户表没有数据，从交易记录计算
        return await self.calculate_user_balance(user_id)

    async def get_user_balance_for_display(self, user_id: int) -> float:
        """获取用户当前积分余额（前端展示格式，缩小10倍）"""
        storage_balance = await self.get_user_balance(user_id)
        return PointConverter.format_for_api(storage_balance)

    async def calculate_user_balance(self, user_id: int) -> int:
        """通过交易记录计算用户积分余额（后端存储格式）"""
        result = await self.db.execute(
            select(func.sum(PointTransaction.amount))
            .filter(PointTransaction.user_id == user_id)
        )
        balance = result.scalar()
        return int(balance) if balance is not None else 0

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
        dispute_deadline_days: int = 90,
        is_display_amount: bool = True
    ) -> PointTransaction:
        """用户获得积分

        Args:
            user_id: 用户ID
            amount: 积分数量
            is_display_amount: 如果为True，表示amount是前端展示格式（需要放大10倍存储）
                              如果为False，表示amount已经是后端存储格式（不需要转换）
        """
        if amount <= 0:
            raise ValueError("积分数量必须大于0")

        # 转换积分格式：如果是展示格式，需要放大10倍存储
        storage_amount = PointConverter.to_storage(amount) if is_display_amount else int(amount)
        display_amount = PointConverter.to_display(storage_amount)

        # 检查是否存在重复交易
        if reference_id and reference_type:
            existing = await self._check_duplicate_transaction(
                user_id, reference_id, reference_type, TransactionType.EARN
            )
            if existing:
                logger.warning(f"重复的积分交易: user_id={user_id}, reference_id={reference_id}")
                return existing

        # 获取当前余额（后端存储格式）
        current_balance = await self.get_user_balance(user_id)
        new_balance = current_balance + storage_amount

        # 创建交易记录
        transaction = PointTransaction(
            id=str(uuid.uuid4()),
            user_id=user_id,
            transaction_type=TransactionType.EARN,
            amount=storage_amount,
            balance_after=new_balance,
            reference_id=reference_id,
            reference_type=reference_type,
            description=description,
            extra_data=extra_data,
            dispute_deadline=datetime.now(timezone.utc) + timedelta(days=dispute_deadline_days),
            created_at=datetime.now(timezone.utc).replace(microsecond=0)
        )

        self.db.add(transaction)

        # 更新用户积分
        await self._update_user_points(user_id, new_balance)

        # 检查用户等级变化
        await self._check_level_upgrade(user_id, new_balance)

        await self.db.commit()
        await self.db.refresh(transaction)

        logger.info(f"用户 {user_id} 获得 {display_amount} 积分（存储: {storage_amount}），当前余额: {PointConverter.to_display(new_balance)}")
        return transaction
    
    async def spend_points(
        self,
        user_id: int,
        amount: Union[int, float],
        reference_id: Optional[str] = None,
        reference_type: Optional[str] = None,
        description: Optional[str] = None,
        extra_data: Optional[Dict[str, Any]] = None,
        is_display_amount: bool = True
    ) -> PointTransaction:
        """用户消费积分

        Args:
            user_id: 用户ID
            amount: 积分数量
            is_display_amount: 如果为True，表示amount是前端展示格式（需要放大10倍存储）
                              如果为False，表示amount已经是后端存储格式（不需要转换）
        """
        if amount <= 0:
            raise ValueError("积分数量必须大于0")

        # 转换积分格式：如果是展示格式，需要放大10倍存储
        storage_amount = PointConverter.to_storage(amount) if is_display_amount else int(amount)
        display_amount = PointConverter.to_display(storage_amount)

        # 获取当前余额并验证（后端存储格式）
        current_balance = await self.get_user_balance(user_id)
        if current_balance < storage_amount:
            current_display = PointConverter.to_display(current_balance)
            raise ValueError(f"积分余额不足，当前余额: {current_display}，需要: {display_amount}")

        new_balance = current_balance - storage_amount

        # 创建交易记录
        transaction = PointTransaction(
            id=str(uuid.uuid4()),
            user_id=user_id,
            transaction_type=TransactionType.SPEND,
            amount=-storage_amount,  # 负数表示消费
            balance_after=new_balance,
            reference_id=reference_id,
            reference_type=reference_type,
            description=description,
            extra_data=extra_data,
            created_at=datetime.now(timezone.utc).replace(microsecond=0)
        )

        self.db.add(transaction)

        # 更新用户积分
        await self._update_user_points(user_id, new_balance)

        # 检查用户等级变化（可能降级）
        await self._check_level_upgrade(user_id, new_balance)

        await self.db.commit()
        await self.db.refresh(transaction)

        logger.info(f"用户 {user_id} 消费 {display_amount} 积分（存储: {storage_amount}），当前余额: {PointConverter.to_display(new_balance)}")
        return transaction
    
    async def adjust_points(
        self,
        user_id: int,
        amount: Union[int, float],
        reference_id: Optional[str] = None,
        reference_type: Optional[str] = None,
        description: Optional[str] = None,
        extra_data: Optional[Dict[str, Any]] = None,
        is_display_amount: bool = True
    ) -> PointTransaction:
        """积分调整（支持AI重新评分等场景）

        Args:
            user_id: 用户ID
            amount: 调整积分数量（可以是正数或负数）
            is_display_amount: 如果为True，表示amount是前端展示格式
        """
        if amount == 0:
            raise ValueError("调整积分数量不能为0")

        # 转换积分格式
        storage_amount = PointConverter.to_storage(amount) if is_display_amount else int(amount)
        display_amount = PointConverter.to_display(storage_amount)

        # 获取当前余额（后端存储格式）
        current_balance = await self.get_user_balance(user_id)
        new_balance = current_balance + storage_amount

        # 确保余额不会变为负数
        if new_balance < 0:
            current_display = PointConverter.to_display(current_balance)
            raise ValueError(f"积分调整后余额不能为负数，当前余额: {current_display}，调整数量: {display_amount}")

        # 创建交易记录
        transaction = PointTransaction(
            id=str(uuid.uuid4()),
            user_id=user_id,
            transaction_type=TransactionType.ADJUST,
            amount=storage_amount,
            balance_after=new_balance,
            reference_id=reference_id,
            reference_type=reference_type,
            description=description or f"积分调整: {'+' if storage_amount > 0 else ''}{display_amount}",
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

        logger.info(f"调整用户 {user_id} 积分 {display_amount}（存储: {storage_amount}），当前余额: {PointConverter.to_display(new_balance)}")
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
            "totalPointsSpent": PointConverter.format_for_api(total_stats.total_points_spent or 0),
            "monthlyRedemptions": monthly_stats.monthly_redemptions or 0,
            "monthlyPointsSpent": PointConverter.format_for_api(monthly_stats.monthly_points_spent or 0),
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
            "weeklyEarned": PointConverter.format_for_api(stats.weekly_earned or 0),
            "weeklySpent": PointConverter.format_for_api(stats.weekly_spent or 0),
            "weekStart": week_start.isoformat()
        }

    async def get_user_statistics(self, user_id: int) -> Dict[str, Any]:
        """获取用户积分统计信息（返回前端展示格式）"""
        try:
            # 获取当前余额（后端存储格式）
            current_balance_storage = await self.get_user_balance(user_id)

            # 获取详细的交易统计 - 按交易类型分别统计
            result = await self.db.execute(
                select(
                    func.count(PointTransaction.id).label('total_transactions'),
                    func.sum(case((PointTransaction.transaction_type == TransactionType.EARN, PointTransaction.amount), else_=0)).label('total_earned'),
                    func.sum(case((PointTransaction.transaction_type == TransactionType.SPEND, -PointTransaction.amount), else_=0)).label('total_spent_transactions'),
                    func.sum(case((PointTransaction.transaction_type == TransactionType.ADJUST, PointTransaction.amount), else_=0)).label('total_adjusted'),
                    func.max(PointTransaction.created_at).label('last_transaction_date')
                )
                .filter(PointTransaction.user_id == user_id)
            )
            stats = result.first()

            # 获取兑换消费统计
            redemption_result = await self.db.execute(
                select(func.sum(PointPurchase.points_cost).label('total_redemption_spent'))
                .filter(PointPurchase.user_id == user_id)
            )
            redemption_stats = redemption_result.first()

            # 计算总消费（交易消费 + 兑换消费）
            total_spent_storage = (stats.total_spent_transactions or 0) + (redemption_stats.total_redemption_spent or 0)

            # 计算净获得积分（获得 + 调整）
            total_earned_storage = (stats.total_earned or 0) + max(0, stats.total_adjusted or 0)

            # 数据一致性验证
            calculated_balance = total_earned_storage - total_spent_storage
            balance_difference = current_balance_storage - calculated_balance

            # 转换为前端展示格式
            return {
                "currentBalance": PointConverter.format_for_api(current_balance_storage),
                "totalTransactions": stats.total_transactions or 0,
                "totalEarned": PointConverter.format_for_api(total_earned_storage),
                "totalSpent": PointConverter.format_for_api(total_spent_storage),
                "lastTransactionDate": stats.last_transaction_date.isoformat() if stats.last_transaction_date else None,
                # 添加数据一致性信息
                "calculatedBalance": PointConverter.format_for_api(calculated_balance),
                "balanceDifference": PointConverter.format_for_api(balance_difference),
                "isConsistent": abs(balance_difference) < 1  # 允许1个存储单位的误差
            }
        except Exception as e:
            print(f"获取用户积分统计错误: {e}")
            # 返回默认值
            current_balance_storage = await self.get_user_balance(user_id)
            return {
                "currentBalance": PointConverter.format_for_api(current_balance_storage),
                "totalTransactions": 0,
                "totalEarned": 0.0,
                "totalSpent": 0.0,
                "lastTransactionDate": None,
                "calculatedBalance": PointConverter.format_for_api(current_balance_storage),
                "balanceDifference": 0.0,
                "isConsistent": True
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
    
    async def get_unified_user_data(self, user_id: int) -> Dict[str, Any]:
        """统一获取用户积分相关的所有数据（单一数据源）"""
        try:
            # 获取基础积分统计
            stats = await self.get_user_statistics(user_id)

            # 获取等级信息
            from app.services.level_service import LevelService
            level_service = LevelService(self.db)
            level_info = await level_service.get_user_level_info(user_id)

            # 获取兑换统计
            redemption_stats = await self.get_user_redemption_stats(user_id)

            # 获取一致性检查结果
            consistency = await self.check_consistency(user_id)

            # 合并所有数据
            unified_data = {
                **stats,
                **level_info,
                **redemption_stats,
                "consistency": consistency,
                "dataSource": "unified_point_service",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

            return unified_data

        except Exception as e:
            print(f"获取统一用户数据错误: {e}")
            # 返回基础数据
            current_balance_storage = await self.get_user_balance(user_id)
            return {
                "userId": user_id,
                "currentBalance": PointConverter.format_for_api(current_balance_storage),
                "totalTransactions": 0,
                "totalEarned": 0.0,
                "totalSpent": 0.0,
                "dataSource": "unified_point_service_fallback",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "error": str(e)
            }

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

    async def validate_and_fix_user_data(self, user_id: int, auto_fix: bool = False) -> Dict[str, Any]:
        """验证并修复用户积分数据"""
        validation_result = {
            "user_id": user_id,
            "issues": [],
            "fixes_applied": [],
            "final_status": "unknown"
        }

        try:
            # 1. 检查基础数据一致性
            consistency = await self.check_consistency(user_id)
            if not consistency["is_consistent"]:
                validation_result["issues"].append({
                    "type": "balance_inconsistency",
                    "description": "积分余额不一致",
                    "details": consistency["discrepancy"]
                })

                if auto_fix:
                    # 以交易记录计算的余额为准
                    correct_balance = consistency["calculated_balance"]
                    await self._update_user_points(user_id, correct_balance)
                    validation_result["fixes_applied"].append({
                        "type": "balance_fix",
                        "description": f"修复用户表积分余额: {consistency['user_table_points']} -> {correct_balance}"
                    })

            # 2. 检查交易记录的完整性
            transaction_issues = await self._validate_transaction_integrity(user_id)
            validation_result["issues"].extend(transaction_issues)

            # 3. 检查等级一致性
            level_issues = await self._validate_level_consistency(user_id)
            validation_result["issues"].extend(level_issues)

            # 4. 检查兑换记录一致性
            redemption_issues = await self._validate_redemption_consistency(user_id)
            validation_result["issues"].extend(redemption_issues)

            if auto_fix:
                await self.db.commit()

            validation_result["final_status"] = "valid" if len(validation_result["issues"]) == 0 else "invalid"

        except Exception as e:
            validation_result["issues"].append({
                "type": "validation_error",
                "description": f"验证过程中发生错误: {str(e)}"
            })
            validation_result["final_status"] = "error"

        return validation_result

    async def _validate_transaction_integrity(self, user_id: int) -> List[Dict[str, Any]]:
        """验证交易记录的完整性"""
        issues = []

        # 检查交易记录的余额字段是否正确
        result = await self.db.execute(
            select(PointTransaction)
            .filter(PointTransaction.user_id == user_id)
            .order_by(PointTransaction.created_at)
        )
        transactions = result.scalars().all()

        running_balance = 0
        for transaction in transactions:
            running_balance += transaction.amount
            if transaction.balance_after != running_balance:
                issues.append({
                    "type": "transaction_balance_error",
                    "description": f"交易记录 {transaction.id} 的余额字段不正确",
                    "details": {
                        "transaction_id": transaction.id,
                        "expected_balance": running_balance,
                        "recorded_balance": transaction.balance_after
                    }
                })

        return issues

    async def _validate_level_consistency(self, user_id: int) -> List[Dict[str, Any]]:
        """验证等级一致性"""
        issues = []

        try:
            from app.services.level_service import LevelService
            level_service = LevelService(self.db)

            # 获取用户当前积分和等级
            user_result = await self.db.execute(
                select(User.points, User.level_id).filter(User.id == user_id)
            )
            user_data = user_result.first()

            if user_data:
                current_points = user_data.points or 0
                current_level_id = user_data.level_id

                # 根据积分计算应该的等级
                expected_level = await level_service.get_level_by_points(current_points)
                expected_level_id = expected_level.id if expected_level else None

                if current_level_id != expected_level_id:
                    issues.append({
                        "type": "level_inconsistency",
                        "description": "用户等级与积分不匹配",
                        "details": {
                            "current_points": current_points,
                            "current_level_id": current_level_id,
                            "expected_level_id": expected_level_id
                        }
                    })
        except Exception as e:
            issues.append({
                "type": "level_validation_error",
                "description": f"等级验证失败: {str(e)}"
            })

        return issues

    async def _validate_redemption_consistency(self, user_id: int) -> List[Dict[str, Any]]:
        """验证兑换记录一致性"""
        issues = []

        # 检查兑换记录是否有对应的积分交易记录
        result = await self.db.execute(
            select(PointPurchase).filter(PointPurchase.user_id == user_id)
        )
        purchases = result.scalars().all()

        for purchase in purchases:
            # 检查是否有对应的积分交易记录
            transaction_result = await self.db.execute(
                select(PointTransaction).filter(
                    PointTransaction.id == purchase.transaction_id
                )
            )
            transaction = transaction_result.scalar()

            if not transaction:
                issues.append({
                    "type": "missing_transaction",
                    "description": f"兑换记录 {purchase.id} 缺少对应的积分交易记录",
                    "details": {
                        "purchase_id": purchase.id,
                        "transaction_id": purchase.transaction_id
                    }
                })

        return issues

    async def validate_all_users_data(self, auto_fix: bool = False, limit: int = 100) -> Dict[str, Any]:
        """批量验证所有用户的积分数据"""
        # 获取所有用户
        result = await self.db.execute(
            select(User.id).limit(limit)
        )
        user_ids = [row[0] for row in result.fetchall()]

        validation_results = {
            "total_users": len(user_ids),
            "valid_users": 0,
            "invalid_users": 0,
            "error_users": 0,
            "fixes_applied": 0,
            "user_results": []
        }

        for user_id in user_ids:
            try:
                user_result = await self.validate_and_fix_user_data(user_id, auto_fix)
                validation_results["user_results"].append(user_result)

                if user_result["final_status"] == "valid":
                    validation_results["valid_users"] += 1
                elif user_result["final_status"] == "invalid":
                    validation_results["invalid_users"] += 1
                else:
                    validation_results["error_users"] += 1

                validation_results["fixes_applied"] += len(user_result["fixes_applied"])

            except Exception as e:
                validation_results["error_users"] += 1
                validation_results["user_results"].append({
                    "user_id": user_id,
                    "final_status": "error",
                    "error": str(e)
                })

        return validation_results

    async def get_system_health_report(self) -> Dict[str, Any]:
        """获取积分系统健康报告"""
        try:
            # 基础统计
            user_count_result = await self.db.execute(select(func.count(User.id)))
            total_users = user_count_result.scalar() or 0

            transaction_count_result = await self.db.execute(select(func.count(PointTransaction.id)))
            total_transactions = transaction_count_result.scalar() or 0

            purchase_count_result = await self.db.execute(select(func.count(PointPurchase.id)))
            total_purchases = purchase_count_result.scalar() or 0

            # 积分统计
            points_stats_result = await self.db.execute(
                select(
                    func.sum(User.points).label('total_points'),
                    func.avg(User.points).label('avg_points'),
                    func.max(User.points).label('max_points'),
                    func.min(User.points).label('min_points')
                )
            )
            points_stats = points_stats_result.first()

            # 等级分布
            level_distribution_result = await self.db.execute(
                select(
                    User.level_id,
                    func.count(User.id).label('user_count')
                )
                .group_by(User.level_id)
            )
            level_distribution = {
                row.level_id or "无等级": row.user_count
                for row in level_distribution_result.fetchall()
            }

            # 快速一致性检查（抽样）
            sample_size = min(50, total_users)
            sample_users_result = await self.db.execute(
                select(User.id).limit(sample_size)
            )
            sample_user_ids = [row[0] for row in sample_users_result.fetchall()]

            consistency_issues = 0
            for user_id in sample_user_ids:
                consistency = await self.check_consistency(user_id)
                if not consistency["is_consistent"]:
                    consistency_issues += 1

            estimated_consistency_rate = (sample_size - consistency_issues) / sample_size if sample_size > 0 else 1.0

            return {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "basic_stats": {
                    "total_users": total_users,
                    "total_transactions": total_transactions,
                    "total_purchases": total_purchases
                },
                "points_stats": {
                    "total_points": PointConverter.format_for_api(points_stats.total_points or 0),
                    "avg_points": PointConverter.format_for_api(points_stats.avg_points or 0),
                    "max_points": PointConverter.format_for_api(points_stats.max_points or 0),
                    "min_points": PointConverter.format_for_api(points_stats.min_points or 0)
                },
                "level_distribution": level_distribution,
                "data_quality": {
                    "sample_size": sample_size,
                    "consistency_issues": consistency_issues,
                    "estimated_consistency_rate": estimated_consistency_rate,
                    "health_status": "good" if estimated_consistency_rate > 0.95 else "warning" if estimated_consistency_rate > 0.8 else "critical"
                }
            }

        except Exception as e:
            return {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "error": str(e),
                "health_status": "error"
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
        points_cost: Union[int, float],
        delivery_info: Optional[Dict] = None,
        redemption_code: Optional[str] = None
    ) -> PointPurchase:
        """创建购买记录

        Args:
            points_cost: 前端展示格式的积分成本
        """
        transaction = None

        # 只有当积分成本大于0时才扣除积分
        if points_cost > 0:
            # 先扣除积分（points_cost是前端展示格式，需要转换）
            transaction = await self.spend_points(
                user_id=user_id,
                amount=points_cost,
                reference_id=item_id,
                reference_type='purchase',
                description=f"购买商品: {item_name}",
                is_display_amount=True  # 明确指定这是前端展示格式
            )

        # 转换积分成本为后端存储格式用于记录
        storage_cost = PointConverter.to_storage(points_cost)

        # 创建购买记录
        purchase = PointPurchase(
            id=str(uuid.uuid4()),
            user_id=user_id,
            item_id=item_id,
            item_name=item_name,
            item_description=item_description,
            points_cost=storage_cost,  # 存储后端格式
            transaction_id=transaction.id if transaction else None,  # 免费商品没有交易记录
            status=PurchaseStatus.PENDING,  # 初始状态为待核销
            redemption_code=redemption_code,
            delivery_info=delivery_info,
            created_at=datetime.now(timezone.utc).replace(microsecond=0),
            completed_at=None  # 核销后才设置完成时间
        )

        self.db.add(purchase)
        await self.db.commit()
        await self.db.refresh(purchase)

        logger.info(f"用户 {user_id} 购买商品 {item_name}，消费 {points_cost} 积分（存储: {storage_cost}）")
        return purchase



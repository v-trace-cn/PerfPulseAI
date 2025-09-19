"""异议处理服务层 - 处理积分异议相关的业务逻辑."""
import logging
import uuid
from datetime import datetime, timedelta
from typing import Any, Optional

from app.models.scoring import (
    DisputeStatus,
    PointDispute,
    PointTransaction,
    TransactionType,
)
from sqlalchemy import and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

logger = logging.getLogger(__name__)


class DisputeService:
    """异议处理服务类."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def can_create_dispute(self, transaction_id: str, user_id: int) -> tuple[bool, str]:
        """检查是否可以创建异议."""
        # 获取交易记录
        result = await self.db.execute(
            select(PointTransaction)
            .filter(PointTransaction.id == transaction_id)
        )
        transaction = result.scalar()

        if not transaction:
            return False, "交易记录不存在"

        if transaction.user_id != user_id:
            return False, "只能对自己的交易记录提出异议"

        if transaction.transaction_type != TransactionType.EARN:
            return False, "只能对获得积分的交易提出异议"

        # 检查异议截止时间
        if not transaction.dispute_deadline:
            return False, "该交易不支持异议申请"

        if datetime.utcnow() > transaction.dispute_deadline:
            return False, f"异议申请已过期，截止时间：{transaction.dispute_deadline.strftime('%Y-%m-%d %H:%M:%S')}"

        # 检查是否已存在异议
        existing_dispute = await self.db.execute(
            select(PointDispute)
            .filter(PointDispute.transaction_id == transaction_id)
        )
        if existing_dispute.scalar():
            return False, "该交易已存在异议申请"

        return True, "可以创建异议"

    async def create_dispute(
        self,
        transaction_id: str,
        user_id: int,
        reason: str,
        requested_amount: Optional[int] = None
    ) -> PointDispute:
        """创建异议."""
        # 检查是否可以创建异议
        can_create, message = await self.can_create_dispute(transaction_id, user_id)
        if not can_create:
            raise ValueError(message)

        # 获取交易记录
        result = await self.db.execute(
            select(PointTransaction)
            .filter(PointTransaction.id == transaction_id)
        )
        transaction = result.scalar()

        # 如果没有指定请求金额，默认为交易金额
        if requested_amount is None:
            requested_amount = transaction.amount

        # 创建异议记录
        dispute = PointDispute(
            id=str(uuid.uuid4()),
            transaction_id=transaction_id,
            user_id=user_id,
            reason=reason,
            requested_amount=requested_amount,
            status=DisputeStatus.PENDING,
            created_at=datetime.utcnow().replace(microsecond=0)
        )

        self.db.add(dispute)
        await self.db.commit()
        await self.db.refresh(dispute)

        logger.info(f"用户 {user_id} 对交易 {transaction_id} 创建异议，原因: {reason}")
        return dispute

    async def get_user_disputes(
        self,
        user_id: int,
        status: Optional[DisputeStatus] = None,
        limit: int = 50,
        offset: int = 0
    ) -> list[PointDispute]:
        """获取用户的异议列表."""
        query = select(PointDispute).options(
            joinedload(PointDispute.transaction),
            joinedload(PointDispute.admin_user)
        ).filter(PointDispute.user_id == user_id)

        if status:
            query = query.filter(PointDispute.status == status)

        query = query.order_by(desc(PointDispute.created_at)).limit(limit).offset(offset)

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_pending_disputes(
        self,
        limit: int = 50,
        offset: int = 0
    ) -> list[PointDispute]:
        """获取待处理的异议列表（管理员用）."""
        result = await self.db.execute(
            select(PointDispute)
            .options(
                joinedload(PointDispute.transaction),
                joinedload(PointDispute.user)
            )
            .filter(PointDispute.status == DisputeStatus.PENDING)
            .order_by(PointDispute.created_at)
            .limit(limit)
            .offset(offset)
        )
        return result.scalars().all()

    async def resolve_dispute(
        self,
        dispute_id: str,
        admin_user_id: int,
        approved: bool,
        admin_response: str,
        adjustment_amount: Optional[int] = None
    ) -> PointDispute:
        """解决异议."""
        # 获取异议记录
        result = await self.db.execute(
            select(PointDispute)
            .options(joinedload(PointDispute.transaction))
            .filter(PointDispute.id == dispute_id)
        )
        dispute = result.scalar()

        if not dispute:
            raise ValueError("异议记录不存在")

        if dispute.status != DisputeStatus.PENDING:
            raise ValueError("异议已处理，无法重复处理")

        # 更新异议状态
        dispute.resolve(admin_user_id, admin_response, approved)

        # 如果异议被批准，需要调整积分
        if approved and adjustment_amount:
            await self._adjust_points_for_dispute(dispute, adjustment_amount)

        await self.db.commit()
        await self.db.refresh(dispute)

        logger.info(f"管理员 {admin_user_id} {'批准' if approved else '拒绝'}了异议 {dispute_id}")
        return dispute

    async def _adjust_points_for_dispute(self, dispute: PointDispute, adjustment_amount: int):
        """为异议调整积分."""
        from app.services.point_service import PointService
        point_service = PointService(self.db)

        # 创建积分调整交易
        await point_service.adjust_points(
            user_id=dispute.user_id,
            amount=adjustment_amount,
            reference_id=dispute.id,
            reference_type='dispute_adjustment',
            description=f"异议处理积分调整: {dispute.reason[:50]}..."
        )

    async def get_dispute_statistics(self) -> dict[str, Any]:
        """获取异议统计信息."""
        # 总异议数
        total_result = await self.db.execute(
            select(func.count(PointDispute.id))
        )
        total_disputes = total_result.scalar() or 0

        # 按状态统计
        status_result = await self.db.execute(
            select(
                PointDispute.status,
                func.count(PointDispute.id)
            ).group_by(PointDispute.status)
        )
        status_stats = {status.value: count for status, count in status_result.fetchall()}

        # 最近30天的异议数
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_result = await self.db.execute(
            select(func.count(PointDispute.id))
            .filter(PointDispute.created_at >= thirty_days_ago)
        )
        recent_disputes = recent_result.scalar() or 0

        # 平均处理时间（已处理的异议）
        avg_time_result = await self.db.execute(
            select(func.avg(
                func.julianday(PointDispute.resolved_at) -
                func.julianday(PointDispute.created_at)
            ))
            .filter(PointDispute.resolved_at.is_not(None))
        )
        avg_processing_days = avg_time_result.scalar() or 0

        return {
            "totalDisputes": total_disputes,
            "statusDistribution": {
                "pending": status_stats.get("PENDING", 0),
                "approved": status_stats.get("APPROVED", 0),
                "rejected": status_stats.get("REJECTED", 0)
            },
            "recentDisputes": recent_disputes,
            "averageProcessingDays": round(avg_processing_days, 2) if avg_processing_days else 0
        }

    async def get_expiring_disputes(self, days_ahead: int = 7) -> list[dict[str, Any]]:
        """获取即将过期的异议申请机会."""
        expiry_date = datetime.utcnow() + timedelta(days=days_ahead)

        result = await self.db.execute(
            select(PointTransaction)
            .options(joinedload(PointTransaction.user))
            .filter(
                and_(
                    PointTransaction.dispute_deadline.is_not(None),
                    PointTransaction.dispute_deadline <= expiry_date,
                    PointTransaction.dispute_deadline > datetime.utcnow(),
                    PointTransaction.transaction_type == TransactionType.EARN
                )
            )
            .order_by(PointTransaction.dispute_deadline)
        )

        transactions = result.scalars().all()

        # 过滤掉已有异议的交易
        expiring_opportunities = []
        for transaction in transactions:
            # 检查是否已有异议
            dispute_check = await self.db.execute(
                select(PointDispute.id)
                .filter(PointDispute.transaction_id == transaction.id)
                .limit(1)
            )

            if not dispute_check.scalar():
                days_left = (transaction.dispute_deadline - datetime.utcnow()).days
                expiring_opportunities.append({
                    "transactionId": transaction.id,
                    "userId": transaction.user_id,
                    "userName": transaction.user.name if transaction.user else "未知用户",
                    "amount": transaction.amount,
                    "description": transaction.description,
                    "disputeDeadline": transaction.dispute_deadline.isoformat(),
                    "daysLeft": days_left
                })

        return expiring_opportunities

"""
Activity Service - 活动管理服务
提供活动的CRUD操作和业务逻辑
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_, or_, desc
from sqlalchemy.orm import selectinload
import logging

# 简化导入，避免循环依赖
logger = logging.getLogger(__name__)


class ActivityService:
    """活动服务类 - 简化版本"""

    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_activity(
        self,
        title: str,
        description: Optional[str] = None,
        points: int = 0,
        user_id: str = None,
        show_id: Optional[str] = None,
        activity_type: str = "individual",
        status: str = "pending"
    ):
        """创建新活动"""
        try:
            from app.models.activity import Activity

            activity = Activity(
                id=str(uuid.uuid4()),
                show_id=show_id or str(uuid.uuid4()),
                title=title,
                description=description,
                points=points,
                user_id=user_id,
                activity_type=activity_type,
                status=status,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )

            self.db.add(activity)
            await self.db.commit()
            await self.db.refresh(activity)

            logger.info(f"Created activity: {activity.id} - {title}")
            return activity

        except Exception as e:
            logger.error(f"Error creating activity: {e}")
            await self.db.rollback()
            raise
    
    async def get_by_show_id(self, show_id: str):
        """根据show_id获取活动"""
        try:
            from app.models.activity import Activity
            from sqlalchemy.orm import joinedload

            result = await self.db.execute(
                select(Activity)
                .options(joinedload(Activity.pull_request_result), joinedload(Activity.user))
                .filter(Activity.show_id == show_id)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error getting activity by show_id {show_id}: {e}")
            return None
    
    async def update_activity(
        self,
        activity_id: str,
        update_data: Dict[str, Any]
    ):
        """更新活动信息"""
        try:
            from app.models.activity import Activity

            # 添加更新时间
            update_data["updated_at"] = datetime.now(timezone.utc)

            result = await self.db.execute(
                update(Activity)
                .where(Activity.id == activity_id)
                .values(**update_data)
                .returning(Activity)
            )

            activity = result.scalar_one_or_none()
            if activity:
                await self.db.commit()
                logger.info(f"Updated activity: {activity_id}")
            return activity

        except Exception as e:
            logger.error(f"Error updating activity {activity_id}: {e}")
            await self.db.rollback()
            raise
    
    async def get_by_id(self, activity_id: str):
        """根据ID获取活动"""
        try:
            from app.models.activity import Activity
            from sqlalchemy.orm import joinedload

            result = await self.db.execute(
                select(Activity)
                .options(joinedload(Activity.pull_request_result), joinedload(Activity.user))
                .filter(Activity.id == activity_id)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error getting activity by id {activity_id}: {e}")
            return None

    async def delete(self, activity_id: str) -> bool:
        """删除活动"""
        try:
            from app.models.activity import Activity

            result = await self.db.execute(
                delete(Activity).where(Activity.id == activity_id)
            )

            if result.rowcount > 0:
                await self.db.commit()
                logger.info(f"Deleted activity: {activity_id}")
                return True
            return False

        except Exception as e:
            logger.error(f"Error deleting activity {activity_id}: {e}")
            await self.db.rollback()
            return False

    async def reset_activity_points(self, activity_id: str) -> Dict[str, Any]:
        """重置活动积分并回退用户积分

        Args:
            activity_id: 可以是activity.id或activity.show_id
        """
        try:
            # 先尝试通过show_id获取活动，如果失败再尝试通过id获取
            activity = await self.get_by_show_id(activity_id)
            if not activity:
                activity = await self.get_by_id(activity_id)

            if not activity:
                raise ValueError(f"Activity {activity_id} not found")

            # 记录需要回退的积分
            old_points = activity.points if activity.points else 0

            # 如果活动有积分，需要从积分系统中回退
            reverted_transaction = None
            if old_points > 0 and activity.user_id:
                try:
                    from app.services.point_service import PointService
                    from app.models.scoring import TransactionType

                    point_service = PointService(self.db)

                    # 检查是否存在相关的积分交易记录
                    existing_transaction = await point_service._check_duplicate_transaction(
                        user_id=activity.user_id,
                        reference_id=activity.show_id,
                        reference_type='activity',
                        transaction_type=TransactionType.EARN
                    )

                    if existing_transaction:
                        # 创建回退交易记录
                        reverted_transaction = await point_service.adjust_points(
                            user_id=activity.user_id,
                            amount=-old_points,  # 负数表示回退
                            reference_id=activity.show_id,
                            reference_type='activity_reset',
                            description=f"重置活动积分: {activity.title}",
                            extra_data={
                                "activity_id": activity.id,
                                "activity_title": activity.title,
                                "reset_reason": "AI重新评分前重置"
                            },
                            is_display_amount=True  # old_points是前端展示格式
                        )
                        logger.info(f"Reverted {old_points} points for user {activity.user_id} from activity {activity_id}")

                except Exception as point_error:
                    logger.warning(f"Failed to revert points for activity {activity_id}: {point_error}")
                    # 继续执行，不因积分回退失败而中断活动重置

            # 重置活动积分和状态
            await self.update_activity(activity.id, {
                "points": 0,
                "status": "pending"
            })

            logger.info(f"Reset activity {activity.show_id} (ID: {activity.id}) points from {old_points} to 0")

            return {
                "activity_id": activity.id,
                "activity_show_id": activity.show_id,
                "reverted_points": old_points,
                "user_id": activity.user_id,
                "transaction_id": reverted_transaction.id if 'reverted_transaction' in locals() and reverted_transaction else None,
                "message": "积分已重置，可重新计算"
            }

        except Exception as e:
            logger.error(f"Error resetting activity points for {activity_id}: {e}")
            raise

    async def award_activity_points(
        self,
        activity_id: str,
        points: int,
        description: Optional[str] = None,
        extra_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """为活动授予积分（集成积分系统）"""
        try:
            # 获取活动信息
            activity = await self.get_by_id(activity_id)
            if not activity:
                raise ValueError(f"Activity {activity_id} not found")

            if not activity.user_id:
                raise ValueError(f"Activity {activity_id} has no associated user")

            if points < 0:
                raise ValueError("积分数量必须大于0")

            # 使用积分服务授予积分
            from app.services.point_service import PointService

            point_service = PointService(self.db)

            # 创建积分交易记录
            # points参数是前端展示格式，需要传递is_display_amount=True让服务层转换
            transaction = await point_service.earn_points(
                user_id=activity.user_id,
                amount=points,
                reference_id=activity.show_id,
                reference_type='activity',
                description=description or f"活动积分: {activity.title}",
                extra_data={
                    "activity_id": activity.id,
                    "activity_title": activity.title,
                    **(extra_data or {})
                },
                is_display_amount=True  # 明确指定这是前端展示格式
            )

            # 更新活动状态和积分
            await self.update_activity(activity_id, {
                "points": points,
                "status": "completed",
                "completed_at": datetime.now(timezone.utc)
            })

            logger.info(f"Awarded {points} points to user {activity.user_id} for activity {activity_id}")

            return {
                "activity_id": activity_id,
                "user_id": activity.user_id,
                "points_awarded": points,
                "transaction_id": transaction.id,
                "new_balance": transaction.balance_after,
                "message": "积分授予成功"
            }

        except Exception as e:
            logger.error(f"Error awarding points for activity {activity_id}: {e}")
            raise

    async def get_activity_points_status(self, activity_id: str) -> Dict[str, Any]:
        """获取活动的积分状态"""
        try:
            activity = await self.get_by_id(activity_id)
            if not activity:
                raise ValueError(f"Activity {activity_id} not found")

            # 检查是否有相关的积分交易记录
            points_transaction = None
            if activity.user_id and activity.show_id:
                from app.services.point_service import PointService
                from app.models.scoring import TransactionType

                point_service = PointService(self.db)
                points_transaction = await point_service._check_duplicate_transaction(
                    user_id=activity.user_id,
                    reference_id=activity.show_id,
                    reference_type='activity',
                    transaction_type=TransactionType.EARN
                )

            return {
                "activity_id": activity_id,
                "activity_points": activity.points or 0,
                "status": activity.status,
                "has_points_transaction": points_transaction is not None,
                "transaction_id": points_transaction.id if points_transaction else None,
                "transaction_amount": points_transaction.amount if points_transaction else None,
                "can_reset": activity.status == "completed" and points_transaction is not None
            }

        except Exception as e:
            logger.error(f"Error getting activity points status for {activity_id}: {e}")
            raise

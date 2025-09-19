"""通知服务层 - 处理通知相关的业务逻辑."""
import logging
from datetime import datetime, timedelta
from typing import Any, Optional

from app.models.department import Department
from app.models.notification import (
    Notification,
    NotificationCategory,
    NotificationPriority,
    NotificationStatus,
)
from app.models.user import User
from sqlalchemy import and_, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class NotificationService:
    """通知服务类."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_notification(
        self,
        user_id: int,
        category: NotificationCategory,
        title: str,
        payload: dict[str, Any],
        summary: Optional[str] = None,
        priority: NotificationPriority = NotificationPriority.NORMAL,
        action_url: Optional[str] = None,
        action_label: Optional[str] = None,
        expires_at: Optional[datetime] = None,
        source: Optional[str] = None,
        tags: Optional[list[str]] = None
    ) -> Notification:
        """创建通知 - 使用新的模型结构."""
        notification = Notification(
            user_id=user_id,
            category=category,
            priority=priority,
            title=title,
            summary=summary,
            payload=payload,
            action_url=action_url,
            action_label=action_label,
            expires_at=expires_at,
            source=source,
            tags=tags
        )

        self.db.add(notification)
        await self.db.commit()
        await self.db.refresh(notification)

        # 触发 SSE 广播
        try:
            await self._broadcast_new_notification(notification)
        except Exception as e:
            logger.error(f"广播通知失败，用户: {user_id}，错误: {e}")

        return notification

    async def _broadcast_new_notification(self, notification: Notification):
        """广播新通知到 SSE 连接."""
        try:
            # 导入广播函数（避免循环导入）
            from app.api.notifications import broadcast_notification_to_user

            # 准备通知数据 - 使用与API相同的格式
            notification_data = {
                "type": "new_notification",
                "notification": {
                    "id": notification.id,
                    "title": notification.title,
                    "content": notification.summary or "",  # 前端期望的字段名
                    "summary": notification.summary,
                    "category": notification.category.value if notification.category else None,
                    "priority": notification.priority.value if notification.priority else None,
                    "payload": notification.payload,
                    "extraData": notification.payload,  # 向后兼容
                    "actionUrl": notification.action_url,
                    "actionLabel": notification.action_label,
                    "createdAt": notification.created_at.isoformat() + 'Z' if notification.created_at else None,
                    "status": notification.status.value if notification.status else "PENDING",
                    "isRead": notification.status.value == "READ" if notification.status else False,
                    "isUnread": notification.status.value == "PENDING" if notification.status else True
                }
            }

            # 广播到用户的所有 SSE 连接
            broadcast_notification_to_user(notification.user_id, notification_data)

        except Exception as e:
            logger.error(f"广播通知失败: {e}")
            # 不抛出异常，避免影响通知创建

    async def _find_hr_contact(self, company_id: int) -> tuple[Optional[str], Optional[str]]:
        """查找人力资源部的第一个在职人员，返回(联系人姓名, 部门名称)."""
        try:
            hr_dept_query = select(Department).where(
                and_(
                    Department.company_id == company_id,
                    or_(
                        Department.name.ilike('%人力资源%'),
                        Department.name.ilike('%人力%'),
                    )
                )
            )
            hr_dept_result = await self.db.execute(hr_dept_query)
            hr_dept = hr_dept_result.scalars().first()

            if hr_dept:
                # 首先尝试获取部门管理员中的第一个
                admin_user_ids = hr_dept.get_admin_user_ids()
                if admin_user_ids:
                    # 查找第一个管理员用户
                    admin_query = select(User).where(
                        and_(
                            User.id == admin_user_ids[0],  # 取第一个管理员ID
                            User.company_id == company_id
                        )
                    )
                    admin_result = await self.db.execute(admin_query)
                    admin_user = admin_result.scalars().first()
                    if admin_user:
                        return admin_user.name, hr_dept.name

                return "", hr_dept.name

            return "", ""

        except Exception as e:
            logger.error(f"查找人力资源联系人失败: {e}")
            return "", ""

    async def create_redemption_notification(
        self,
        user_id: int,
        item_name: str,
        redemption_code: str,
        points_cost: float
    ) -> Notification:
        """创建兑换成功通知 - 使用新的模型结构."""
        # 获取用户的公司ID
        user_query = select(User.company_id).where(User.id == user_id)
        user_result = await self.db.execute(user_query)
        company_id = user_result.scalar()

        # 查找人力资源部联系人
        hr_contact, hr_dept_name = await self._find_hr_contact(company_id) if company_id else (None, None)

        contact_info = "相关管理员"
        if hr_contact:
            contact_info = hr_contact
        elif hr_dept_name:
            contact_info = hr_dept_name

        # 使用新的结构化数据格式
        redemption_data = {
            "redeemCode": redemption_code,
            "item": item_name,
            "points": points_cost,
            "originalPrice": points_cost,  # 原价
            "discountApplied": 0,  # 折扣
            "hrContact": contact_info,
            "contactMethod": "direct",
            "validUntil": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
            "instructions": f"请联系 {contact_info} 完成兑换",
            "type": "redemption_success"
        }

        return await self.create_notification(
            user_id=user_id,
            category=NotificationCategory.TRANSACTION,
            priority=NotificationPriority.HIGH,
            title="兑换成功",
            summary=f"恭喜您成功兑换 {item_name}！",
            payload=redemption_data,
            action_url=f"/redemption/details/{redemption_code}",
            action_label="查看详情",
            expires_at=datetime.now() + timedelta(days=30),
            source="mall_service",
            tags=["redemption", "transaction", "high_value"]
        )

    async def create_points_notification(
        self,
        user_id: int,
        title: str,
        points_change: int,
        current_balance: int,
        source_description: str = "积分变动"
    ) -> Notification:
        """创建积分变动通知 - 使用新的模型结构."""
        # 判断是获得还是消耗积分
        is_gain = points_change > 0

        points_data = {
            "pointsChange": points_change,
            "currentBalance": current_balance,
            "previousBalance": current_balance - points_change,
            "changeType": "gain" if is_gain else "spend",
            "source": source_description,
            "type": "points_change"
        }

        # 根据积分变化设置优先级和分类
        category = NotificationCategory.ACHIEVEMENT if is_gain else NotificationCategory.TRANSACTION
        priority = NotificationPriority.NORMAL if abs(points_change) < 100 else NotificationPriority.HIGH

        return await self.create_notification(
            user_id=user_id,
            category=category,
            priority=priority,
            title=title,
            summary=f"积分{'+' if is_gain else ''}{points_change}，当前余额：{current_balance}",
            payload=points_data,
            action_url="/points/history",
            action_label="查看详情",
            source="points_system",
            tags=["points", "gain" if is_gain else "spend"]
        )

    async def get_user_notifications(
        self,
        user_id: int,
        category: Optional[NotificationCategory] = None,
        status: Optional[NotificationStatus] = None,
        priority: Optional[NotificationPriority] = None,
        limit: int = 50,
        offset: int = 0
    ) -> list[Notification]:
        """获取用户通知列表 - 使用新的模型结构."""
        query = select(Notification).where(Notification.user_id == user_id)

        if category:
            query = query.where(Notification.category == category)

        if status:
            query = query.where(Notification.status == status)

        if priority:
            query = query.where(Notification.priority == priority)

        query = query.order_by(desc(Notification.created_at)).limit(limit).offset(offset)

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_unread_count(self, user_id: int) -> int:
        """获取用户未读通知数量."""
        query = select(func.count(Notification.id)).where(
            and_(
                Notification.user_id == user_id,
                Notification.status == NotificationStatus.PENDING
            )
        )
        result = await self.db.execute(query)
        return result.scalar() or 0

    async def mark_as_read(self, notification_id: str, user_id: int) -> bool:
        """标记通知为已读."""
        query = select(Notification).where(
            and_(
                Notification.id == notification_id,
                Notification.user_id == user_id
            )
        )
        result = await self.db.execute(query)
        notification = result.scalar_one_or_none()

        if notification:
            notification.mark_as_read()
            await self.db.commit()
            logger.info(f"用户 {user_id} 标记通知 {notification_id} 为已读")
            return True

        return False

    async def mark_all_as_read(self, user_id: int) -> int:
        """标记用户所有通知为已读."""
        query = select(Notification).where(
            and_(
                Notification.user_id == user_id,
                Notification.status == NotificationStatus.PENDING
            )
        )
        result = await self.db.execute(query)
        notifications = result.scalars().all()

        count = 0
        for notification in notifications:
            notification.mark_as_read()
            count += 1

        if count > 0:
            await self.db.commit()
            logger.info(f"用户 {user_id} 标记 {count} 条通知为已读")

        return count

    async def delete_notification(self, notification_id: str, user_id: int) -> bool:
        """删除通知."""
        query = select(Notification).where(
            and_(
                Notification.id == notification_id,
                Notification.user_id == user_id
            )
        )
        result = await self.db.execute(query)
        notification = result.scalar_one_or_none()

        if notification:
            await self.db.delete(notification)
            await self.db.commit()
            logger.info(f"用户 {user_id} 删除通知 {notification_id}")
            return True

        return False

    async def create_achievement_notification(
        self,
        user_id: int,
        achievement_name: str,
        points_earned: int,
        achievement_data: dict[str, Any]
    ) -> Notification:
        """创建成就通知."""
        return await self.create_notification(
            user_id=user_id,
            category=NotificationCategory.ACHIEVEMENT,
            priority=NotificationPriority.NORMAL,
            title="新成就",
            summary=f"您获得了「{achievement_name}」成就，奖励{points_earned}积分",
            payload={
                "achievementName": achievement_name,
                "pointsEarned": points_earned,
                **achievement_data
            },
            action_url="/achievements",
            action_label="查看成就",
            source="achievement_system",
            tags=["achievement", "points_reward"]
        )

    async def create_workflow_notification(
        self,
        user_id: int,
        workflow_type: str,
        title: str,
        workflow_data: dict[str, Any],
        deadline: Optional[datetime] = None
    ) -> Notification:
        """创建工作流通知."""
        priority = NotificationPriority.HIGH if deadline else NotificationPriority.NORMAL

        return await self.create_notification(
            user_id=user_id,
            category=NotificationCategory.WORKFLOW,
            priority=priority,
            title=title,
            summary=workflow_data.get("description", ""),
            payload=workflow_data,
            action_url=f"/workflow/{workflow_type}/{workflow_data.get('workflowId')}",
            action_label="立即处理",
            expires_at=deadline,
            source="workflow_engine",
            tags=["workflow", workflow_type]
        )

    async def create_alert_notification(
        self,
        user_id: int,
        alert_type: str,
        title: str,
        alert_data: dict[str, Any]
    ) -> Notification:
        """创建警告通知."""
        return await self.create_notification(
            user_id=user_id,
            category=NotificationCategory.ALERT,
            priority=NotificationPriority.CRITICAL,
            title=title,
            summary=alert_data.get("description", ""),
            payload=alert_data,
            action_url="/security/review",
            action_label="立即检查",
            expires_at=datetime.now() + timedelta(hours=24),
            source="security_monitor",
            tags=["alert", alert_type, "critical"]
        )

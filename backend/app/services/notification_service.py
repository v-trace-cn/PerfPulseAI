"""
通知服务层 - 处理通知相关的业务逻辑
"""
import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, or_
from sqlalchemy.orm import joinedload
import logging

from app.models.notification import Notification, NotificationType, NotificationStatus
from app.models.user import User

logger = logging.getLogger(__name__)


class NotificationService:
    """通知服务类"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_notification(
        self,
        user_id: int,
        notification_type: NotificationType,
        title: str,
        content: str,
        extra_data: Optional[Dict[str, Any]] = None
    ) -> Notification:
        """创建通知"""
        notification = Notification(
            id=str(uuid.uuid4()),
            user_id=user_id,
            type=notification_type,
            title=title,
            content=content,
            status=NotificationStatus.UNREAD,
            extra_data=extra_data,
            created_at=datetime.utcnow().replace(microsecond=0)
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
        """广播新通知到 SSE 连接"""
        try:
            # 导入广播函数（避免循环导入）
            from app.api.notifications import broadcast_notification_to_user

            # 准备通知数据
            notification_data = {
                "type": "new_notification",
                "notification": {
                    "id": notification.id,
                    "title": notification.title,
                    "content": notification.content,
                    "type": notification.type.value if notification.type else None,
                    "createdAt": notification.created_at.isoformat() if notification.created_at else None,
                    "read": False
                }
            }

            # 广播到用户的所有 SSE 连接
            broadcast_notification_to_user(notification.user_id, notification_data)

        except Exception as e:
            logger.error(f"广播通知失败: {e}")
            # 不抛出异常，避免影响通知创建
    
    async def create_redemption_notification(
        self,
        user_id: int,
        item_name: str,
        redemption_code: str,
        points_cost: float
    ) -> Notification:
        """创建兑换成功通知"""
        title = "兑换成功"
        content = f"恭喜您成功兑换 {item_name}！消耗 {points_cost} 积分。兑换密钥：{redemption_code}，请前往兑奖中心核销。"
        extra_data = {
            "redeemCode": redemption_code,  # 使用驼峰命名与前端保持一致
            "item": item_name,
            "points": points_cost,
            "type": "redemption_success"
        }

        return await self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.REDEMPTION,
            title=title,
            content=content,
            extra_data=extra_data
        )
    
    async def create_points_notification(
        self,
        user_id: int,
        title: str,
        content: str,
        points_change: int,
        current_balance: int
    ) -> Notification:
        """创建积分变动通知"""
        extra_data = {
            "points_change": points_change,
            "current_balance": current_balance,
            "type": "points_change"
        }
        
        return await self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.POINTS,
            title=title,
            content=content,
            extra_data=extra_data
        )
    
    async def get_user_notifications(
        self,
        user_id: int,
        notification_type: Optional[NotificationType] = None,
        status: Optional[NotificationStatus] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Notification]:
        """获取用户通知列表"""
        query = select(Notification).where(Notification.user_id == user_id)
        
        if notification_type:
            query = query.where(Notification.type == notification_type)
        
        if status:
            query = query.where(Notification.status == status)
        
        query = query.order_by(desc(Notification.created_at)).limit(limit).offset(offset)
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def get_unread_count(self, user_id: int) -> int:
        """获取用户未读通知数量"""
        query = select(func.count(Notification.id)).where(
            and_(
                Notification.user_id == user_id,
                Notification.status == NotificationStatus.UNREAD
            )
        )
        result = await self.db.execute(query)
        return result.scalar() or 0
    
    async def mark_as_read(self, notification_id: str, user_id: int) -> bool:
        """标记通知为已读"""
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
        """标记用户所有通知为已读"""
        query = select(Notification).where(
            and_(
                Notification.user_id == user_id,
                Notification.status == NotificationStatus.UNREAD
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
        """删除通知"""
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

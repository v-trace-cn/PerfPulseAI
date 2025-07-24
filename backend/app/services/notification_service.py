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
        
        logger.info(f"为用户 {user_id} 创建通知: {title}")
        return notification
    
    async def create_redemption_notification(
        self,
        user_id: int,
        item_name: str,
        redemption_code: str,
        points_cost: int
    ) -> Notification:
        """创建兑换成功通知"""
        title = "兑换成功"
        content = f"恭喜您成功兑换 {item_name}！消耗 {points_cost} 积分。"
        extra_data = {
            "redemption_code": redemption_code,
            "item_name": item_name,
            "points_cost": points_cost,
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

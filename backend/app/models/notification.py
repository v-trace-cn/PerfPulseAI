"""
通知系统模型
"""
import uuid
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, String, Integer, Text, DateTime, Boolean, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class NotificationType(PyEnum):
    """通知类型枚举"""
    ANNOUNCEMENT = "ANNOUNCEMENT"  # 公告通知
    PERSONAL_DATA = "PERSONAL_DATA"  # 个人数据通知
    PERSONAL_BUSINESS = "PERSONAL_BUSINESS"  # 个人业务通知
    REDEMPTION = "REDEMPTION"  # 兑换通知
    POINTS = "POINTS"  # 积分通知
    SYSTEM = "SYSTEM"  # 系统通知


class NotificationStatus(PyEnum):
    """通知状态枚举"""
    UNREAD = "UNREAD"  # 未读
    READ = "READ"  # 已读
    ARCHIVED = "ARCHIVED"  # 已归档


class Notification(Base):
    """通知表"""
    __tablename__ = 'notifications'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    status = Column(Enum(NotificationStatus), default=NotificationStatus.UNREAD)
    extra_data = Column(JSON, nullable=True)  # 额外数据，如兑换码等
    created_at = Column(DateTime, default=lambda: datetime.utcnow().replace(microsecond=0))
    read_at = Column(DateTime, nullable=True)

    # 关联关系
    user = relationship('User', back_populates='notifications')

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "type": self.type.value if self.type else None,
            "title": self.title,
            "content": self.content,
            "status": self.status.value if self.status else None,
            "extraData": self.extra_data,
            "createdAt": self.created_at.isoformat() + 'Z' if isinstance(self.created_at, datetime) else self.created_at,
            "readAt": self.read_at.isoformat() + 'Z' if self.read_at else None,
            "isUnread": self.status == NotificationStatus.UNREAD,
            "isRead": self.status == NotificationStatus.READ,
            "isArchived": self.status == NotificationStatus.ARCHIVED
        }

    def mark_as_read(self):
        """标记为已读"""
        self.status = NotificationStatus.READ
        self.read_at = datetime.utcnow().replace(microsecond=0)

    def archive(self):
        """归档通知"""
        self.status = NotificationStatus.ARCHIVED

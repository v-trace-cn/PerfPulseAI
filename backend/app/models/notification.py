"""
通知系统模型 - 重新设计版本
基于完美主义标准的通知系统架构

设计哲学：
1. 每个字段都有明确的业务含义和用户价值
2. 支持丰富的用户交互状态和行为追踪
3. 优化查询性能，支持大规模用户场景
4. 前端友好的数据结构，减少客户端逻辑复杂度
5. 支持国际化、个性化和未来扩展
"""
import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from typing import Optional, Dict, Any, List
from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, Enum, JSON, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


class NotificationCategory(PyEnum):
    """
    通知分类 - 基于用户心理模型的分类
    
    设计原则：用户在不同心理状态下对通知的期望和处理方式不同
    """
    ACHIEVEMENT = "ACHIEVEMENT"      # 成就类：积分获得、等级提升、任务完成 - 正向激励
    TRANSACTION = "TRANSACTION"      # 交易类：兑换成功、支付完成、退款处理 - 需要行动
    SOCIAL = "SOCIAL"               # 社交类：评论、点赞、@提醒、团队邀请 - 社交互动
    SYSTEM = "SYSTEM"               # 系统类：维护通知、功能更新、安全提醒 - 信息告知
    WORKFLOW = "WORKFLOW"           # 工作流：审批、任务分配、截止日期 - 工作协作
    ALERT = "ALERT"                 # 警告类：异常、错误、风险提醒 - 紧急处理


class NotificationPriority(PyEnum):
    """
    通知优先级 - 影响用户注意力分配和处理顺序
    
    设计原则：基于用户认知负荷和紧急程度的科学分级
    """
    CRITICAL = "CRITICAL"    # 关键：立即处理，红色标识，可能需要推送
    HIGH = "HIGH"           # 高：今日处理，橙色标识，重要但不紧急
    NORMAL = "NORMAL"       # 普通：本周处理，蓝色标识，常规业务
    LOW = "LOW"             # 低：有空处理，灰色标识，可延迟处理


class NotificationStatus(PyEnum):
    """
    通知状态 - 完整的用户交互生命周期
    
    设计原则：追踪用户的完整交互路径，支持精细化的用户行为分析
    """
    PENDING = "PENDING"      # 待处理：新通知，需要用户关注
    READ = "READ"           # 已读：用户已查看，但可能需要后续行动
    ACTED = "ACTED"         # 已处理：用户已完成相关行动
    DISMISSED = "DISMISSED"  # 已忽略：用户主动忽略，不再提醒
    EXPIRED = "EXPIRED"      # 已过期：超过有效期的通知


class Notification(Base):
    """
    通知模型 - 完美主义设计
    
    设计原则：
    1. 每个字段都有明确的业务含义和用户价值
    2. 支持丰富的用户交互状态和行为追踪
    3. 优化查询性能，支持大规模用户场景
    4. 前端友好的数据结构，减少客户端逻辑复杂度
    5. 支持国际化、个性化和未来扩展
    """
    __tablename__ = 'notifications'

    # 主键：使用 UUID 确保全局唯一性和分布式友好
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # 用户关联：支持批量通知和个人通知
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    
    # 通知分类：基于用户心理模型的分类
    category = Column(Enum(NotificationCategory), nullable=False, index=True)
    
    # 优先级：影响用户注意力分配
    priority = Column(Enum(NotificationPriority), nullable=False, default=NotificationPriority.NORMAL)
    
    # 状态：用户交互状态
    status = Column(Enum(NotificationStatus), nullable=False, default=NotificationStatus.PENDING, index=True)
    
    # 内容字段：支持结构化数据和灵活渲染
    title = Column(String(200), nullable=False)  # 标题：简洁明了，支持模板变量
    summary = Column(String(500), nullable=True)  # 摘要：列表显示用，可选
    payload = Column(JSON, nullable=False)  # 载荷：结构化数据，前端渲染用
    
    # 行为字段：支持用户交互和深度链接
    action_url = Column(String(500), nullable=True)  # 行动链接：点击跳转的目标
    action_label = Column(String(100), nullable=True)  # 行动标签：按钮文字
    
    # 时间字段：完整的生命周期追踪
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), index=True)
    read_at = Column(DateTime, nullable=True)  # 首次阅读时间
    acted_at = Column(DateTime, nullable=True)  # 行动完成时间
    expires_at = Column(DateTime, nullable=True)  # 过期时间，支持时效性通知
    
    # 元数据：支持个性化、分析和调试
    source = Column(String(100), nullable=True)  # 来源：哪个模块/服务产生的通知
    tags = Column(JSON, nullable=True)  # 标签：支持分类、过滤和个性化
    
    # 关联关系
    user = relationship('User', back_populates='notifications')
    
    # 数据库索引优化 - 基于实际查询模式设计
    __table_args__ = (
        # 用户通知列表查询：按用户、状态、时间排序
        Index('idx_user_status_created', 'user_id', 'status', 'created_at'),
        # 通知分类和优先级过滤
        Index('idx_category_priority', 'category', 'priority'),
        # 过期通知清理
        Index('idx_expires_at', 'expires_at'),
        # 来源统计分析
        Index('idx_source_created', 'source', 'created_at'),
    )

    def to_dict(self) -> Dict[str, Any]:
        """
        序列化为字典 - 前端友好的数据格式
        
        设计原则：
        1. 驼峰命名，符合前端约定
        2. 包含计算字段，减少前端逻辑
        3. 时间格式统一为 ISO 8601
        4. 状态字段语义化，便于前端判断
        """
        return {
            "id": self.id,
            "userId": self.user_id,
            "category": self.category.value,
            "priority": self.priority.value,
            "status": self.status.value,
            "title": self.title,
            "summary": self.summary,
            "data": self.payload,  # 前端使用 data 字段
            "actionUrl": self.action_url,
            "actionLabel": self.action_label,
            "source": self.source,
            "tags": self.tags or [],
            
            # 时间字段
            "createdAt": self._format_datetime(self.created_at),
            "readAt": self._format_datetime(self.read_at),
            "actedAt": self._format_datetime(self.acted_at),
            "expiresAt": self._format_datetime(self.expires_at),
            
            # 计算字段 - 减少前端逻辑复杂度
            "isPending": self.status == NotificationStatus.PENDING,
            "isRead": self.status == NotificationStatus.READ,
            "isActed": self.status == NotificationStatus.ACTED,
            "isDismissed": self.status == NotificationStatus.DISMISSED,
            "isExpired": self.is_expired(),
            "isCritical": self.priority == NotificationPriority.CRITICAL,
            "isHigh": self.priority == NotificationPriority.HIGH,
            "canAct": self.can_act(),
            
            # 兼容字段 - 保持与现有前端代码的兼容性
            "timestamp": self._format_datetime(self.created_at),
            "read": self.status != NotificationStatus.PENDING,
        }
    
    def _format_datetime(self, dt: Optional[datetime]) -> Optional[str]:
        """格式化时间为 ISO 8601 字符串"""
        if dt is None:
            return None
        if dt.tzinfo is None:
            # 假设无时区的时间是 UTC
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()
    
    def is_expired(self) -> bool:
        """检查通知是否已过期"""
        if self.expires_at is None:
            return False
        now = datetime.now(timezone.utc)
        expires_at = self.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        return now > expires_at
    
    def mark_as_read(self) -> None:
        """标记为已读"""
        if self.status == NotificationStatus.PENDING:
            self.status = NotificationStatus.READ
            self.read_at = datetime.now(timezone.utc)
    
    def mark_as_acted(self) -> None:
        """标记为已处理"""
        self.status = NotificationStatus.ACTED
        self.acted_at = datetime.now(timezone.utc)
        if self.read_at is None:
            self.read_at = self.acted_at
    
    def dismiss(self) -> None:
        """忽略通知"""
        self.status = NotificationStatus.DISMISSED
        if self.read_at is None:
            self.read_at = datetime.now(timezone.utc)
    
    def expire(self) -> None:
        """标记为过期"""
        self.status = NotificationStatus.EXPIRED
    
    def can_act(self) -> bool:
        """检查是否可以执行行动"""
        return (
            self.action_url is not None and 
            self.status in [NotificationStatus.PENDING, NotificationStatus.READ] and
            not self.is_expired()
        )
    
    @classmethod
    def create_achievement_notification(
        cls,
        user_id: int,
        title: str,
        achievement_data: Dict[str, Any],
        priority: NotificationPriority = NotificationPriority.NORMAL
    ) -> 'Notification':
        """创建成就通知的便捷方法"""
        return cls(
            user_id=user_id,
            category=NotificationCategory.ACHIEVEMENT,
            priority=priority,
            title=title,
            payload=achievement_data,
            source="achievement_system"
        )
    
    @classmethod
    def create_transaction_notification(
        cls,
        user_id: int,
        title: str,
        transaction_data: Dict[str, Any],
        action_url: Optional[str] = None,
        action_label: Optional[str] = None,
        priority: NotificationPriority = NotificationPriority.HIGH
    ) -> 'Notification':
        """创建交易通知的便捷方法"""
        return cls(
            user_id=user_id,
            category=NotificationCategory.TRANSACTION,
            priority=priority,
            title=title,
            payload=transaction_data,
            action_url=action_url,
            action_label=action_label,
            source="transaction_system"
        )

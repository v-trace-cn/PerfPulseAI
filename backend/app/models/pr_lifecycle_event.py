"""PR生命周期事件模型 - 状态机驱动的事件流
基于编码共识：Jobs式产品直觉 + Rams式功能纯粹主义
"""
from datetime import datetime
from enum import Enum

from app.core.database import Base
from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import relationship


class PrEventType(Enum):
    """PR事件类型枚举"""

    # GitHub原生事件
    CREATED = "created"
    OPENED = "opened"
    CLOSED = "closed"
    MERGED = "merged"
    REOPENED = "reopened"
    SYNCHRONIZED = "synchronized"  # 新提交推送

    # 审查相关事件
    REVIEW_REQUESTED = "review_requested"
    REVIEW_SUBMITTED = "review_submitted"
    REVIEW_APPROVED = "review_approved"
    REVIEW_CHANGES_REQUESTED = "review_changes_requested"
    REVIEW_DISMISSED = "review_dismissed"

    # AI分析事件
    AI_ANALYSIS_STARTED = "ai_analysis_started"
    AI_ANALYSIS_COMPLETED = "ai_analysis_completed"
    AI_ANALYSIS_FAILED = "ai_analysis_failed"

    # 积分相关事件
    POINTS_CALCULATED = "points_calculated"
    POINTS_AWARDED = "points_awarded"
    POINTS_DISPUTED = "points_disputed"

    # 系统事件
    DATA_SYNCED = "data_synced"
    ERROR_OCCURRED = "error_occurred"
    WEBHOOK_RECEIVED = "webhook_received"


class PrLifecycleEvent(Base):
    """PR生命周期事件表 - 记录PR的所有状态变更
    
    设计理念：
    - 不定时修改
    - 事件溯源模式，所有变更都通过事件记录
    - 不可变事件流，只能追加不能修改
    - 支持事件重放和状态重建
    - 提供完整的审计轨迹
    """

    __tablename__ = 'pr_lifecycle_events'

    # 主键：使用自增ID，优化性能和存储效率
    id = Column(Integer, primary_key=True, autoincrement=True)

    # 外键关联到PR元数据
    pr_node_id = Column(String(100), ForeignKey('pr_metadata.pr_node_id'), nullable=False, index=True)

    # 事件信息
    event_type = Column(SQLEnum(PrEventType), nullable=False, index=True)
    event_time = Column(DateTime, nullable=False, index=True)

    # 事件详情
    event_source = Column(String(50), nullable=False)  # github, ai_service, system, user
    actor = Column(String(100), nullable=True)  # 触发事件的用户或系统

    # 事件数据
    event_data = Column(JSON, nullable=True)  # 事件相关的结构化数据
    description = Column(Text, nullable=True)  # 人类可读的事件描述

    # 系统字段
    created_at = Column(DateTime, default=lambda: datetime.utcnow().replace(microsecond=0))

    # 关联关系
    pr_metadata = relationship('PrMetadata', back_populates='lifecycle_events')

    def __init__(self, **kwargs):
        """初始化PR生命周期事件
        
        Args:
            pr_node_id: PR节点ID
            event_type: 事件类型
            event_time: 事件时间
            event_source: 事件源
            **kwargs: 其他字段

        """
        super().__init__(**kwargs)

        # 确保时间精度为秒级
        if self.event_time:
            self.event_time = self.event_time.replace(microsecond=0)
        if self.created_at:
            self.created_at = self.created_at.replace(microsecond=0)

    def to_dict(self):
        """转换为字典格式"""
        return {
            "id": self.id,
            "pr_node_id": self.pr_node_id,
            "event_type": self.event_type.value if self.event_type else None,
            "event_time": self.event_time.isoformat() if self.event_time else None,
            "event_source": self.event_source,
            "actor": self.actor,
            "event_data": self.event_data,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    @classmethod
    def create_github_event(cls, pr_node_id, event_type, github_event_data, actor=None):
        """创建GitHub事件
        
        Args:
            pr_node_id: PR节点ID
            event_type: 事件类型
            github_event_data: GitHub事件数据
            actor: 事件触发者
            
        Returns:
            PrLifecycleEvent: 新的事件实例

        """
        event_time = datetime.utcnow().replace(microsecond=0)

        # 尝试从GitHub数据中提取时间
        if github_event_data and 'created_at' in github_event_data:
            try:
                event_time = datetime.fromisoformat(
                    github_event_data['created_at'].replace('Z', '+00:00')
                )
            except (ValueError, TypeError):
                pass

        return cls(
            pr_node_id=pr_node_id,
            event_type=event_type,
            event_time=event_time,
            event_source='github',
            actor=actor,
            event_data=github_event_data,
            description=cls._generate_description(event_type, github_event_data, actor)
        )

    @classmethod
    def create_ai_event(cls, pr_node_id, event_type, ai_data=None, description=None):
        """创建AI分析事件
        
        Args:
            pr_node_id: PR节点ID
            event_type: 事件类型
            ai_data: AI分析数据
            description: 事件描述
            
        Returns:
            PrLifecycleEvent: 新的事件实例

        """
        return cls(
            pr_node_id=pr_node_id,
            event_type=event_type,
            event_time=datetime.utcnow().replace(microsecond=0),
            event_source='ai_service',
            actor='system',
            event_data=ai_data,
            description=description or cls._generate_description(event_type, ai_data)
        )

    @classmethod
    def create_system_event(cls, pr_node_id, event_type, system_data=None, description=None):
        """创建系统事件
        
        Args:
            pr_node_id: PR节点ID
            event_type: 事件类型
            system_data: 系统数据
            description: 事件描述
            
        Returns:
            PrLifecycleEvent: 新的事件实例

        """
        return cls(
            pr_node_id=pr_node_id,
            event_type=event_type,
            event_time=datetime.utcnow().replace(microsecond=0),
            event_source='system',
            actor='system',
            event_data=system_data,
            description=description or cls._generate_description(event_type, system_data)
        )

    @staticmethod
    def _generate_description(event_type, event_data=None, actor=None):
        """生成事件描述"""
        descriptions = {
            PrEventType.OPENED: f"PR opened by {actor}" if actor else "PR opened",
            PrEventType.CLOSED: f"PR closed by {actor}" if actor else "PR closed",
            PrEventType.MERGED: f"PR merged by {actor}" if actor else "PR merged",
            PrEventType.REOPENED: f"PR reopened by {actor}" if actor else "PR reopened",
            PrEventType.SYNCHRONIZED: "New commits pushed to PR",
            PrEventType.REVIEW_APPROVED: f"PR approved by {actor}" if actor else "PR approved",
            PrEventType.REVIEW_CHANGES_REQUESTED: f"Changes requested by {actor}" if actor else "Changes requested",
            PrEventType.AI_ANALYSIS_STARTED: "AI analysis started",
            PrEventType.AI_ANALYSIS_COMPLETED: "AI analysis completed",
            PrEventType.AI_ANALYSIS_FAILED: "AI analysis failed",
            PrEventType.POINTS_CALCULATED: "Points calculated",
            PrEventType.POINTS_AWARDED: "Points awarded",
        }

        return descriptions.get(event_type, f"Event: {event_type.value if event_type else 'unknown'}")

    def __repr__(self):
        return f"<PrLifecycleEvent(id='{self.id}', pr_node_id='{self.pr_node_id}', event_type='{self.event_type}')>"

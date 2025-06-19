import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class PullRequestEvent(Base):
    """存储 PR 时间线事件的模型"""
    __tablename__ = 'pull_request_events'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    # 使用 pr_node_id 作为外键关联到 PullRequest 表
    pr_node_id = Column(String(100), ForeignKey('pull_requests.pr_node_id'), nullable=False)
    event_type = Column(String(50), nullable=False) # 例如: 'opened', 'review_passed', 'ai_evaluation', 'merged'
    event_time = Column(DateTime, default=datetime.utcnow)
    details = Column(Text, nullable=True) # 用于存储 AI 分析摘要、审查评论等

    pull_request = relationship('PullRequest', back_populates='events')

    def to_dict(self):
        return {
            "id": self.id,
            "pr_node_id": self.pr_node_id,
            "event_type": self.event_type,
            "event_time": self.event_time.isoformat(),
            "details": self.details,
        } 
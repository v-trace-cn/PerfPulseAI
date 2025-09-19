import uuid
from datetime import datetime, timezone

from app.core.database import Base
from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, Text


class PullRequestResult(Base):
    """存储 GitHub PR 分析结果的模型"""

    __tablename__ = 'pull_request_results'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pr_node_id = Column(String(100), ForeignKey('activities.id'), unique=True, nullable=False)
    pr_number = Column(Integer, nullable=False)
    repository = Column(String(100), nullable=False)
    action = Column(String(50), nullable=False)
    notification_message = Column(Text, nullable=True)
    ai_analysis_started_at = Column(DateTime(timezone=True), nullable=True)
    ai_analysis_result = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "pr_node_id": self.pr_node_id,
            "pr_number": self.pr_number,
            "repository": self.repository,
            "action": self.action,
            "notification_message": self.notification_message,
            "ai_analysis_started_at": self.ai_analysis_started_at.isoformat() if self.ai_analysis_started_at else None,
            "ai_analysis_result": self.ai_analysis_result,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

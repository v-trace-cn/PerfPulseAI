import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime, JSON
from app.core.database import Base

class PullRequestResult(Base):
    """存储 GitHub PR 分析结果的模型"""
    __tablename__ = 'pull_request_results'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pr_node_id = Column(String(100), unique=True, nullable=False)
    pr_number = Column(Integer, nullable=False)
    repository = Column(String(100), nullable=False)
    action = Column(String(30), nullable=False)
    ai_analysis_result = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "pr_node_id": self.pr_node_id,
            "pr_number": self.pr_number,
            "repository": self.repository,
            "action": self.action,
            "ai_analysis_result": self.ai_analysis_result,
            "created_at": self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at
        } 
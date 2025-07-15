import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class PullRequest(Base):
    """存储 GitHub PR 详情的模型"""
    __tablename__ = 'pull_requests'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pr_node_id = Column(String(100), unique=True, nullable=False)
    pr_number = Column(Integer, nullable=False)
    repository = Column(String(100), nullable=False)
    title = Column(String(200), nullable=False)
    author = Column(String(100), nullable=False)
    commit_sha = Column(String(100), nullable=False)
    commit_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    merged_at = Column(DateTime(timezone=True), nullable=True)
    
    # 新增 diff_url 字段
    diff_url = Column(String(500), nullable=True)

    # AI 分析结果
    score = Column(Integer, nullable=True)
    analysis = Column(Text, nullable=True)

    # 关联到事件
    events = relationship('PullRequestEvent', back_populates='pull_request', lazy='dynamic')

    def to_dict(self):
        return {
            "id": self.id,
            "pr_node_id": self.pr_node_id,
            "pr_number": self.pr_number,
            "repository": self.repository,
            "title": self.title,
            "author": self.author,
            "commit_sha": self.commit_sha,
            "commit_message": self.commit_message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "merged_at": self.merged_at.isoformat() if self.merged_at else None,
            "diff_url": self.diff_url,
            "score": self.score,
            "analysis": self.analysis,
            "events": [event.to_dict() for event in self.events]
        } 
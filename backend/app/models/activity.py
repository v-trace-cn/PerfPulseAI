"""Activity model for the PerfPulseAI application.
"""

import uuid
from datetime import datetime, timezone

from app.core.database import Base
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship


class Activity(Base):
    """Activity model representing an activity in the system."""

    __tablename__ = 'activities'

    id = Column(String(200), primary_key=True)
    show_id = Column(String(36), unique=True, index=True, nullable=False, default=lambda: str(uuid.uuid4()))
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    points = Column(Integer, default=0)
    user_id = Column(Integer, ForeignKey('users.id'))
    # 关联到 User 模型，需要与 User.activities 的 back_populates 对应
    user = relationship('User', back_populates='activities')
    # 添加与 PullRequestResult 的一对一关系
    pull_request_result = relationship("PullRequestResult", primaryjoin="Activity.id == PullRequestResult.pr_node_id", uselist=False, backref="activity")
    status = Column(String(20), default='pending')
    activity_type = Column(String(50), default='individual')
    # 存储 PR diff 链接，用于后续定时任务拉取和分析
    diff_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(microsecond=0))
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(microsecond=0), onupdate=lambda: datetime.now(timezone.utc).replace(microsecond=0))

    def __init__(self, title=None, description=None, points=0, user_id=None,
                 status="pending", created_at=None, completed_at=None, activity_type='individual'):
        """Initialize a new Activity.
        """
        self.show_id = str(uuid.uuid4())
        self.title = title
        self.description = description
        self.points = points
        self.user_id = user_id
        self.status = status
        self.activity_type = activity_type

        # 简化时间处理，统一使用秒级精度
        if created_at is not None:
            if isinstance(created_at, str):
                try:
                    parsed_time = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    self.created_at = parsed_time.replace(microsecond=0)
                except ValueError:
                    self.created_at = datetime.now(timezone.utc).replace(microsecond=0)
            else:
                self.created_at = created_at.replace(microsecond=0)

        if completed_at is not None:
            if isinstance(completed_at, str):
                try:
                    parsed_time = datetime.fromisoformat(completed_at.replace('Z', '+00:00'))
                    self.completed_at = parsed_time.replace(microsecond=0)
                except ValueError:
                    self.completed_at = None
            else:
                self.completed_at = completed_at.replace(microsecond=0)

    def to_dict(self):
        """Convert the activity object to a dictionary.

        Returns:
            dict: Dictionary representation of the activity

        """
        user_data = None
        try:
            if self.user:
                user_data = {
                    "name": self.user.name,
                    "avatar": self.user.avatar_url,
                    "initials": self.user.name[0] if self.user.name else "无",
                }
        except:
            user_data = None

        # 安全地获取 PR 结果数据
        ai_analysis = None
        ai_analysis_started_at = None
        ai_analysis_completed_at = None
        try:
            if self.pull_request_result:
                ai_analysis = self.pull_request_result.ai_analysis_result
                ai_analysis_started_at = self.pull_request_result.ai_analysis_started_at.isoformat() if self.pull_request_result.ai_analysis_started_at else None
                ai_analysis_completed_at = self.pull_request_result.updated_at.isoformat() if self.pull_request_result.updated_at else None
        except:
            pass

        return {
            "id": self.id,
            "showId": self.show_id,
            "title": self.title,
            "description": self.description,
            "points": self.points,
            "userId": self.user_id,
            "status": self.status,
            "activityType": self.activity_type,
            "diffUrl": self.diff_url,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "completedAt": self.completed_at.isoformat() if self.completed_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "user": user_data,
            "aiAnalysis": ai_analysis,
            "aiAnalysisStartedAt": ai_analysis_started_at,
            "aiAnalysisCompletedAt": ai_analysis_completed_at,
            "pointsCalculatedAt": self.completed_at.isoformat() if self.completed_at else None,
        }

    @classmethod
    def from_dict(cls, data):
        """Create an activity object from a dictionary.
        
        Args:
            data (dict): Dictionary containing activity data
            
        Returns:
            Activity: New activity object

        """
        return cls(
            title=data.get("title"),
            description=data.get("description"),
            points=data.get("points", 0),
            user_id=data.get("user_id"),
            status=data.get("status", "pending"),
            created_at=data.get("created_at"),
            completed_at=data.get("completed_at"),
            activity_type=data.get("activity_type", "individual")
        )

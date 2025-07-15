"""
User model for the PerfPulseAI application.
"""
from datetime import datetime
from passlib.context import CryptContext
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.core.database import Base

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

class User(Base):
    """User model representing a user in the system."""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(200))
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=True)
    department_id = Column(Integer, ForeignKey('departments.id'), nullable=True)
    department_rel = relationship('Department', backref='users', lazy=True)
    position = Column(String(100))
    phone = Column(String(20))
    github_url = Column(String(200), unique=True, nullable=True)
    avatar_url = Column(String(255), nullable=True)
    join_date = Column(Date, default=datetime.utcnow)
    points = Column(Integer, default=0)
    level = Column(Integer, default=1)
    completed_tasks = Column(Integer, default=0)
    pending_tasks = Column(Integer, default=0)

    # 关联关系
    company = relationship('Company', back_populates='users', foreign_keys=[company_id])

    created_at = Column(DateTime, default=lambda: datetime.utcnow().replace(microsecond=0))
    updated_at = Column(DateTime, default=lambda: datetime.utcnow().replace(microsecond=0), onupdate=lambda: datetime.utcnow().replace(microsecond=0))
    
    # 关联关系
    activities = relationship('Activity', back_populates='user', lazy=True)
    roles = relationship('Role', secondary='user_roles', back_populates='users')
    
    def __init__(self, name, email, password=None, company_id=None, department=None, position=None,
                 phone=None, join_date=None, points=0, level=1, github_url=None, avatar_url=None, department_id=None):
        """
        Initialize a new User.
        """
        self.name = name
        self.email = email
        if password:
            self.set_password(password)
        self.company_id = company_id
        self.department_id = department_id
        self.position = position
        self.phone = phone
        self.join_date = join_date if join_date else datetime.utcnow()
        self.points = points
        self.level = level
        self.completed_tasks = 0
        self.pending_tasks = 0
        self.github_url = github_url
        self.avatar_url = avatar_url
    
    def set_password(self, password):
        """设置密码哈希"""
        self.password_hash = pwd_context.hash(password)
    
    def check_password(self, password):
        """验证密码"""
        return pwd_context.verify(password, self.password_hash)

    def has_permission(self, permission_name: str) -> bool:
        """检查用户是否具有指定权限"""
        for role in self.roles:
            for permission in role.permissions:
                if permission.name == permission_name:
                    return True
        return False

    def to_dict(self):
        """
        Convert the user object to a dictionary.

        Returns:
            dict: Dictionary representation of the user
        """
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "githubUrl": self.github_url,
            "avatar": self.avatar_url,
            "department": self.department_rel.name if self.department_rel else None,
            "departmentId": self.department_id,
            "position": self.position,
            "phone": self.phone,
            "joinDate": self.join_date.isoformat() if isinstance(self.join_date, datetime) else self.join_date,
            "points": self.points,
            "level": self.level,
            "completedTasks": self.completed_tasks,
            "pendingTasks": self.pending_tasks,
            "companyId": self.company_id,
            "companyName": self.company.name if self.company else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }

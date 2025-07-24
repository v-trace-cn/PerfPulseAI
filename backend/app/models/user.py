"""
User model for the PerfPulseAI application.
"""
from datetime import datetime
from passlib.context import CryptContext
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship, backref
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
    level_id = Column(String(36), ForeignKey('user_levels.id'), nullable=True)  # 关联到用户等级表
    completed_tasks = Column(Integer, default=0)
    pending_tasks = Column(Integer, default=0)

    # 关联关系
    company = relationship('Company', back_populates='users', foreign_keys=[company_id])
    user_level = relationship('UserLevel', foreign_keys=[level_id])
    point_transactions = relationship('PointTransaction', back_populates='user', cascade='all, delete-orphan')
    point_disputes = relationship('PointDispute', foreign_keys='PointDispute.user_id', cascade='all, delete-orphan')
    point_purchases = relationship('PointPurchase', back_populates='user', cascade='all, delete-orphan')
    notifications = relationship('Notification', back_populates='user', cascade='all, delete-orphan')

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

    def verify_password(self, password):
        """验证密码（别名方法，用于测试兼容性）"""
        return self.check_password(password)

    def has_permission(self, permission_name: str) -> bool:
        """检查用户是否具有指定权限"""
        for role in self.roles:
            for permission in role.permissions:
                if permission.name == permission_name:
                    return True
        return False

    def get_current_level_info(self):
        """获取当前等级信息"""
        if self.user_level:
            return self.user_level.to_dict()
        return None

    def get_next_level_info(self):
        """获取下一等级信息（需要在服务层实现）"""
        # 这个方法需要在服务层中实现，因为需要查询数据库
        pass

    def get_points_to_next_level(self):
        """获取到下一等级所需积分（需要在服务层实现）"""
        # 这个方法需要在服务层中实现
        pass

    def to_dict(self):
        """
        Convert the user object to a dictionary.

        Returns:
            dict: Dictionary representation of the user
        """
        # 安全地获取关联数据，避免懒加载问题
        department_name = None
        try:
            department_name = self.department_rel.name if self.department_rel else None
        except:
            department_name = None

        company_name = None
        try:
            company_name = self.company.name if self.company else None
        except:
            company_name = None

        level_info = None
        try:
            level_info = self.get_current_level_info()
        except:
            level_info = None

        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "githubUrl": self.github_url,
            "avatar": self.avatar_url,
            "department": department_name,
            "departmentId": self.department_id,
            "position": self.position,
            "phone": self.phone,
            "joinDate": self.join_date.isoformat() if isinstance(self.join_date, datetime) else self.join_date,
            "points": self.points,
            "level": self.level,
            "levelId": self.level_id,
            "levelInfo": level_info,
            "completedTasks": self.completed_tasks,
            "pendingTasks": self.pending_tasks,
            "companyId": self.company_id,
            "companyName": company_name,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }

"""Company model for multi-tenant support.
"""
import secrets
import string
from datetime import datetime

from app.core.database import Base
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship


class Company(Base):
    """Company model representing a tenant in the multi-tenant system."""

    __tablename__ = 'companies'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    domain = Column(String(100), unique=True, nullable=True)  # 可选的域名标识
    invite_code = Column(String(20), unique=True, nullable=False)  # 公司邀请码
    creator_user_id = Column(Integer, ForeignKey('users.id'), nullable=False)  # 创建人ID
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.utcnow().replace(microsecond=0))
    updated_at = Column(DateTime, default=lambda: datetime.utcnow().replace(microsecond=0), onupdate=lambda: datetime.utcnow().replace(microsecond=0))

    # 关联关系
    users = relationship('User', back_populates='company', lazy='select', foreign_keys='User.company_id')
    creator = relationship('User', foreign_keys=[creator_user_id], lazy='select', post_update=True)
    departments = relationship('Department', back_populates='company', lazy='select')


    def __init__(self, name: str, creator_user_id: int, description: str = None, domain: str = None):
        self.name = name
        self.creator_user_id = creator_user_id
        self.description = description
        # 将空字符串转换为 None 以避免 UNIQUE 约束冲突
        self.domain = domain if domain and domain.strip() else None
        self.invite_code = self.generate_invite_code()

    @staticmethod
    def generate_invite_code() -> str:
        """生成唯一的邀请码"""
        # 生成8位随机字符串，包含大小写字母和数字
        characters = string.ascii_letters + string.digits
        return ''.join(secrets.choice(characters) for _ in range(8))

    def to_dict(self, include_counts=False):
        """转换为字典格式

        Args:
            include_counts: 是否包含关联对象的计数，需要在已加载关系的情况下使用

        """
        base_dict = {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "domain": self.domain,
            "inviteCode": self.invite_code,
            "creatorUserId": self.creator_user_id,
            "isActive": self.is_active,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }

        if include_counts:
            # 只有在明确要求且关系已加载时才包含计数
            try:
                base_dict.update({
                    "userCount": len(self.users) if hasattr(self, '_sa_instance_state') and 'users' in self._sa_instance_state.loaded_attrs else 0,
                    "departmentCount": len(self.departments) if hasattr(self, '_sa_instance_state') and 'departments' in self._sa_instance_state.loaded_attrs else 0,
                    "organizationCount": len(self.departments) if hasattr(self, '_sa_instance_state') and 'departments' in self._sa_instance_state.loaded_attrs else 0  # 组织数量等于部门数量
                })
            except:
                # 如果访问关系失败，设置为0
                base_dict.update({
                    "userCount": 0,
                    "departmentCount": 0,
                    "organizationCount": 0
                })

        return base_dict

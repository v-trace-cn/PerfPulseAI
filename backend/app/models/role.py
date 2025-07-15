"""
Role model for role-based access control.
"""
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.core.database import Base

# 角色权限关联表
role_permissions = Table(
    'role_permissions',
    Base.metadata,
    Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True),
    Column('permission_id', Integer, ForeignKey('permissions.id'), primary_key=True)
)

# 用户角色关联表
user_roles = Table(
    'user_roles',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True)
)


class Role(Base):
    """Role model for defining user roles within a company."""
    __tablename__ = 'roles'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=False)
    is_system_role = Column(Boolean, default=False)  # 系统预定义角色
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.utcnow().replace(microsecond=0))
    updated_at = Column(DateTime, default=lambda: datetime.utcnow().replace(microsecond=0), onupdate=lambda: datetime.utcnow().replace(microsecond=0))
    
    # 关联关系
    company = relationship('Company', backref='roles')
    permissions = relationship('Permission', secondary=role_permissions, backref='roles')
    users = relationship('User', secondary=user_roles, back_populates='roles')
    
    def __init__(self, name: str, company_id: int, description: str = None, is_system_role: bool = False):
        self.name = name
        self.company_id = company_id
        self.description = description
        self.is_system_role = is_system_role
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "companyId": self.company_id,
            "isSystemRole": self.is_system_role,
            "isActive": self.is_active,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "permissions": [p.to_dict() for p in self.permissions] if self.permissions else []
        }

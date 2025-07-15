"""
Permission model for fine-grained access control.
"""
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


class Permission(Base):
    """Permission model for defining specific permissions."""
    __tablename__ = 'permissions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)  # 权限名称，如 'user.create', 'company.read'
    display_name = Column(String(100), nullable=False)  # 显示名称
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False)  # 权限分类，如 'user', 'company', 'department'
    is_system_permission = Column(Boolean, default=False)  # 系统预定义权限
    created_at = Column(DateTime, default=lambda: datetime.utcnow().replace(microsecond=0))
    updated_at = Column(DateTime, default=lambda: datetime.utcnow().replace(microsecond=0), onupdate=lambda: datetime.utcnow().replace(microsecond=0))
    

    
    def __init__(self, name: str, display_name: str, category: str, description: str = None, is_system_permission: bool = False):
        self.name = name
        self.display_name = display_name
        self.category = category
        self.description = description
        self.is_system_permission = is_system_permission
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "displayName": self.display_name,
            "description": self.description,
            "category": self.category,
            "isSystemPermission": self.is_system_permission,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }


# 预定义的系统权限
SYSTEM_PERMISSIONS = [
    # 用户管理权限
    ("user.create", "创建用户", "user", "创建新用户的权限"),
    ("user.read", "查看用户", "user", "查看用户信息的权限"),
    ("user.update", "更新用户", "user", "更新用户信息的权限"),
    ("user.delete", "删除用户", "user", "删除用户的权限"),
    
    # 公司管理权限
    ("company.create", "创建公司", "company", "创建新公司的权限"),
    ("company.read", "查看公司", "company", "查看公司信息的权限"),
    ("company.update", "更新公司", "company", "更新公司信息的权限"),
    ("company.delete", "删除公司", "company", "删除公司的权限"),
    
    # 部门管理权限
    ("department.create", "创建部门", "department", "创建新部门的权限"),
    ("department.read", "查看部门", "department", "查看部门信息的权限"),
    ("department.update", "更新部门", "department", "更新部门信息的权限"),
    ("department.delete", "删除部门", "department", "删除部门的权限"),
    

    
    # 权限管理权限
    ("permission.read", "查看权限", "permission", "查看权限信息的权限"),
    ("permission.assign", "分配权限", "permission", "分配权限给角色的权限"),
    
    # 活动管理权限
    ("activity.create", "创建活动", "activity", "创建新活动的权限"),
    ("activity.read", "查看活动", "activity", "查看活动信息的权限"),
    ("activity.update", "更新活动", "activity", "更新活动信息的权限"),
    ("activity.delete", "删除活动", "activity", "删除活动的权限"),
    
    # 奖励管理权限
    ("reward.create", "创建奖励", "reward", "创建新奖励的权限"),
    ("reward.read", "查看奖励", "reward", "查看奖励信息的权限"),
    ("reward.update", "更新奖励", "reward", "更新奖励信息的权限"),
    ("reward.delete", "删除奖励", "reward", "删除奖励的权限"),
    
    # 系统管理权限
    ("system.admin", "系统管理", "system", "系统管理员权限"),
]

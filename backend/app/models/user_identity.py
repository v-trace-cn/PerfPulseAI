"""用户身份关联模型 - 统一的多平台身份管理
基于编码共识：Jobs式产品直觉 + Rams式功能纯粹主义

设计理念：
- 统一管理所有平台的用户身份
- 支持多平台身份关联和验证
- 为未来的OAuth集成预留扩展空间
- 解决用户身份数据冗余问题
"""
from datetime import datetime
from enum import Enum

from app.core.database import Base
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship


class IdentityPlatform(Enum):
    """身份平台枚举"""

    GITHUB = "github"
    GITLAB = "gitlab"
    EMAIL = "email"
    FEISHU = "feishu"
    WECHAT = "wechat"
    INTERNAL = "internal"  # 内部系统账号


class IdentityStatus(Enum):
    """身份状态枚举"""

    PENDING = "pending"      # 待验证
    VERIFIED = "verified"    # 已验证
    SUSPENDED = "suspended"  # 已暂停
    REVOKED = "revoked"     # 已撤销


class UserIdentity(Base):
    """用户身份关联表 - 统一管理多平台用户身份
    
    设计理念：
    - 一个用户可以有多个平台身份
    - 每个平台身份都可以独立验证
    - 支持主身份和次身份的概念
    - 提供完整的身份生命周期管理
    """

    __tablename__ = 'user_identities'

    # 主键
    id = Column(Integer, primary_key=True, autoincrement=True)

    # 关联到内部用户（可选，支持匿名身份）
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)

    # 平台信息
    platform = Column(String(20), nullable=False, index=True)  # github, gitlab, email等
    platform_user_id = Column(String(100), nullable=True)     # 平台的用户ID
    platform_username = Column(String(100), nullable=False, index=True)  # 平台用户名
    platform_email = Column(String(200), nullable=True, index=True)      # 平台邮箱
    platform_url = Column(String(500), nullable=True)         # 平台个人页面URL
    platform_avatar_url = Column(String(500), nullable=True)  # 头像URL

    # 身份状态
    status = Column(String(20), default=IdentityStatus.PENDING.value, index=True)
    is_primary = Column(Boolean, default=False, index=True)   # 是否为主身份
    is_public = Column(Boolean, default=True)                 # 是否公开显示


    # 元数据
    display_name = Column(String(100), nullable=True)         # 显示名称
    bio = Column(Text, nullable=True)                         # 个人简介

    # 统计信息
    last_activity_at = Column(DateTime, nullable=True)  # 最后活动时间
    created_at = Column(DateTime, default=lambda: datetime.utcnow().replace(microsecond=0))

    # 唯一约束：同一平台的同一用户只能有一个身份记录
    __table_args__ = (
        UniqueConstraint('platform', 'platform_username', name='uq_platform_username'),
        UniqueConstraint('platform', 'platform_user_id', name='uq_platform_user_id'),
    )

    # 关联关系
    user = relationship('User', back_populates='identities')

    def __init__(self, **kwargs):
        """初始化用户身份

        Args:
            platform: 平台名称
            platform_username: 平台用户名
            **kwargs: 其他字段

        """
        super().__init__(**kwargs)

        # 确保时间精度为秒级
        if self.last_activity_at:
            self.last_activity_at = self.last_activity_at.replace(microsecond=0)
        if self.created_at:
            self.created_at = self.created_at.replace(microsecond=0)

    def to_dict(self, include_sensitive=False):
        """转换为字典格式

        Args:
            include_sensitive: 是否包含敏感信息（暂时保留参数以保持兼容性）

        """
        result = {
            "id": self.id,
            "user_id": self.user_id,
            "platform": self.platform,
            "platform_user_id": self.platform_user_id,
            "platform_username": self.platform_username,
            "platform_email": self.platform_email,
            "platform_url": self.platform_url,
            "platform_avatar_url": self.platform_avatar_url,
            "status": self.status,
            "is_primary": self.is_primary,
            "is_public": self.is_public,
            "display_name": self.display_name,
            "bio": self.bio,
            "last_activity_at": self.last_activity_at.isoformat() if self.last_activity_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

        return result

    @classmethod
    def create_github_identity(cls, github_user_data, user_id=None):
        """从GitHub用户数据创建身份记录

        Args:
            github_user_data: GitHub API返回的用户数据
            user_id: 关联的内部用户ID（可选）

        Returns:
            UserIdentity: 新的身份实例

        """
        return cls(
            user_id=user_id,
            platform=IdentityPlatform.GITHUB.value,
            platform_user_id=str(github_user_data.get("id")),
            platform_username=github_user_data.get("login"),
            platform_email=github_user_data.get("email"),
            platform_url=github_user_data.get("html_url"),
            platform_avatar_url=github_user_data.get("avatar_url"),
            display_name=github_user_data.get("name"),
            bio=github_user_data.get("bio"),
            status=IdentityStatus.VERIFIED.value  # GitHub数据默认已验证
        )

    @classmethod
    def create_email_identity(cls, email, user_id=None, display_name=None):
        """创建邮箱身份记录
        
        Args:
            email: 邮箱地址
            user_id: 关联的内部用户ID（可选）
            display_name: 显示名称（可选）
            
        Returns:
            UserIdentity: 新的身份实例

        """
        return cls(
            user_id=user_id,
            platform=IdentityPlatform.EMAIL.value,
            platform_username=email,
            platform_email=email,
            display_name=display_name,
            status=IdentityStatus.PENDING.value  # 邮箱需要验证
        )

    def verify_identity(self):
        """验证身份"""
        self.status = IdentityStatus.VERIFIED.value

    def set_as_primary(self):
        """设置为主身份"""
        self.is_primary = True

    def update_activity(self):
        """更新最后活动时间"""
        self.last_activity_at = datetime.utcnow().replace(microsecond=0)

    def is_verified(self):
        """检查是否已验证"""
        return self.status == IdentityStatus.VERIFIED.value

    def is_active(self):
        """检查是否活跃"""
        return self.status in [IdentityStatus.VERIFIED.value, IdentityStatus.PENDING.value]

    def get_display_identifier(self):
        """获取显示用的身份标识"""
        if self.display_name:
            return f"{self.display_name} ({self.platform_username})"
        return self.platform_username

    def __repr__(self):
        return f"<UserIdentity(id={self.id}, platform='{self.platform}', username='{self.platform_username}')>"

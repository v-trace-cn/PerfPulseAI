"""用户身份管理服务.

提供统一的多平台身份管理功能：
- 身份创建和验证
- 身份关联和合并
- GitHub身份自动识别
- 为PR作者提供身份解析
"""
import logging
from datetime import datetime, timezone
from typing import Any, Optional

from app.models.user_identity import IdentityPlatform, IdentityStatus, UserIdentity
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class IdentityService:
    """用户身份管理服务."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_or_create_github_identity(
        self,
        github_username: str,
        github_user_data: Optional[dict[str, Any]] = None,
        user_id: Optional[int] = None
    ) -> UserIdentity:
        """查找或创建GitHub身份.
        
        Args:
            github_username: GitHub用户名
            github_user_data: GitHub用户数据（可选）
            user_id: 关联的内部用户ID（可选）
            
        Returns:
            UserIdentity: 身份记录

        """
        try:
            # 1. 先尝试查找现有身份
            result = await self.db.execute(
                select(UserIdentity).where(
                    and_(
                        UserIdentity.platform == IdentityPlatform.GITHUB.value,
                        UserIdentity.platform_username == github_username
                    )
                )
            )
            existing_identity = result.scalars().first()

            if existing_identity:
                # 更新最后活动时间
                existing_identity.update_activity()
                await self.db.commit()
                logger.info(f"Found existing GitHub identity: {github_username}")
                return existing_identity

            # 2. 创建新身份
            if github_user_data:
                identity = UserIdentity.create_github_identity(github_user_data, user_id)
            else:
                identity = UserIdentity(
                    user_id=user_id,
                    platform=IdentityPlatform.GITHUB.value,
                    platform_username=github_username,
                    status=IdentityStatus.VERIFIED.value,
                    verified_at=datetime.now(timezone.utc)
                )

            self.db.add(identity)
            await self.db.commit()
            await self.db.refresh(identity)

            logger.info(f"Created new GitHub identity: {github_username}")
            return identity

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error finding/creating GitHub identity for {github_username}: {e}")
            raise

    async def find_identity_by_platform_username(
        self,
        platform: str,
        username: str
    ) -> Optional[UserIdentity]:
        """根据平台和用户名查找身份.
        
        Args:
            platform: 平台名称
            username: 用户名
            
        Returns:
            UserIdentity: 身份记录（如果找到）

        """
        try:
            result = await self.db.execute(
                select(UserIdentity).where(
                    and_(
                        UserIdentity.platform == platform,
                        UserIdentity.platform_username == username
                    )
                )
            )
            return result.scalars().first()

        except Exception as e:
            logger.error(f"Error finding identity for {platform}:{username}: {e}")
            return None

    async def get_user_identities(self, user_id: int) -> list[UserIdentity]:
        """获取用户的所有身份.
        
        Args:
            user_id: 用户ID
            
        Returns:
            List[UserIdentity]: 身份列表

        """
        try:
            result = await self.db.execute(
                select(UserIdentity)
                .where(UserIdentity.user_id == user_id)
                .order_by(UserIdentity.is_primary.desc(), UserIdentity.created_at)
            )
            return result.scalars().all()

        except Exception as e:
            logger.error(f"Error getting identities for user {user_id}: {e}")
            return []

    async def set_primary_identity(self, identity_id: int, user_id: int) -> bool:
        """设置主身份.
        
        Args:
            identity_id: 身份ID
            user_id: 用户ID
            
        Returns:
            bool: 是否成功

        """
        try:
            # 1. 取消当前主身份
            await self.db.execute(
                UserIdentity.__table__.update()
                .where(
                    and_(
                        UserIdentity.user_id == user_id,
                        UserIdentity.is_primary
                    )
                )
                .values(is_primary=False, updated_at=datetime.now(timezone.utc))
            )

            # 2. 设置新主身份
            result = await self.db.execute(
                UserIdentity.__table__.update()
                .where(
                    and_(
                        UserIdentity.id == identity_id,
                        UserIdentity.user_id == user_id
                    )
                )
                .values(is_primary=True, updated_at=datetime.now(timezone.utc))
            )

            await self.db.commit()

            if result.rowcount > 0:
                logger.info(f"Set primary identity {identity_id} for user {user_id}")
                return True
            else:
                logger.warning(f"Identity {identity_id} not found for user {user_id}")
                return False

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error setting primary identity {identity_id} for user {user_id}: {e}")
            return False

    async def link_identity_to_user(self, identity_id: int, user_id: int) -> bool:
        """将身份关联到用户.
        
        Args:
            identity_id: 身份ID
            user_id: 用户ID
            
        Returns:
            bool: 是否成功

        """
        try:
            result = await self.db.execute(
                UserIdentity.__table__.update()
                .where(UserIdentity.id == identity_id)
                .values(user_id=user_id, updated_at=datetime.now(timezone.utc))
            )

            await self.db.commit()

            if result.rowcount > 0:
                logger.info(f"Linked identity {identity_id} to user {user_id}")
                return True
            else:
                logger.warning(f"Identity {identity_id} not found")
                return False

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error linking identity {identity_id} to user {user_id}: {e}")
            return False

    async def search_identities(
        self,
        query: str,
        platform: Optional[str] = None,
        limit: int = 20
    ) -> list[UserIdentity]:
        """搜索身份.
        
        Args:
            query: 搜索关键词
            platform: 平台过滤（可选）
            limit: 结果限制
            
        Returns:
            List[UserIdentity]: 搜索结果

        """
        try:
            conditions = [
                or_(
                    UserIdentity.platform_username.ilike(f"%{query}%"),
                    UserIdentity.display_name.ilike(f"%{query}%"),
                    UserIdentity.platform_email.ilike(f"%{query}%")
                )
            ]

            if platform:
                conditions.append(UserIdentity.platform == platform)

            result = await self.db.execute(
                select(UserIdentity)
                .where(and_(*conditions))
                .order_by(UserIdentity.is_primary.desc(), UserIdentity.last_activity_at.desc())
                .limit(limit)
            )

            return result.scalars().all()

        except Exception as e:
            logger.error(f"Error searching identities with query '{query}': {e}")
            return []

    async def get_identity_stats(self) -> dict[str, Any]:
        """获取身份统计信息.
        
        Returns:
            Dict[str, Any]: 统计信息

        """
        try:
            # 总身份数
            total_result = await self.db.execute(
                select(UserIdentity.id).count()
            )
            total_identities = total_result.scalar()

            # 已验证身份数
            verified_result = await self.db.execute(
                select(UserIdentity.id)
                .where(UserIdentity.status == IdentityStatus.VERIFIED.value)
                .count()
            )
            verified_identities = verified_result.scalar()

            # 平台分布
            platform_result = await self.db.execute(
                select(UserIdentity.platform, UserIdentity.id.count())
                .group_by(UserIdentity.platform)
            )
            platform_distribution = dict(platform_result.fetchall())

            # 关联用户数
            linked_result = await self.db.execute(
                select(UserIdentity.user_id)
                .where(UserIdentity.user_id.isnot(None))
                .distinct()
                .count()
            )
            linked_users = linked_result.scalar()

            return {
                "total_identities": total_identities,
                "verified_identities": verified_identities,
                "platform_distribution": platform_distribution,
                "linked_users": linked_users,
                "verification_rate": verified_identities / total_identities if total_identities > 0 else 0
            }

        except Exception as e:
            logger.error(f"Error getting identity stats: {e}")
            return {}

    async def cleanup_orphaned_identities(self) -> int:
        """清理孤立的身份记录.
        
        Returns:
            int: 清理的记录数

        """
        try:
            # 删除超过90天未验证的待验证身份
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=90)

            result = await self.db.execute(
                UserIdentity.__table__.delete()
                .where(
                    and_(
                        UserIdentity.status == IdentityStatus.PENDING.value,
                        UserIdentity.created_at < cutoff_date,
                        UserIdentity.user_id.is_(None)
                    )
                )
            )

            await self.db.commit()
            cleaned_count = result.rowcount

            if cleaned_count > 0:
                logger.info(f"Cleaned up {cleaned_count} orphaned identities")

            return cleaned_count

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error cleaning up orphaned identities: {e}")
            return 0

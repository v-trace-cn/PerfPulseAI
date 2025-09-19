#!/usr/bin/env python3
"""
迁移用户数据到user_identities表
"""
import asyncio
import sys
import logging
from datetime import datetime
from sqlalchemy import text, select

# 添加项目根目录到Python路径
sys.path.insert(0, '.')

from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.user_identity import UserIdentity, IdentityPlatform, IdentityStatus

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class UserIdentityMigrator:
    """用户身份迁移器"""

    def __init__(self):
        self.stats = {
            'users_processed': 0,
            'identities_created': 0,
            'errors': []
        }

    async def migrate_user_identities(self):
        """迁移用户身份数据"""
        logger.info("🚀 开始迁移用户身份数据")
        
        async with AsyncSessionLocal() as db:
            try:
                # 1. 获取所有用户
                result = await db.execute(select(User))
                users = result.scalars().all()
                
                logger.info(f"📊 找到 {len(users)} 个用户")
                
                if not users:
                    logger.warning("没有找到用户记录")
                    return
                
                # 2. 为每个用户创建身份记录
                for user in users:
                    await self._create_user_identity(db, user)
                    self.stats['users_processed'] += 1
                
                await db.commit()
                logger.info("✅ 用户身份迁移完成")
                self._print_stats()
                
            except Exception as e:
                await db.rollback()
                logger.error(f"❌ 迁移失败: {e}")
                self.stats['errors'].append(str(e))
                raise

    async def _create_user_identity(self, db, user):
        """为用户创建身份记录"""
        try:
            logger.info(f"🔄 处理用户: {user.id} - {user.name}")
            
            # 检查是否已存在身份记录
            existing_result = await db.execute(
                select(UserIdentity).where(UserIdentity.user_id == user.id)
            )
            existing_identities = existing_result.scalars().all()
            
            if existing_identities:
                logger.info(f"  ⚠️ 用户 {user.id} 已有 {len(existing_identities)} 个身份记录，跳过")
                return
            
            # 从GitHub URL提取用户名
            github_username = None
            if user.github_url:
                # 从 https://github.com/username 提取 username
                if 'github.com/' in user.github_url:
                    github_username = user.github_url.split('github.com/')[-1].strip('/')
                    if '/' in github_username:  # 如果有多个斜杠，取第一个
                        github_username = github_username.split('/')[0]

            # 如果没有正确的GitHub URL格式，跳过该用户
            if not github_username:
                logger.info(f"  ⚠️ 用户 {user.id} 没有有效的GitHub URL，跳过")
                return
            
            # 创建GitHub身份
            github_identity = UserIdentity(
                user_id=user.id,
                platform=IdentityPlatform.GITHUB.value,  # 转换为字符串
                platform_username=github_username,
                platform_email=user.email,
                platform_url=user.github_url or f"https://github.com/{github_username}",
                platform_avatar_url=user.avatar_url,
                status=IdentityStatus.VERIFIED.value,  # 转换为字符串
                is_primary=True,
                is_public=True,
                display_name=user.name,
                created_at=datetime.utcnow().replace(microsecond=0)
            )
            
            db.add(github_identity)
            self.stats['identities_created'] += 1
            
            logger.info(f"  ✅ 为用户 {user.id} 创建GitHub身份: {github_username}")
            
        except Exception as e:
            logger.error(f"❌ 为用户 {user.id} 创建身份失败: {e}")
            self.stats['errors'].append(f"用户 {user.id}: {str(e)}")

    def _print_stats(self):
        """打印统计信息"""
        logger.info("📊 迁移统计:")
        logger.info(f"  处理的用户数量: {self.stats['users_processed']}")
        logger.info(f"  创建的身份记录: {self.stats['identities_created']}")
        logger.info(f"  错误数量: {len(self.stats['errors'])}")
        
        if self.stats['errors']:
            logger.error("错误详情:")
            for error in self.stats['errors']:
                logger.error(f"  - {error}")


async def main():
    """主函数"""
    migrator = UserIdentityMigrator()
    await migrator.migrate_user_identities()


if __name__ == "__main__":
    asyncio.run(main())

#!/usr/bin/env python3
"""
积分数据迁移脚本
将现有的 ScoreEntry 数据迁移到新的积分系统
"""

import asyncio
import sys
import os
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from app.core.database import AsyncSessionLocal
from app.models.scoring import ScoreEntry, PointTransaction, TransactionType, UserLevel
from app.models.user import User
from app.services.point_service import PointService
from datetime import datetime, timedelta
import uuid
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def migrate_score_entries():
    """迁移 ScoreEntry 数据到 PointTransaction"""
    async with AsyncSessionLocal() as db:
        try:
            # 1. 备份当前用户积分
            logger.info("开始备份用户积分数据...")
            await db.execute(text("""
                CREATE TABLE IF NOT EXISTS user_points_backup AS 
                SELECT id, points, level, level_id, created_at 
                FROM users
            """))
            
            # 2. 获取所有 ScoreEntry 记录
            logger.info("获取所有评分记录...")
            result = await db.execute(
                select(ScoreEntry).order_by(ScoreEntry.user_id, ScoreEntry.created_at)
            )
            score_entries = result.scalars().all()
            logger.info(f"找到 {len(score_entries)} 条评分记录")
            
            # 3. 按用户分组处理
            user_balances = {}
            migration_count = 0
            
            for entry in score_entries:
                user_id = entry.user_id
                
                # 初始化用户余额
                if user_id not in user_balances:
                    user_balances[user_id] = 0
                
                # 计算新余额
                user_balances[user_id] += entry.score
                
                # 创建积分交易记录
                transaction = PointTransaction(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    transaction_type=TransactionType.EARN,
                    amount=entry.score,
                    balance_after=user_balances[user_id],
                    reference_id=entry.activity_id,
                    reference_type='activity',
                    description=f"活动积分: {entry.notes}" if entry.notes else "活动积分",
                    dispute_deadline=entry.created_at + timedelta(days=90) if entry.created_at else datetime.utcnow() + timedelta(days=90),
                    created_at=entry.created_at or datetime.utcnow()
                )
                
                db.add(transaction)
                migration_count += 1
                
                if migration_count % 100 == 0:
                    logger.info(f"已迁移 {migration_count} 条记录...")
            
            # 4. 更新用户积分余额
            logger.info("更新用户积分余额...")
            for user_id, balance in user_balances.items():
                await db.execute(
                    text("UPDATE users SET points = :balance WHERE id = :user_id"),
                    {"balance": balance, "user_id": user_id}
                )
            
            # 5. 更新用户等级
            logger.info("更新用户等级...")
            await db.execute(text("""
                UPDATE users 
                SET level_id = (
                    SELECT ul.id 
                    FROM user_levels ul 
                    WHERE users.points >= ul.min_points 
                    AND (ul.max_points IS NULL OR users.points <= ul.max_points)
                    ORDER BY ul.min_points DESC 
                    LIMIT 1
                )
                WHERE points > 0
            """))
            
            # 设置默认等级
            await db.execute(text("""
                UPDATE users 
                SET level_id = 'level_1'
                WHERE points = 0 AND level_id IS NULL
            """))
            
            await db.commit()
            logger.info(f"数据迁移完成！共迁移 {migration_count} 条记录，涉及 {len(user_balances)} 个用户")
            
        except Exception as e:
            await db.rollback()
            logger.error(f"数据迁移失败: {e}")
            raise


async def verify_migration():
    """验证迁移结果"""
    async with AsyncSessionLocal() as db:
        # 检查数据一致性
        result = await db.execute(text("""
            SELECT 
                u.id as user_id,
                u.name as user_name,
                u.points as user_points,
                COALESCE(SUM(pt.amount), 0) as calculated_points,
                u.points - COALESCE(SUM(pt.amount), 0) as difference
            FROM users u
            LEFT JOIN point_transactions pt ON u.id = pt.user_id
            GROUP BY u.id, u.name, u.points
            HAVING ABS(u.points - COALESCE(SUM(pt.amount), 0)) > 0
        """))
        
        inconsistent_users = result.fetchall()
        
        if inconsistent_users:
            logger.warning(f"发现 {len(inconsistent_users)} 个用户的积分不一致:")
            for user in inconsistent_users:
                logger.warning(f"用户 {user.user_name} (ID: {user.user_id}): "
                             f"用户积分={user.user_points}, 计算积分={user.calculated_points}, "
                             f"差异={user.difference}")
        else:
            logger.info("所有用户积分数据一致性检查通过！")


async def rollback_migration():
    """回滚迁移"""
    async with AsyncSessionLocal() as db:
        try:
            logger.info("开始回滚迁移...")
            
            # 恢复用户积分
            await db.execute(text("""
                UPDATE users 
                SET points = (
                    SELECT points 
                    FROM user_points_backup 
                    WHERE user_points_backup.id = users.id
                ),
                level_id = (
                    SELECT level_id 
                    FROM user_points_backup 
                    WHERE user_points_backup.id = users.id
                )
                WHERE EXISTS (
                    SELECT 1 
                    FROM user_points_backup 
                    WHERE user_points_backup.id = users.id
                )
            """))
            
            # 删除迁移的交易记录
            await db.execute(text("""
                DELETE FROM point_transactions 
                WHERE reference_type = 'activity' 
                AND transaction_type = 'EARN'
            """))
            
            await db.commit()
            logger.info("迁移回滚完成！")
            
        except Exception as e:
            await db.rollback()
            logger.error(f"回滚失败: {e}")
            raise


async def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("用法: python migrate_points_data.py [migrate|verify|rollback]")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "migrate":
        await migrate_score_entries()
        await verify_migration()
    elif command == "verify":
        await verify_migration()
    elif command == "rollback":
        await rollback_migration()
    else:
        print("无效命令。支持的命令: migrate, verify, rollback")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

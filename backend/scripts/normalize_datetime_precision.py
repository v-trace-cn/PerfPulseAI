#!/usr/bin/env python3
"""
时间精度标准化脚本

将系统中所有时间字段统一为秒级精度，移除不必要的微秒精度。
这样可以：
1. 减少存储空间
2. 提高查询性能  
3. 简化时间比较逻辑
4. 统一时间显示格式
"""

import asyncio
import sys
import os
from datetime import datetime, timezone
from sqlalchemy import text, select, func
from sqlalchemy.ext.asyncio import AsyncSession

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import get_db, async_engine
from app.models.user import User
from app.models.activity import Activity
from app.models.company import Company
from app.models.department import Department
from app.models.role import Role
from app.models.notification import Notification
from app.models.reward import Reward
from app.models.scoring import ScoringFactor, ScoreEntry, PointTransaction, PointDispute, PointPurchase


class DateTimePrecisionNormalizer:
    """时间精度标准化器"""
    
    def __init__(self):
        self.tables_to_normalize = [
            # 表名, 时间字段列表
            ('users', ['created_at', 'updated_at']),
            ('activities', ['created_at', 'completed_at', 'updated_at']),
            ('companies', ['created_at', 'updated_at']),
            ('departments', ['created_at', 'updated_at']),
            ('roles', ['created_at', 'updated_at']),
            ('notifications', ['created_at', 'read_at']),
            ('rewards', ['created_at', 'updated_at']),
            ('scoring_factors', ['created_at', 'updated_at']),
            ('score_entries', ['created_at']),
            ('point_transactions', ['created_at', 'dispute_deadline']),
            ('point_disputes', ['created_at', 'resolved_at']),
            ('point_purchases', ['created_at', 'updated_at']),
            ('pull_request_results', ['updated_at']),

        ]
    
    async def analyze_precision_usage(self, db: AsyncSession):
        """分析当前数据库中时间精度的使用情况"""
        print("🔍 分析时间精度使用情况...")

        # 检测数据库类型
        dialect_name = db.bind.dialect.name
        print(f"🔍 检测到数据库类型: {dialect_name}")

        total_records = 0
        microsecond_records = 0

        for table_name, datetime_columns in self.tables_to_normalize:
            try:
                # 检查表是否存在（兼容不同数据库）
                if dialect_name == 'sqlite':
                    table_exists_query = f"""
                        SELECT COUNT(*) FROM sqlite_master
                        WHERE type='table' AND name='{table_name}'
                    """
                else:
                    table_exists_query = f"""
                        SELECT COUNT(*) FROM information_schema.tables
                        WHERE table_name = '{table_name}'
                    """

                result = await db.execute(text(table_exists_query))
                if result.scalar() == 0:
                    print(f"⚠️  表 {table_name} 不存在，跳过")
                    continue

                for column in datetime_columns:
                    # 检查列是否存在（兼容不同数据库）
                    if dialect_name == 'sqlite':
                        # SQLite 使用 PRAGMA table_info
                        col_result = await db.execute(text(f"PRAGMA table_info({table_name})"))
                        columns_info = col_result.fetchall()
                        column_exists = any(col[1] == column for col in columns_info)
                    else:
                        col_result = await db.execute(text(f"""
                            SELECT COUNT(*) FROM information_schema.columns
                            WHERE table_name = '{table_name}' AND column_name = '{column}'
                        """))
                        column_exists = col_result.scalar() > 0

                    if not column_exists:
                        print(f"⚠️  列 {table_name}.{column} 不存在，跳过")
                        continue

                    # 统计总记录数
                    total_result = await db.execute(text(f"""
                        SELECT COUNT(*) FROM {table_name}
                        WHERE {column} IS NOT NULL
                    """))
                    table_total = total_result.scalar() or 0
                    total_records += table_total

                    # 统计包含微秒的记录数（兼容不同数据库）
                    if dialect_name == 'sqlite':
                        # SQLite 检查是否包含小数点（简化检测）
                        microsecond_result = await db.execute(text(f"""
                            SELECT COUNT(*) FROM {table_name}
                            WHERE {column} IS NOT NULL
                            AND {column} LIKE '%.%'
                        """))
                    else:
                        microsecond_result = await db.execute(text(f"""
                            SELECT COUNT(*) FROM {table_name}
                            WHERE {column} IS NOT NULL
                            AND EXTRACT(microseconds FROM {column}) > 0
                        """))

                    table_microseconds = microsecond_result.scalar() or 0
                    microsecond_records += table_microseconds

                    if table_total > 0:
                        percentage = (table_microseconds / table_total) * 100
                        print(f"📊 {table_name}.{column}: {table_microseconds}/{table_total} ({percentage:.1f}%) 包含微秒")

            except Exception as e:
                print(f"❌ 分析表 {table_name} 时出错: {e}")

        if total_records > 0:
            overall_percentage = (microsecond_records / total_records) * 100
            print(f"\n📈 总体统计: {microsecond_records}/{total_records} ({overall_percentage:.1f}%) 记录包含微秒精度")
            print(f"💾 预计节省存储空间: ~{microsecond_records * 4} 字节 (每个微秒字段4字节)")

        return total_records, microsecond_records
    
    async def normalize_table_precision(self, db: AsyncSession, table_name: str, datetime_columns: list):
        """标准化单个表的时间精度"""
        try:
            # 检测数据库类型
            dialect_name = db.bind.dialect.name

            # 检查表是否存在（兼容不同数据库）
            if dialect_name == 'sqlite':
                table_exists_query = f"""
                    SELECT COUNT(*) FROM sqlite_master
                    WHERE type='table' AND name='{table_name}'
                """
            else:
                table_exists_query = f"""
                    SELECT COUNT(*) FROM information_schema.tables
                    WHERE table_name = '{table_name}'
                """

            result = await db.execute(text(table_exists_query))
            if result.scalar() == 0:
                print(f"⚠️  表 {table_name} 不存在，跳过")
                return 0

            updated_count = 0

            for column in datetime_columns:
                # 检查列是否存在（兼容不同数据库）
                if dialect_name == 'sqlite':
                    # SQLite 使用 PRAGMA table_info
                    col_result = await db.execute(text(f"PRAGMA table_info({table_name})"))
                    columns_info = col_result.fetchall()
                    column_exists = any(col[1] == column for col in columns_info)
                else:
                    col_result = await db.execute(text(f"""
                        SELECT COUNT(*) FROM information_schema.columns
                        WHERE table_name = '{table_name}' AND column_name = '{column}'
                    """))
                    column_exists = col_result.scalar() > 0

                if not column_exists:
                    print(f"⚠️  列 {table_name}.{column} 不存在，跳过")
                    continue

                # 更新时间精度：移除微秒部分（兼容不同数据库）
                if dialect_name == 'sqlite':
                    # SQLite: 使用 datetime() 函数移除微秒
                    # 先获取包含微秒的记录数
                    count_result = await db.execute(text(f"""
                        SELECT COUNT(*) FROM {table_name}
                        WHERE {column} IS NOT NULL
                        AND {column} LIKE '%.%'
                    """))
                    records_to_update = count_result.scalar() or 0

                    if records_to_update > 0:
                        # 使用 SQLite 的 datetime() 函数标准化时间
                        result = await db.execute(text(f"""
                            UPDATE {table_name}
                            SET {column} = datetime(substr({column}, 1, 19))
                            WHERE {column} IS NOT NULL
                            AND {column} LIKE '%.%'
                        """))
                        column_updated = result.rowcount
                    else:
                        column_updated = 0
                else:
                    # PostgreSQL: 使用 date_trunc
                    result = await db.execute(text(f"""
                        UPDATE {table_name}
                        SET {column} = date_trunc('second', {column})
                        WHERE {column} IS NOT NULL
                        AND EXTRACT(microseconds FROM {column}) > 0
                    """))
                    column_updated = result.rowcount

                updated_count += column_updated

                if column_updated > 0:
                    print(f"✅ {table_name}.{column}: 标准化了 {column_updated} 条记录")

            return updated_count

        except Exception as e:
            print(f"❌ 标准化表 {table_name} 时出错: {e}")
            return 0
    
    async def normalize_all_tables(self, db: AsyncSession):
        """标准化所有表的时间精度"""
        print("🔧 开始标准化时间精度...")
        
        total_updated = 0
        
        for table_name, datetime_columns in self.tables_to_normalize:
            updated = await self.normalize_table_precision(db, table_name, datetime_columns)
            total_updated += updated
        
        await db.commit()
        print(f"\n🎉 标准化完成！总共更新了 {total_updated} 条记录")
        return total_updated
    
    async def verify_normalization(self, db: AsyncSession):
        """验证标准化结果"""
        print("🔍 验证标准化结果...")

        # 检测数据库类型
        dialect_name = db.bind.dialect.name

        remaining_microseconds = 0

        for table_name, datetime_columns in self.tables_to_normalize:
            try:
                # 检查表是否存在（兼容不同数据库）
                if dialect_name == 'sqlite':
                    table_exists_query = f"""
                        SELECT COUNT(*) FROM sqlite_master
                        WHERE type='table' AND name='{table_name}'
                    """
                else:
                    table_exists_query = f"""
                        SELECT COUNT(*) FROM information_schema.tables
                        WHERE table_name = '{table_name}'
                    """

                result = await db.execute(text(table_exists_query))
                if result.scalar() == 0:
                    continue

                for column in datetime_columns:
                    # 检查列是否存在（兼容不同数据库）
                    if dialect_name == 'sqlite':
                        # SQLite 使用 PRAGMA table_info
                        col_result = await db.execute(text(f"PRAGMA table_info({table_name})"))
                        columns_info = col_result.fetchall()
                        column_exists = any(col[1] == column for col in columns_info)
                    else:
                        col_result = await db.execute(text(f"""
                            SELECT COUNT(*) FROM information_schema.columns
                            WHERE table_name = '{table_name}' AND column_name = '{column}'
                        """))
                        column_exists = col_result.scalar() > 0

                    if not column_exists:
                        continue

                    # 检查是否还有微秒精度的记录（兼容不同数据库）
                    if dialect_name == 'sqlite':
                        # SQLite 检查是否包含小数点
                        microsecond_result = await db.execute(text(f"""
                            SELECT COUNT(*) FROM {table_name}
                            WHERE {column} IS NOT NULL
                            AND {column} LIKE '%.%'
                        """))
                    else:
                        microsecond_result = await db.execute(text(f"""
                            SELECT COUNT(*) FROM {table_name}
                            WHERE {column} IS NOT NULL
                            AND EXTRACT(microseconds FROM {column}) > 0
                        """))

                    remaining = microsecond_result.scalar() or 0
                    remaining_microseconds += remaining

                    if remaining > 0:
                        print(f"⚠️  {table_name}.{column}: 仍有 {remaining} 条记录包含微秒")

            except Exception as e:
                print(f"❌ 验证表 {table_name} 时出错: {e}")

        if remaining_microseconds == 0:
            print("✅ 验证通过！所有时间字段已标准化为秒级精度")
        else:
            print(f"⚠️  仍有 {remaining_microseconds} 条记录包含微秒精度")

        return remaining_microseconds == 0


async def main():
    """主函数"""
    print("🚀 时间精度标准化脚本启动")
    print("=" * 50)
    
    normalizer = DateTimePrecisionNormalizer()
    
    async with async_engine.begin() as conn:
        db = AsyncSession(bind=conn)
        
        try:
            # 1. 分析当前精度使用情况
            total_records, microsecond_records = await normalizer.analyze_precision_usage(db)
            
            if microsecond_records == 0:
                print("✅ 所有时间字段已经是秒级精度，无需处理")
                return
            
            # 2. 确认是否继续
            print(f"\n📋 将要标准化 {microsecond_records} 条包含微秒精度的记录")
            confirm = input("是否继续？(y/N): ").strip().lower()
            if confirm != 'y':
                print("❌ 用户取消操作")
                return
            
            # 3. 执行标准化
            updated_count = await normalizer.normalize_all_tables(db)
            
            # 4. 验证结果
            success = await normalizer.verify_normalization(db)
            
            if success:
                print("\n🎉 时间精度标准化成功完成！")
                print("💡 建议：更新模型定义以使用统一的秒级精度")
            else:
                print("\n⚠️  标准化可能未完全成功，请检查日志")
        
        except Exception as e:
            await db.rollback()
            print(f"❌ 执行过程中出错: {e}")
            raise
        
        finally:
            await db.close()


if __name__ == "__main__":
    asyncio.run(main())

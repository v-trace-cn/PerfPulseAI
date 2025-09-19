"""Normalize datetime precision to seconds

Revision ID: normalize_datetime_precision
Revises: remove_permissions_system
Create Date: 2025-01-15 12:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = 'normalize_datetime_precision'
down_revision = 'remove_permissions_system'
branch_labels = None
depends_on = None


def upgrade():
    """标准化所有时间字段为秒级精度"""

    # 获取数据库连接
    connection = op.get_bind()

    # 检测数据库类型
    dialect_name = connection.dialect.name
    print(f"检测到数据库类型: {dialect_name}")

    # 定义需要标准化的表和字段
    tables_to_normalize = [
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

    print("🔧 开始标准化时间精度为秒级...")

    total_updated = 0

    for table_name, datetime_columns in tables_to_normalize:
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

            table_exists = connection.execute(text(table_exists_query)).scalar()

            if not table_exists:
                print(f"⚠️  表 {table_name} 不存在，跳过")
                continue

            for column in datetime_columns:
                # 检查列是否存在（兼容不同数据库）
                if dialect_name == 'sqlite':
                    # SQLite 使用 PRAGMA table_info
                    column_info = connection.execute(text(f"PRAGMA table_info({table_name})")).fetchall()
                    column_exists = any(col[1] == column for col in column_info)
                else:
                    column_exists_query = f"""
                        SELECT COUNT(*) FROM information_schema.columns
                        WHERE table_name = '{table_name}' AND column_name = '{column}'
                    """
                    column_exists = connection.execute(text(column_exists_query)).scalar()

                if not column_exists:
                    print(f"⚠️  列 {table_name}.{column} 不存在，跳过")
                    continue

                # 标准化时间精度：移除微秒部分（兼容不同数据库）
                if dialect_name == 'sqlite':
                    # SQLite 使用 datetime() 函数
                    update_query = f"""
                        UPDATE {table_name}
                        SET {column} = datetime({column}, 'start of day',
                                      '+' || (strftime('%s', {column}) - strftime('%s', date({column}))) || ' seconds')
                        WHERE {column} IS NOT NULL
                        AND {column} LIKE '%.%'
                    """
                else:
                    # PostgreSQL 使用 date_trunc
                    update_query = f"""
                        UPDATE {table_name}
                        SET {column} = date_trunc('second', {column})
                        WHERE {column} IS NOT NULL
                        AND EXTRACT(microseconds FROM {column}) > 0
                    """

                result = connection.execute(text(update_query))
                updated_count = result.rowcount
                total_updated += updated_count

                if updated_count > 0:
                    print(f"✅ {table_name}.{column}: 标准化了 {updated_count} 条记录")

        except Exception as e:
            print(f"❌ 处理表 {table_name} 时出错: {e}")
            # 继续处理其他表，不中断整个迁移
            continue

    print(f"🎉 时间精度标准化完成！总共更新了 {total_updated} 条记录")


def downgrade():
    """回滚操作 - 注意：无法恢复原始的微秒精度数据"""
    print("⚠️  注意：时间精度标准化的回滚无法恢复原始的微秒精度数据")
    print("💡 如果需要微秒精度，请考虑从备份恢复数据")
    # 实际上无法真正回滚，因为微秒数据已经丢失
    pass

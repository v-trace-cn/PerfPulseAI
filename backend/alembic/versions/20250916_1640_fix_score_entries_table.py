"""fix score_entries table structure

Revision ID: 20250916_1640_fix_score_entries
Revises: consolidated_002
Create Date: 2025-09-16 16:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20250916_1640_fix_score_entries'
down_revision: Union[str, None] = 'redesign_notification_model'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """修复score_entries表结构，移除无效的criteria_id字段"""
    print("🔧 修复 score_entries 表结构...")
    
    # SQLite不支持直接删除外键约束，需要重建表
    # 1. 创建新的临时表
    op.create_table(
        'score_entries_new',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('activity_id', sa.String(length=200), nullable=True),
        sa.Column('score', sa.Integer(), nullable=False),
        sa.Column('factors', sa.JSON(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['activity_id'], ['activities.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # 2. 复制数据（排除criteria_id字段）
    op.execute("""
        INSERT INTO score_entries_new (id, user_id, activity_id, score, factors, notes, created_at)
        SELECT id, user_id, activity_id, score, factors, notes, created_at
        FROM score_entries
    """)
    
    # 3. 删除旧表
    op.drop_table('score_entries')
    
    # 4. 重命名新表
    op.rename_table('score_entries_new', 'score_entries')
    
    print("✅ score_entries 表结构修复完成")


def downgrade() -> None:
    """恢复原始的score_entries表结构（包含criteria_id字段）"""
    print("🔄 恢复 score_entries 表结构...")
    
    # 重建包含criteria_id的表
    op.create_table(
        'score_entries_old',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('activity_id', sa.String(length=200), nullable=True),
        sa.Column('criteria_id', sa.String(length=36), nullable=True),
        sa.Column('score', sa.Integer(), nullable=False),
        sa.Column('factors', sa.JSON(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['activity_id'], ['activities.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        # 注意：不重建scoring_criteria外键，因为该表不存在
        sa.PrimaryKeyConstraint('id')
    )
    
    # 复制数据
    op.execute("""
        INSERT INTO score_entries_old (id, user_id, activity_id, score, factors, notes, created_at)
        SELECT id, user_id, activity_id, score, factors, notes, created_at
        FROM score_entries
    """)
    
    # 删除新表，重命名旧表
    op.drop_table('score_entries')
    op.rename_table('score_entries_old', 'score_entries')
    
    print("✅ score_entries 表结构恢复完成")

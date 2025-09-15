"""Remove unused tables: scoring_criteria, governance_metrics, reward_suggestions

Revision ID: remove_unused_tables
Revises: remove_permission_assignments
Create Date: 2025-09-15 12:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'remove_unused_tables'
down_revision: Union[str, None] = 'remove_permission_assignments'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    """删除无用的表：scoring_criteria, governance_metrics, reward_suggestions"""
    
    print("🗑️  开始删除无用表...")
    
    # 删除 reward_suggestions 表
    try:
        op.drop_table('reward_suggestions')
        print("✅ 删除表 reward_suggestions")
    except Exception as e:
        print(f"⚠️  表 reward_suggestions 可能不存在: {e}")
    
    # 删除 governance_metrics 表
    try:
        op.drop_table('governance_metrics')
        print("✅ 删除表 governance_metrics")
    except Exception as e:
        print(f"⚠️  表 governance_metrics 可能不存在: {e}")
    
    # 删除 scoring_criteria 表
    try:
        op.drop_table('scoring_criteria')
        print("✅ 删除表 scoring_criteria")
    except Exception as e:
        print(f"⚠️  表 scoring_criteria 可能不存在: {e}")
    
    print("🎉 无用表删除完成！")


def downgrade():
    """重新创建被删除的表"""
    
    print("🔄 重新创建被删除的表...")
    
    # 重新创建 scoring_criteria 表
    op.create_table(
        'scoring_criteria',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=False),
        sa.Column('base_points', sa.Integer(), nullable=True),
        sa.Column('weight', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # 重新创建 governance_metrics 表
    op.create_table(
        'governance_metrics',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('dimension', sa.String(length=50), nullable=False),
        sa.Column('metric_name', sa.String(length=50), nullable=False),
        sa.Column('value', sa.Float(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # 重新创建 reward_suggestions 表
    op.create_table(
        'reward_suggestions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=True),
        sa.Column('reward_id', sa.String(length=36), nullable=True),
        sa.Column('suggestion_text', sa.Text(), nullable=False),
        sa.Column('suggested_value', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(length=100), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=True),
        sa.Column('is_new_reward', sa.Boolean(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['reward_id'], ['rewards.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    
    print("✅ 表重新创建完成")

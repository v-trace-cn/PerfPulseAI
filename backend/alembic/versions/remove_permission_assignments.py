"""Remove permission_assignments table - unused in simplified role-based system

Revision ID: remove_permission_assignments
Revises: normalize_datetime_precision
Create Date: 2025-09-15 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'remove_permission_assignments'
down_revision: Union[str, None] = 'normalize_datetime_precision'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    """删除 permission_assignments 表 - 在简化的基于角色的系统中未使用"""
    
    print("🗑️  删除 permission_assignments 表...")
    
    # 删除索引
    try:
        op.drop_index('ix_perm_assign_company_user_scope_target', table_name='permission_assignments')
        print("✅ 删除索引 ix_perm_assign_company_user_scope_target")
    except Exception as e:
        print(f"⚠️  索引 ix_perm_assign_company_user_scope_target 可能不存在: {e}")
    
    try:
        op.drop_index('ix_perm_assign_company_scope_target', table_name='permission_assignments')
        print("✅ 删除索引 ix_perm_assign_company_scope_target")
    except Exception as e:
        print(f"⚠️  索引 ix_perm_assign_company_scope_target 可能不存在: {e}")
    
    # 删除表
    try:
        op.drop_table('permission_assignments')
        print("✅ 删除表 permission_assignments")
    except Exception as e:
        print(f"⚠️  表 permission_assignments 可能不存在: {e}")
    
    print("🎉 permission_assignments 表删除完成！")


def downgrade():
    """重新创建 permission_assignments 表"""
    
    print("🔄 重新创建 permission_assignments 表...")
    
    op.create_table(
        'permission_assignments',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('scope', sa.String(length=50), nullable=False),
        sa.Column('target_id', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('actions', sa.Text(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id']),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    
    op.create_index(
        'ix_perm_assign_company_scope_target',
        'permission_assignments',
        ['company_id', 'scope', 'target_id']
    )
    op.create_index(
        'ix_perm_assign_company_user_scope_target',
        'permission_assignments',
        ['company_id', 'user_id', 'scope', 'target_id']
    )
    
    print("✅ permission_assignments 表重新创建完成")

"""Remove permissions system - use role-based access control

Revision ID: remove_permissions_system
Revises: 
Create Date: 2025-01-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
# from sqlalchemy.dialects import postgresql  # 未使用

# revision identifiers, used by Alembic.
revision = 'remove_permissions_system'
down_revision = 'consolidated_002'
branch_labels = None
depends_on = None


def upgrade():
    """删除细粒度权限系统，保留基于角色的简单权限判断"""
    
    # 删除角色权限关联表
    try:
        op.drop_table('role_permissions')
    except Exception:
        pass  # 表可能不存在
    
    # 删除权限表
    try:
        op.drop_table('permissions')
    except Exception:
        pass  # 表可能不存在


def downgrade():
    """恢复权限系统（如果需要的话）"""
    
    # 重新创建权限表
    op.create_table('permissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('display_name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('is_system_permission', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    
    # 重新创建角色权限关联表
    op.create_table('role_permissions',
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.Column('permission_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['permission_id'], ['permissions.id'], ),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ),
        sa.PrimaryKeyConstraint('role_id', 'permission_id')
    )

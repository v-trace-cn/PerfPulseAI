"""重新设计通知模型

Revision ID: redesign_notification_model
Revises: 
Create Date: 2025-01-16 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = 'redesign_notification_model'
down_revision = 'add_department_admins'  # 基于最新的部门管理迁移
branch_labels = None
depends_on = None


def upgrade():
    """
    重新设计通知表结构
    
    基于完美主义标准的全新设计：
    1. 清空现有数据（用户已确认）
    2. 重新创建表结构
    3. 添加优化索引
    """
    
    # 删除现有通知表（清空数据）
    op.drop_table('notifications')
    
    # 创建新的通知表
    op.create_table(
        'notifications',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.id'), nullable=False),
        sa.Column('category', sa.Enum(
            'ACHIEVEMENT', 'TRANSACTION', 'SOCIAL', 'SYSTEM', 'WORKFLOW', 'ALERT',
            name='notificationcategory'
        ), nullable=False),
        sa.Column('priority', sa.Enum(
            'CRITICAL', 'HIGH', 'NORMAL', 'LOW',
            name='notificationpriority'
        ), nullable=False, default='NORMAL'),
        sa.Column('status', sa.Enum(
            'PENDING', 'READ', 'ACTED', 'DISMISSED', 'EXPIRED',
            name='notificationstatus'
        ), nullable=False, default='PENDING'),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('summary', sa.String(500), nullable=True),
        sa.Column('payload', sa.JSON, nullable=False),
        sa.Column('action_url', sa.String(500), nullable=True),
        sa.Column('action_label', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('read_at', sa.DateTime, nullable=True),
        sa.Column('acted_at', sa.DateTime, nullable=True),
        sa.Column('expires_at', sa.DateTime, nullable=True),
        sa.Column('source', sa.String(100), nullable=True),
        sa.Column('tags', sa.JSON, nullable=True),
    )
    
    # 创建优化索引
    op.create_index(
        'idx_user_status_created',
        'notifications',
        ['user_id', 'status', 'created_at']
    )
    op.create_index(
        'idx_category_priority',
        'notifications',
        ['category', 'priority']
    )
    op.create_index(
        'idx_expires_at',
        'notifications',
        ['expires_at']
    )
    op.create_index(
        'idx_source_created',
        'notifications',
        ['source', 'created_at']
    )
    op.create_index(
        'idx_user_id',
        'notifications',
        ['user_id']
    )
    op.create_index(
        'idx_status',
        'notifications',
        ['status']
    )
    op.create_index(
        'idx_created_at',
        'notifications',
        ['created_at']
    )


def downgrade():
    """
    回滚到旧的通知表结构
    
    注意：由于数据已清空，这个回滚会创建空的旧表结构
    """
    
    # 删除新表
    op.drop_table('notifications')
    
    # 重新创建旧表结构（空数据）
    op.create_table(
        'notifications',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.id'), nullable=False),
        sa.Column('type', sa.Enum(
            'ANNOUNCEMENT', 'PERSONAL_DATA', 'PERSONAL_BUSINESS', 'REDEMPTION', 'POINTS', 'SYSTEM',
            name='notificationtype'
        ), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('content', sa.Text, nullable=False),
        sa.Column('status', sa.Enum(
            'UNREAD', 'READ', 'ARCHIVED',
            name='notificationstatus_old'
        ), nullable=False, default='UNREAD'),
        sa.Column('extra_data', sa.JSON, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('read_at', sa.DateTime, nullable=True),
    )

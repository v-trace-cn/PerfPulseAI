"""Create notifications table

Revision ID: 003_notifications
Revises: 002_consolidated_points
Create Date: 2025-07-24 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '003_notifications'
down_revision: Union[str, None] = '002_consolidated_points'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create notifications table and related structures."""
    
    # Create notifications table
    op.create_table('notifications',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(20), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='UNREAD'),
        sa.Column('extra_data', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    )
    
    # Create indexes for better performance
    op.create_index('idx_notifications_user_id', 'notifications', ['user_id'])
    op.create_index('idx_notifications_status', 'notifications', ['status'])
    op.create_index('idx_notifications_type', 'notifications', ['type'])
    op.create_index('idx_notifications_created_at', 'notifications', ['created_at'])
    op.create_index('idx_notifications_user_status', 'notifications', ['user_id', 'status'])
    op.create_index('idx_notifications_user_created', 'notifications', ['user_id', 'created_at'])
    
    # Add check constraints for data integrity
    op.create_check_constraint(
        'ck_notifications_status_valid',
        'notifications',
        "status IN ('UNREAD', 'READ', 'ARCHIVED')"
    )
    
    op.create_check_constraint(
        'ck_notifications_type_valid',
        'notifications',
        "type IN ('announcement', 'personal', 'business', 'system', 'points', 'redemption')"
    )
    
    op.create_check_constraint(
        'ck_notifications_read_at_logic',
        'notifications',
        "(status = 'UNREAD' AND read_at IS NULL) OR (status != 'UNREAD' AND read_at IS NOT NULL)"
    )


def downgrade() -> None:
    """Drop notifications table and related structures."""
    
    # Drop indexes
    op.drop_index('idx_notifications_user_created', table_name='notifications')
    op.drop_index('idx_notifications_user_status', table_name='notifications')
    op.drop_index('idx_notifications_created_at', table_name='notifications')
    op.drop_index('idx_notifications_type', table_name='notifications')
    op.drop_index('idx_notifications_status', table_name='notifications')
    op.drop_index('idx_notifications_user_id', table_name='notifications')
    
    # Drop check constraints
    op.drop_constraint('ck_notifications_read_at_logic', 'notifications', type_='check')
    op.drop_constraint('ck_notifications_type_valid', 'notifications', type_='check')
    op.drop_constraint('ck_notifications_status_valid', 'notifications', type_='check')
    
    # Drop table
    op.drop_table('notifications')

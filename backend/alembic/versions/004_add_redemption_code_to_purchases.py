"""Add redemption code to point purchases

Revision ID: 004_redemption_code
Revises: 003_notifications
Create Date: 2025-07-24 11:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '004_redemption_code'
down_revision: Union[str, None] = '003_notifications'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add redemption code column to point_purchases table."""
    
    # Add redemption_code column to point_purchases table
    with op.batch_alter_table('point_purchases', schema=None) as batch_op:
        batch_op.add_column(sa.Column('redemption_code', sa.String(20), nullable=True))
    
    # Create index for redemption code lookups
    op.create_index('idx_point_purchases_redemption_code', 'point_purchases', ['redemption_code'])
    
    # Add unique constraint to ensure redemption codes are unique when not null
    # Using batch_alter_table for SQLite compatibility
    with op.batch_alter_table('point_purchases') as batch_op:
        batch_op.create_unique_constraint(
            'uq_point_purchases_redemption_code',
            ['redemption_code']
        )


def downgrade() -> None:
    """Remove redemption code column from point_purchases table."""
    
    # Drop unique constraint using batch_alter_table for SQLite compatibility
    with op.batch_alter_table('point_purchases') as batch_op:
        batch_op.drop_constraint('uq_point_purchases_redemption_code', type_='unique')
    
    # Drop index
    op.drop_index('idx_point_purchases_redemption_code', table_name='point_purchases')
    
    # Remove redemption_code column
    with op.batch_alter_table('point_purchases', schema=None) as batch_op:
        batch_op.drop_column('redemption_code')

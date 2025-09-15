"""add permission_assignments table

Revision ID: 1eafca209312
Revises: 006_points_company_id
Create Date: 2025-09-12 11:04:27.928747

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1eafca209312'
down_revision: Union[str, None] = '006_points_company_id'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: create permission_assignments only."""
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


def downgrade() -> None:
    """Downgrade schema: drop permission_assignments only."""
    op.drop_index('ix_perm_assign_company_user_scope_target', table_name='permission_assignments')
    op.drop_index('ix_perm_assign_company_scope_target', table_name='permission_assignments')
    op.drop_table('permission_assignments')

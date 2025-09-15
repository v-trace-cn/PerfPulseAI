"""Add is_super_admin to users

Revision ID: consolidated_002
Revises: consolidated_001
Create Date: 2025-09-12 10:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'consolidated_002'
down_revision: Union[str, None] = '1eafca209312'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema to add is_super_admin to users.
    Notes for SQLite:
    - Avoid batch_alter_table to prevent leftover _alembic_tmp_users conflicts.
    - Drop dependent views first; recreate after.
    """
    # Drop dependent view and any leftover temp table from previous failed attempts
    op.execute("DROP VIEW IF EXISTS v_user_points_consistency")
    op.execute("DROP TABLE IF EXISTS _alembic_tmp_users")

    # Use simple ALTER TABLE ADD COLUMN (SQLite supports this)
    op.add_column('users', sa.Column('is_super_admin', sa.Boolean(), nullable=False, server_default=sa.text('0')))

    # Optional: keep server_default=0; removing default on SQLite requires table rebuild, not necessary now

    # Recreate the consistency view (same definition as earlier migration)
    op.execute(
        """
        CREATE VIEW IF NOT EXISTS v_user_points_consistency AS
        SELECT
            u.id as user_id,
            u.name as user_name,
            u.points as user_points,
            COALESCE(SUM(pt.amount), 0) as calculated_points,
            u.points - COALESCE(SUM(pt.amount), 0) as difference,
            CASE
                WHEN u.points = COALESCE(SUM(pt.amount), 0) THEN 'CONSISTENT'
                ELSE 'INCONSISTENT'
            END as status
        FROM users u
        LEFT JOIN point_transactions pt ON u.id = pt.user_id
        GROUP BY u.id, u.name, u.points
        """
    )


def downgrade() -> None:
    """Downgrade schema: remove is_super_admin from users."""
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('is_super_admin')


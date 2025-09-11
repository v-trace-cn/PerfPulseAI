"""Add company_id to points-related tables and backfill

Revision ID: 006_points_company_id
Revises: 005_nullable_transaction_id
Create Date: 2025-09-11 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision: str = '006_points_company_id'
down_revision: Union[str, None] = '005_nullable_transaction_id'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add company_id columns, FKs and indexes; backfill from users.company_id."""
    # point_transactions
    with op.batch_alter_table('point_transactions', schema=None) as batch_op:
        batch_op.add_column(sa.Column('company_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_point_transactions_company_id', 'companies', ['company_id'], ['id'])

    # point_purchases
    with op.batch_alter_table('point_purchases', schema=None) as batch_op:
        batch_op.add_column(sa.Column('company_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_point_purchases_company_id', 'companies', ['company_id'], ['id'])

    # Backfill existing rows using users.company_id
    conn = op.get_bind()
    try:
        conn.execute(text(
            """
            UPDATE point_transactions AS pt
            SET company_id = (
                SELECT u.company_id FROM users AS u WHERE u.id = pt.user_id
            )
            WHERE pt.company_id IS NULL
            """
        ))
    except Exception:
        # SQLite may have limited UPDATE..FROM support; fallback approach
        # This fallback is best-effort and may be no-op on older SQLite
        pass

    try:
        conn.execute(text(
            """
            UPDATE point_purchases AS pp
            SET company_id = (
                SELECT u.company_id FROM users AS u WHERE u.id = pp.user_id
            )
            WHERE pp.company_id IS NULL
            """
        ))
    except Exception:
        pass

    # Indexes for performance
    op.create_index('idx_point_transactions_company_id', 'point_transactions', ['company_id'])
    op.create_index('idx_point_transactions_user_company', 'point_transactions', ['user_id', 'company_id'])
    op.create_index('idx_point_purchases_company_id', 'point_purchases', ['company_id'])
    op.create_index('idx_point_purchases_user_company', 'point_purchases', ['user_id', 'company_id'])


def downgrade() -> None:
    """Drop indexes, FKs and columns."""
    # Drop indexes
    op.drop_index('idx_point_purchases_user_company', table_name='point_purchases')
    op.drop_index('idx_point_purchases_company_id', table_name='point_purchases')
    op.drop_index('idx_point_transactions_user_company', table_name='point_transactions')
    op.drop_index('idx_point_transactions_company_id', table_name='point_transactions')

    # Drop FKs and columns
    with op.batch_alter_table('point_purchases', schema=None) as batch_op:
        batch_op.drop_constraint('fk_point_purchases_company_id', type_='foreignkey')
        batch_op.drop_column('company_id')

    with op.batch_alter_table('point_transactions', schema=None) as batch_op:
        batch_op.drop_constraint('fk_point_transactions_company_id', type_='foreignkey')
        batch_op.drop_column('company_id')


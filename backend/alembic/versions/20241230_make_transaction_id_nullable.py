"""Make transaction_id nullable in point_purchases

Revision ID: 005_nullable_transaction_id
Revises: 004_redemption_code

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '005_nullable_transaction_id'
down_revision = '004_redemption_code'
branch_labels = None
depends_on = None


def upgrade():
    """Make transaction_id nullable to support free items"""
    # SQLite 不支持直接修改列约束，需要重建表
    with op.batch_alter_table('point_purchases', schema=None) as batch_op:
        batch_op.alter_column('transaction_id',
                             existing_type=sa.String(36),
                             nullable=True)


def downgrade():
    """Revert transaction_id to not nullable"""
    # 注意：在回滚之前，需要确保所有 transaction_id 为 NULL 的记录都有有效的 transaction_id
    # 或者删除这些记录，否则回滚会失败
    with op.batch_alter_table('point_purchases', schema=None) as batch_op:
        batch_op.alter_column('transaction_id',
                             existing_type=sa.String(36),
                             nullable=False)

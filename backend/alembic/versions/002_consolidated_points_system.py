"""Consolidated points system setup with migration and optimization

Revision ID: 002_consolidated_points
Revises: consolidated_001
Create Date: 2025-07-24 10:00:00.000000

"""
from typing import Sequence, Union
import uuid
from datetime import datetime, timedelta

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = '002_consolidated_points'
down_revision: Union[str, None] = 'consolidated_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create complete points system with optimization and migration."""
    
    # ========== PART 1: CREATE TABLES ==========
    
    # 1. Create user_levels table
    op.create_table('user_levels',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('min_points', sa.Integer(), nullable=False),
        sa.Column('max_points', sa.Integer(), nullable=True),
        sa.Column('benefits', sa.JSON(), nullable=True),
        sa.Column('icon', sa.String(100), nullable=True),
        sa.Column('color', sa.String(20), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    
    # 2. Create point_transactions table
    op.create_table('point_transactions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('transaction_type', sa.Enum('EARN', 'SPEND', 'ADJUST', 'OBJECTION', name='transactiontype'), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('balance_after', sa.Integer(), nullable=False),
        sa.Column('reference_id', sa.String(36), nullable=True),
        sa.Column('reference_type', sa.String(50), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('extra_data', sa.JSON(), nullable=True),
        sa.Column('dispute_deadline', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    )
    
    # 3. Create point_disputes table
    op.create_table('point_disputes',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('transaction_id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('requested_amount', sa.Integer(), nullable=True),
        sa.Column('status', sa.Enum('PENDING', 'APPROVED', 'REJECTED', name='disputestatus'), nullable=True),
        sa.Column('admin_response', sa.Text(), nullable=True),
        sa.Column('admin_user_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['transaction_id'], ['point_transactions.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['admin_user_id'], ['users.id'], ),
    )
    
    # 4. Create point_purchases table
    op.create_table('point_purchases',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('item_id', sa.String(36), nullable=False),
        sa.Column('item_name', sa.String(200), nullable=False),
        sa.Column('item_description', sa.Text(), nullable=True),
        sa.Column('points_cost', sa.Integer(), nullable=False),
        sa.Column('transaction_id', sa.String(36), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'COMPLETED', 'CANCELLED', name='purchasestatus'), nullable=True),
        sa.Column('delivery_info', sa.JSON(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['transaction_id'], ['point_transactions.id'], ),
    )
    
    # 5. Add level_id column to users table
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('level_id', sa.String(36), nullable=True))
        batch_op.create_foreign_key('fk_users_level_id', 'user_levels', ['level_id'], ['id'])
    
    # ========== PART 2: ADD CONSTRAINTS ==========

    # Note: SQLite doesn't support adding constraints after table creation
    # Unique constraints are already defined in table creation above
    
    # Check constraints for data integrity
    # Note: SQLite doesn't support adding check constraints after table creation
    # Check constraints should be defined in table creation above

    # ========== PART 3: CREATE INDEXES ==========

    # Basic performance indexes
    op.create_index('idx_point_transactions_user_id', 'point_transactions', ['user_id'])
    op.create_index('idx_point_transactions_created_at', 'point_transactions', ['created_at'])
    op.create_index('idx_point_transactions_reference', 'point_transactions', ['reference_id', 'reference_type'])
    op.create_index('idx_point_transactions_user_created', 'point_transactions', ['user_id', 'created_at'])
    op.create_index('idx_point_transactions_balance', 'point_transactions', ['user_id', 'balance_after'])
    op.create_index('idx_point_disputes_user_id', 'point_disputes', ['user_id'])
    op.create_index('idx_point_disputes_status', 'point_disputes', ['status'])
    op.create_index('idx_point_disputes_transaction', 'point_disputes', ['transaction_id'])
    op.create_index('idx_point_purchases_user_id', 'point_purchases', ['user_id'])
    op.create_index('idx_point_purchases_status', 'point_purchases', ['status'])
    op.create_index('idx_point_purchases_transaction', 'point_purchases', ['transaction_id'])

    # Additional performance indexes
    op.create_index('idx_point_transactions_dispute_deadline', 'point_transactions', ['dispute_deadline'])
    op.create_index('idx_point_transactions_type_created', 'point_transactions', ['transaction_type', 'created_at'])
    op.create_index('idx_point_disputes_created_status', 'point_disputes', ['created_at', 'status'])
    op.create_index('idx_point_purchases_created_status', 'point_purchases', ['created_at', 'status'])
    op.create_index('idx_user_levels_points_range', 'user_levels', ['min_points', 'max_points'])

    # ========== PART 4: INSERT DEFAULT DATA ==========

    # Insert default user levels
    op.execute("""
        INSERT INTO user_levels (id, name, min_points, max_points, benefits, icon, color) VALUES
        ('level_1', '新手', 0, 499, '{"description": "刚开始的积分等级"}', 'user', '#94a3b8'),
        ('level_2', '进阶', 500, 1499, '{"description": "有一定积分积累"}', 'star', '#3b82f6'),
        ('level_3', '专家', 1500, 2999, '{"description": "积分达到专家水平"}', 'award', '#8b5cf6'),
        ('level_4', '大师', 3000, 4999, '{"description": "积分大师级别"}', 'crown', '#f59e0b'),
        ('level_5', '传奇', 5000, NULL, '{"description": "传奇级别，无上限"}', 'trophy', '#ef4444')
    """)

    # ========== PART 5: MIGRATE EXISTING DATA ==========

    # Create a connection to execute raw SQL
    connection = op.get_bind()

    # Create backup of current user points
    op.execute("""
        CREATE TABLE IF NOT EXISTS user_points_backup AS
        SELECT id, points, level, created_at
        FROM users
    """)

    # Check if score_entries table exists before migration
    inspector = sa.inspect(connection)
    if 'score_entries' in inspector.get_table_names():
        # Migrate score entries to point transactions
        result = connection.execute(text("""
            SELECT id, user_id, activity_id, score, notes, created_at
            FROM score_entries
            ORDER BY user_id, created_at
        """))

        score_entries = result.fetchall()
        user_balances = {}

        for entry in score_entries:
            user_id = entry[1]
            activity_id = entry[2]
            score = entry[3]
            notes = entry[4]
            created_at = entry[5]

            # Initialize user balance if not exists
            if user_id not in user_balances:
                user_balances[user_id] = 0

            # Calculate new balance
            user_balances[user_id] += score

            # Create point transaction
            transaction_id = str(uuid.uuid4())
            # Parse created_at if it's a string, otherwise use current time
            if created_at:
                if isinstance(created_at, str):
                    try:
                        created_dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    except:
                        created_dt = datetime.utcnow()
                else:
                    created_dt = created_at
                dispute_deadline = created_dt + timedelta(days=90)
            else:
                dispute_deadline = datetime.utcnow() + timedelta(days=90)

            connection.execute(text("""
                INSERT INTO point_transactions (
                    id, user_id, transaction_type, amount, balance_after,
                    reference_id, reference_type, description,
                    dispute_deadline, created_at
                ) VALUES (
                    :transaction_id, :user_id, 'EARN', :amount, :balance_after,
                    :reference_id, 'activity', :description,
                    :dispute_deadline, :created_at
                )
            """), {
                'transaction_id': transaction_id,
                'user_id': user_id,
                'amount': score,
                'balance_after': user_balances[user_id],
                'reference_id': activity_id,
                'description': f"活动积分: {notes}" if notes else "活动积分",
                'dispute_deadline': dispute_deadline,
                'created_at': created_at or datetime.utcnow()
            })

        # Update user points to match calculated balances
        for user_id, balance in user_balances.items():
            connection.execute(text("""
                UPDATE users
                SET points = :balance
                WHERE id = :user_id
            """), {
                'balance': balance,
                'user_id': user_id
            })

    # Update user levels based on point balances
    connection.execute(text("""
        UPDATE users
        SET level_id = (
            SELECT ul.id
            FROM user_levels ul
            WHERE users.points >= ul.min_points
            AND (ul.max_points IS NULL OR users.points <= ul.max_points)
            ORDER BY ul.min_points DESC
            LIMIT 1
        )
        WHERE points > 0
    """))

    # Set default level for users with 0 points
    connection.execute(text("""
        UPDATE users
        SET level_id = 'level_1'
        WHERE points = 0 AND level_id IS NULL
    """))

    # Create consistency check view for monitoring
    op.execute("""
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
    """)


def downgrade() -> None:
    """Remove complete points system and restore original state."""

    # Drop consistency check view
    op.execute("DROP VIEW IF EXISTS v_user_points_consistency")

    # Restore user points from backup if exists
    try:
        op.execute("""
            UPDATE users
            SET points = (
                SELECT points
                FROM user_points_backup
                WHERE user_points_backup.id = users.id
            ),
            level_id = NULL
            WHERE EXISTS (
                SELECT 1
                FROM user_points_backup
                WHERE user_points_backup.id = users.id
            )
        """)
    except:
        # If backup doesn't exist, just clear level_id
        pass

    # Remove foreign key and column from users table
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_constraint('fk_users_level_id', type_='foreignkey')
        batch_op.drop_column('level_id')

    # Drop all indexes
    op.drop_index('idx_user_levels_points_range', table_name='user_levels')
    op.drop_index('idx_point_purchases_created_status', table_name='point_purchases')
    op.drop_index('idx_point_disputes_created_status', table_name='point_disputes')
    op.drop_index('idx_point_transactions_type_created', table_name='point_transactions')
    op.drop_index('idx_point_transactions_dispute_deadline', table_name='point_transactions')
    op.drop_index('idx_point_purchases_transaction', table_name='point_purchases')
    op.drop_index('idx_point_purchases_status', table_name='point_purchases')
    op.drop_index('idx_point_purchases_user_id', table_name='point_purchases')
    op.drop_index('idx_point_disputes_transaction', table_name='point_disputes')
    op.drop_index('idx_point_disputes_status', table_name='point_disputes')
    op.drop_index('idx_point_disputes_user_id', table_name='point_disputes')
    op.drop_index('idx_point_transactions_balance', table_name='point_transactions')
    op.drop_index('idx_point_transactions_user_created', table_name='point_transactions')
    op.drop_index('idx_point_transactions_reference', table_name='point_transactions')
    op.drop_index('idx_point_transactions_created_at', table_name='point_transactions')
    op.drop_index('idx_point_transactions_user_id', table_name='point_transactions')

    # Note: SQLite constraints are dropped automatically when tables are dropped
    # No need to explicitly drop constraints in SQLite

    # Drop all tables
    op.drop_table('point_purchases')
    op.drop_table('point_disputes')
    op.drop_table('point_transactions')
    op.drop_table('user_levels')

    # Drop backup table
    op.execute("DROP TABLE IF EXISTS user_points_backup")

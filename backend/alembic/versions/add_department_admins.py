"""Add admin_user_ids field to departments table

Revision ID: add_department_admins
Revises: remove_unused_tables
Create Date: 2025-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = 'add_department_admins'
down_revision = 'remove_unused_tables'
branch_labels = None
depends_on = None


def upgrade():
    """Add admin_user_ids field to departments table"""
    # Add admin_user_ids column to store department administrators
    # Using JSON field to store array of user IDs
    op.add_column('departments', sa.Column('admin_user_ids', sa.Text, nullable=True))
    
    # Set default empty array for existing departments
    op.execute("UPDATE departments SET admin_user_ids = '[]' WHERE admin_user_ids IS NULL")


def downgrade():
    """Remove admin_user_ids field from departments table"""
    op.drop_column('departments', 'admin_user_ids')

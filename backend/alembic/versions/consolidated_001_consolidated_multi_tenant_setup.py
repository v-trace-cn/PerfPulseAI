"""Consolidated multi-tenant setup

Revision ID: consolidated_001
Revises: 097061bb15b8
Create Date: 2025-07-15 10:00:00.000000

This migration consolidates the following migrations:
- 52677f20be87_add_multi_tenant_permission_models.py
- 5b3f8fcdfbab_add_missing_company_id_columns.py
- 2db79a9ef83a_add_invite_code_to_companies.py
- add_creator_user_id_to_companies.py

Note: Skips organization models (members, teams, etc.) as we're using departments instead.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'consolidated_001'
down_revision: Union[str, None] = '097061bb15b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    
    # 1. Create companies table
    op.create_table('companies',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('domain', sa.String(length=100), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('invite_code', sa.String(length=20), nullable=True),
        sa.Column('creator_user_id', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('domain'),
        sa.UniqueConstraint('name')
    )
    
    # 2. Create permissions table
    op.create_table('permissions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('display_name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('is_system_permission', sa.Boolean(), nullable=True, default=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    
    # 3. Create roles table
    op.create_table('roles',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('is_system_role', sa.Boolean(), nullable=True, default=False),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # 4. Create role_permissions junction table
    op.create_table('role_permissions',
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.Column('permission_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['permission_id'], ['permissions.id'], ),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ),
        sa.PrimaryKeyConstraint('role_id', 'permission_id')
    )
    
    # 5. Create user_roles junction table
    op.create_table('user_roles',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('user_id', 'role_id')
    )
    
    # 6. Add company_id to departments table
    with op.batch_alter_table('departments', schema=None) as batch_op:
        batch_op.add_column(sa.Column('company_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_departments_company_id', 'companies', ['company_id'], ['id'])

    # 7. Add company_id to users table
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('company_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_users_company_id', 'companies', ['company_id'], ['id'])

    # 8. Generate invite codes for companies (will be done by application logic)
    # Note: Invite codes will be generated when companies are created
    
    # 9. Add unique constraint for invite_code
    with op.batch_alter_table('companies', schema=None) as batch_op:
        batch_op.create_unique_constraint('uq_companies_invite_code', ['invite_code'])


def downgrade() -> None:
    """Downgrade schema."""
    
    # Remove foreign keys and columns from users table
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_constraint('fk_users_company_id', type_='foreignkey')
        batch_op.drop_column('company_id')

    # Remove foreign keys and columns from departments table
    with op.batch_alter_table('departments', schema=None) as batch_op:
        batch_op.drop_constraint('fk_departments_company_id', type_='foreignkey')
        batch_op.drop_column('company_id')

    # Drop junction tables
    op.drop_table('user_roles')
    op.drop_table('role_permissions')
    
    # Drop main tables
    op.drop_table('roles')
    op.drop_table('permissions')
    op.drop_table('companies')

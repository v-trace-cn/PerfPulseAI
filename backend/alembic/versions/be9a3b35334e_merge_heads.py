"""merge heads

Revision ID: be9a3b35334e
Revises: 084a91aa10cd, 0935ec689370
Create Date: 2025-07-03 09:45:31.975008

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'be9a3b35334e'
down_revision: Union[str, None] = ('084a91aa10cd', '0935ec689370')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

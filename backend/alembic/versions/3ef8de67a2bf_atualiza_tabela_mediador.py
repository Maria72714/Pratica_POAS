"""atualiza tabela mediador

Revision ID: 3ef8de67a2bf
Revises: 22f8341113f6
Create Date: 2026-08-20 08:09:23.737153

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3ef8de67a2bf'
down_revision: Union[str, Sequence[str], None] = '22f8341113f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

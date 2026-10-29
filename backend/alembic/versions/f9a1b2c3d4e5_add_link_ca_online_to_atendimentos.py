"""add link_ca_online to atendimentos

Revision ID: f9a1b2c3d4e5
Revises: e8f9a0b1c2d3
Create Date: 2026-10-18 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f9a1b2c3d4e5"
down_revision: Union[str, Sequence[str], None] = "e8f9a0b1c2d3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "atendimentos",
        sa.Column("link_ca_online", sa.String(length=500), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("atendimentos", "link_ca_online")

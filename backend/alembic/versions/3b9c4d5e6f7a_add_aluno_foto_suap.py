"""add_aluno_foto_suap

Revision ID: 3b9c4d5e6f7a
Revises: 2a8b3c4d5e6f
Create Date: 2026-09-05 13:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '3b9c4d5e6f7a'
down_revision: Union[str, Sequence[str], None] = '2a8b3c4d5e6f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('alunos', sa.Column('foto_suap', sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column('alunos', 'foto_suap')

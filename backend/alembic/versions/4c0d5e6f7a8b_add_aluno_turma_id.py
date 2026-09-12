"""add_aluno_turma_id

Revision ID: 4c0d5e6f7a8b
Revises: 3b9c4d5e6f7a
Create Date: 2026-09-12 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '4c0d5e6f7a8b'
down_revision: Union[str, Sequence[str], None] = ('3b9c4d5e6f7a', '7122dc0abf1f')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('alunos', sa.Column('turma_id', sa.String(length=60), nullable=True))


def downgrade() -> None:
    op.drop_column('alunos', 'turma_id')

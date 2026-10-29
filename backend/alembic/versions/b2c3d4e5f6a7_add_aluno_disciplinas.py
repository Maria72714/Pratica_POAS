"""add aluno_disciplinas association

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-10-19 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "aluno_disciplinas",
        sa.Column("aluno_id", sa.Integer(), nullable=False),
        sa.Column("disciplina_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["aluno_id"], ["alunos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["disciplina_id"], ["disciplinas.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("aluno_id", "disciplina_id"),
    )


def downgrade() -> None:
    op.drop_table("aluno_disciplinas")

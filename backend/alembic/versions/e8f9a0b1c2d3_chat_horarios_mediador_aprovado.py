"""chat horarios mediador aprovado

Revision ID: e8f9a0b1c2d3
Revises: 41f62b8f577c
Create Date: 2026-10-18 14:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e8f9a0b1c2d3"
down_revision: Union[str, Sequence[str], None] = "41f62b8f577c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "mediadores",
        sa.Column("aprovado", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.alter_column("mediadores", "aprovado", server_default=None)

    op.create_table(
        "chat_mensagens",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("atendimento_id", sa.Integer(), nullable=False),
        sa.Column("autor_id", sa.Integer(), nullable=False),
        sa.Column("mensagem", sa.String(length=2000), nullable=False),
        sa.Column("criado_em", sa.DateTime(), nullable=False),
        sa.Column("lida", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.ForeignKeyConstraint(["atendimento_id"], ["atendimentos.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["autor_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "professor_horarios",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("id_professor", sa.Integer(), nullable=False),
        sa.Column("dia_semana", sa.String(), nullable=False),
        sa.Column("hora_inicio", sa.String(), nullable=False),
        sa.Column("hora_fim", sa.String(), nullable=False),
        sa.Column("local", sa.String(), nullable=False, server_default="Sala de Professores"),
        sa.Column("modalidade", sa.String(), nullable=False, server_default="Presencial"),
        sa.Column("disciplina", sa.String(), nullable=True),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.ForeignKeyConstraint(["id_professor"], ["professores.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_professor_horarios_id_professor"), "professor_horarios", ["id_professor"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_professor_horarios_id_professor"), table_name="professor_horarios")
    op.drop_table("professor_horarios")
    op.drop_table("chat_mensagens")
    op.drop_column("mediadores", "aprovado")

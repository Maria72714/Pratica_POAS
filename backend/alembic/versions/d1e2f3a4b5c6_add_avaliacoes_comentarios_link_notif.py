"""add link_destino to notificacoes + avaliacoes_ca + comentarios_ca

Revision ID: d1e2f3a4b5c6
Revises: 7a5e4b1d8f2c
Create Date: 2026-11-12 10:00:00.000000

Migração idempotente: alguns ambientes já podem conter a coluna/tabelas (criadas
por ``create_all`` em desenvolvimento), então verificamos a existência antes de
aplicar cada operação.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d1e2f3a4b5c6"
down_revision: Union[str, Sequence[str], None] = "7a5e4b1d8f2c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _colunas(conn, tabela: str) -> set[str]:
    insp = sa.inspect(conn)
    if tabela not in insp.get_table_names():
        return set()
    return {c["name"] for c in insp.get_columns(tabela)}


def _tabela_existe(conn, tabela: str) -> bool:
    return tabela in sa.inspect(conn).get_table_names()


def upgrade() -> None:
    conn = op.get_bind()

    if "link_destino" not in _colunas(conn, "notificacoes"):
        op.add_column(
            "notificacoes",
            sa.Column("link_destino", sa.String(length=300), nullable=True),
        )

    if not _tabela_existe(conn, "avaliacoes_ca"):
        op.create_table(
            "avaliacoes_ca",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("atendimento_id", sa.Integer(), sa.ForeignKey("atendimentos.id", ondelete="CASCADE"), nullable=False),
            sa.Column("aluno_id", sa.Integer(), sa.ForeignKey("alunos.id", ondelete="CASCADE"), nullable=False),
            sa.Column("nota", sa.Integer(), nullable=False),
            sa.Column("comentario", sa.String(length=1000), nullable=True),
            sa.Column("criado_em", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        )
        op.create_index("ix_avaliacoes_ca_atendimento_id", "avaliacoes_ca", ["atendimento_id"])

    if not _tabela_existe(conn, "comentarios_ca"):
        op.create_table(
            "comentarios_ca",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("atendimento_id", sa.Integer(), sa.ForeignKey("atendimentos.id", ondelete="CASCADE"), nullable=False),
            sa.Column("autor_id", sa.Integer(), sa.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False),
            sa.Column("mensagem", sa.String(length=1000), nullable=False),
            sa.Column("criado_em", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        )
        op.create_index("ix_comentarios_ca_atendimento_id", "comentarios_ca", ["atendimento_id"])


def downgrade() -> None:
    conn = op.get_bind()
    if _tabela_existe(conn, "comentarios_ca"):
        op.drop_index("ix_comentarios_ca_atendimento_id", table_name="comentarios_ca")
        op.drop_table("comentarios_ca")
    if _tabela_existe(conn, "avaliacoes_ca"):
        op.drop_index("ix_avaliacoes_ca_atendimento_id", table_name="avaliacoes_ca")
        op.drop_table("avaliacoes_ca")
    if "link_destino" in _colunas(conn, "notificacoes"):
        op.drop_column("notificacoes", "link_destino")

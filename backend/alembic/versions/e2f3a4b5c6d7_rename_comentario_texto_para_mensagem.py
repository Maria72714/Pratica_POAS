"""normaliza comentarios_ca: texto -> mensagem

Revision ID: e2f3a4b5c6d7
Revises: d1e2f3a4b5c6
Create Date: 2026-11-12 10:30:00.000000

Alguns ambientes já possuíam ``comentarios_ca`` criada com a coluna ``texto``
(via ``create_all`` de versões anteriores). Esta migração padroniza o nome da
coluna para ``mensagem``, que é o usado pelos modelos e rotas atuais.

É idempotente: só renomeia se ``texto`` existir e ``mensagem`` ainda não.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e2f3a4b5c6d7"
down_revision: Union[str, Sequence[str], None] = "d1e2f3a4b5c6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _colunas(conn, tabela: str) -> set[str]:
    insp = sa.inspect(conn)
    if tabela not in insp.get_table_names():
        return set()
    return {c["name"] for c in insp.get_columns(tabela)}


def upgrade() -> None:
    conn = op.get_bind()
    cols = _colunas(conn, "comentarios_ca")
    if "texto" in cols and "mensagem" not in cols:
        op.alter_column(
            "comentarios_ca",
            "texto",
            new_column_name="mensagem",
            existing_type=sa.String(length=1500),
            existing_nullable=False,
        )


def downgrade() -> None:
    conn = op.get_bind()
    cols = _colunas(conn, "comentarios_ca")
    if "mensagem" in cols and "texto" not in cols:
        op.alter_column(
            "comentarios_ca",
            "mensagem",
            new_column_name="texto",
            existing_type=sa.String(length=1500),
            existing_nullable=False,
        )

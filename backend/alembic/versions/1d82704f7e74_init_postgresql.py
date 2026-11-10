"""init_postgresql

Revision ID: 1d82704f7e74
Revises: 
Create Date: 2026-09-05 12:05:26.824678

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '1d82704f7e74'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Migração inicial histórica.

    Esta revisão foi reescrita para ser segura em banco vazio e em ambientes
    que já passaram por uma base do schema anterior. O projeto hoje modela
    `professor`/`mediador` via SQLModel e não deve tentar remover essas tabelas
    aqui.
    """
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    # No banco vazio, esta revisão não pode executar drops ou alters porque a
    # base do schema ainda não existe. Em vez disso, ela precisa ser neutra.
    if not tables:
        return

    # Mantém compatibilidade com qualquer ambiente legado em que a revisão foi
    # aplicada antes do projeto estabilizar a cadeia atual.
    if 'usuarios' not in tables:
        return


def downgrade() -> None:
    """Downgrade histórico: não há ação de reversão segura aqui.

    A revisão base antiga continha drops destrutivos que quebravam banco novo.
    Como a árvore de migrations foi reorganizada, este passo fica neutro para
    evitar inconsistência em ambientes novos.
    """
    return

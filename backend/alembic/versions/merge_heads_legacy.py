"""merge legacy heads into a single linear branch

Revision ID: 7a5e4b1d8f2c
Revises: a32d087e1ca4, b2c3d4e5f6a7
Create Date: 2026-11-10 00:00:00.000000

Este arquivo resolve a bifurcação criada pelas duas heads divergentes.
Ele não cria tabelas novas; ele apenas consolida a árvore de migrações.
"""

from typing import Sequence, Union

from alembic import op

revision = "7a5e4b1d8f2c"
down_revision: Union[str, Sequence[str], None] = ("a32d087e1ca4", "b2c3d4e5f6a7")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Merge de compatibilidade: a cadeia foi unificada no ponto final da
    # bifurcação; não há DDL adicional necessário.
    pass


def downgrade() -> None:
    # Não há reversão segura para uma reconciliação sintética de heads.
    pass

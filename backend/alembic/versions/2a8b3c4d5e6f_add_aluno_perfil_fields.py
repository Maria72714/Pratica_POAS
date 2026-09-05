"""add_aluno_perfil_fields

Revision ID: 2a8b3c4d5e6f
Revises: 1d82704f7e74
Create Date: 2026-09-05 13:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '2a8b3c4d5e6f'
down_revision: Union[str, Sequence[str], None] = '1d82704f7e74'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('alunos', sa.Column('curso_id', sa.String(length=50), nullable=True))
    op.add_column('alunos', sa.Column('ano_letivo', sa.String(length=20), nullable=True))
    op.add_column('alunos', sa.Column('necessidades_especiais', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('alunos', sa.Column('perfil_completo', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('alunos', sa.Column('laudo_path', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('alunos', 'laudo_path')
    op.drop_column('alunos', 'perfil_completo')
    op.drop_column('alunos', 'necessidades_especiais')
    op.drop_column('alunos', 'ano_letivo')
    op.drop_column('alunos', 'curso_id')

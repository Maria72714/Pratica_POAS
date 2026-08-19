from sqlmodel import SQLModel, table, Field, Relationship
from typing import List

class HorarioSala(SQLModel, table=True):
    __tablename__ = 'horario_salas'
    horario_id: int | None = Field(primary_key=True, foreign_key='horarios.id', default=None)
    sala_id: int | None = Field(primary_key=True, foreign_key='salas.id', default=None)
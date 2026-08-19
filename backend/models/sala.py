from sqlmodel import SQLModel, table, Field, Relationship
from typing import List
from horario import Horario
from horario_sala import HorarioSala

class Sala(SQLModel, table=True):
    __tablename__ = 'salas'
    id: int | None = Field(default=None, primary_key=True)
    nome: str = Field(max_length=100)

    horarios: List["Horario"] = Relationship(back_populates="salas", link_model=HorarioSala)
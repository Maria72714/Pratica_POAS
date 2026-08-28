from sqlmodel import SQLModel, table, Field, Relationship
from typing import List
from datetime import time
from models.sala import Sala
from models.associativas.horario_sala import HorarioSala

class Horario(SQLModel, table=True):
    __tablename__ = 'horarios'
    id: int | None = Field(default=None, primary_key=True)
    horario_inicio: time
    horario_termino: time

    salas: List["Sala"] = Relationship(back_populates="horarios", link_model=HorarioSala)


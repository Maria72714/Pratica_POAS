from sqlmodel import SQLModel, table, Field
from typing import Optional
from datetime import time

class Horario(SQLModel, table=True):
    __tablename__ = 'horarios'
    id: int | None = Field(default=None, primary_key=True)
    horario_inicio: time
    horario_termino: time


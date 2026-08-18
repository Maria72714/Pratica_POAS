from sqlmodel import SQLModel, table, Field
from typing import Optional
from datetime import time

class Horario(SQLModel, table=True):
    __tablename__ = 'horarios'
    id: Optional[int] = Field(default=None, primary_key=True)
    horario_inicio: time
    horario_termino: time


'''CREATE TABLE horarios(
	id SERIAL PRIMARY KEY,
	horario_inicio TIME NOT NULL,
	horario_termino TIME NOT NULL
);'''
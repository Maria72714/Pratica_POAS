from sqlmodel import SQLModel, Field
from typing import Optional

class ProfessorHorario(SQLModel, table=True):
    __tablename__ = 'professor_horarios'

    id: Optional[int] = Field(default=None, primary_key=True)
    id_professor: int = Field(foreign_key='professores.id', index=True)
    dia_semana: str  # Ex: "Segunda-feira", "Terça-feira", "Quarta-feira", etc.
    hora_inicio: str  # Ex: "14:00"
    hora_fim: str     # Ex: "16:00"
    local: str = Field(default="Sala de Professores")
    modalidade: str = Field(default="Presencial")
    disciplina: Optional[str] = Field(default="Todas as disciplinas")
    ativo: bool = Field(default=True)

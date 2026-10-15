from sqlmodel import Session, select

from models.users.aluno import Aluno
from models.users.user import Usuario


class AlunoRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, aluno_id: int) -> Aluno | None:
        return self.session.get(Aluno, aluno_id)

    def get_by_user_id(self, usuario_id: int) -> Aluno | None:
        return self.session.exec(
            select(Aluno).where(Aluno.id == usuario_id)
        ).first()

    def get_by_matricula(self, matricula: str) -> Aluno | None:
        usuario = self.session.exec(
            select(Usuario).where(Usuario.matricula == matricula)
        ).first()

        if not usuario:
            return None

        return self.get_by_user_id(usuario.id)

    def create(self, aluno: Aluno) -> Aluno:
        self.session.add(aluno)
        self.session.commit()
        self.session.refresh(aluno)
        return aluno

    def update(self, aluno: Aluno) -> Aluno:
        self.session.add(aluno)
        self.session.commit()
        self.session.refresh(aluno)
        return aluno

    def delete(self, aluno: Aluno) -> None:
        self.session.delete(aluno)
        self.session.commit()

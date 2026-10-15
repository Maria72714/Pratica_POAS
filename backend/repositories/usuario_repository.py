from sqlmodel import Session, select

from models.users.user import Usuario
from models.users.professor import Professor
from models.users.mediador import Mediador


class UsuarioRepository:
    def __init__(self, session: Session):
        self.session = session

    def list_all(self) -> list[Usuario]:
        return self.session.exec(select(Usuario)).all()

    def get_by_id(self, usuario_id: int) -> Usuario | None:
        return self.session.get(Usuario, usuario_id)

    def get_by_matricula(self, matricula: str) -> Usuario | None:
        return self.session.exec(
            select(Usuario).where(Usuario.matricula == matricula)
        ).first()

    def get_by_email(self, email: str) -> Usuario | None:
        return self.session.exec(
            select(Usuario).where(Usuario.email == email)
        ).first()

    def get_professor_by_user_id(self, usuario_id: int) -> Professor | None:
        return self.session.exec(
            select(Professor).where(Professor.id == usuario_id)
        ).first()

    def get_mediador_by_user_id(self, usuario_id: int) -> Mediador | None:
        return self.session.exec(
            select(Mediador).where(Mediador.id == usuario_id)
        ).first()

    def get_tipo_usuario(self, usuario_id: int) -> str:
        if self.get_professor_by_user_id(usuario_id):
            return "professor"
        if self.get_mediador_by_user_id(usuario_id):
            return "mediador"

        usuario = self.get_by_id(usuario_id)
        if usuario and (usuario.matricula or "").lower() == "admin":
            return "admin"
        return "aluno"

    def exists_by_matricula(self, matricula: str) -> bool:
        return self.get_by_matricula(matricula) is not None

    def exists_by_email(self, email: str) -> bool:
        return self.get_by_email(email) is not None

    def create(self, usuario: Usuario) -> Usuario:
        self.session.add(usuario)
        self.session.commit()
        self.session.refresh(usuario)
        return usuario

    def update(self, usuario: Usuario) -> Usuario:
        self.session.add(usuario)
        self.session.commit()
        self.session.refresh(usuario)
        return usuario

    def delete(self, usuario: Usuario) -> None:
        self.session.delete(usuario)
        self.session.commit()

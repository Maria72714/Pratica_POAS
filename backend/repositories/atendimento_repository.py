from sqlmodel import Session, select

from models.atendimento import Atendimento
from models.associativas.aluno_atendimento import AlunoAtendimento

class AtendimentoRepository:
    def __init__(self, session: Session):
        self.session = session

    def list_all(self) -> list[Atendimento]:
        return self.session.exec(select(Atendimento)).all()

    def get_by_id(self, atendimento_id: int) -> Atendimento | None:
        return self.session.get(Atendimento, atendimento_id)

    def list_by_aluno_id(self, aluno_id: int) -> list[Atendimento]:
        stmt = (
            select(Atendimento)
            .join(AlunoAtendimento, AlunoAtendimento.atendimento_id == Atendimento.id)
            .where(AlunoAtendimento.aluno_id == aluno_id)
        )
        return self.session.exec(stmt).all()
    
    def list_by_professor_id(self, professor_id: int) -> list[Atendimento]:
        return self.session.exec(
            select(Atendimento).where(Atendimento.id_professor == professor_id)
        ).all()

    def create(self, atendimento: Atendimento) -> Atendimento:
        self.session.add(atendimento)
        self.session.commit()
        self.session.refresh(atendimento)
        return atendimento

    def update(self, atendimento: Atendimento) -> Atendimento:
        self.session.add(atendimento)
        self.session.commit()
        self.session.refresh(atendimento)
        return atendimento

    def delete(self, atendimento: Atendimento) -> None:
        self.session.delete(atendimento)
        self.session.commit()

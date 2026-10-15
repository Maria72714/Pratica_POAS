from sqlmodel import Session, select

from models.atendimento import Atendimento


class AtendimentoRepository:
    def __init__(self, session: Session):
        self.session = session

    def list_all(self) -> list[Atendimento]:
        return self.session.exec(select(Atendimento)).all()

    def get_by_id(self, atendimento_id: int) -> Atendimento | None:
        return self.session.get(Atendimento, atendimento_id)

    def get_by_matricula(self, matricula: str) -> list[Atendimento]:
        return self.session.exec(
            select(Atendimento).where(Atendimento.matricula == matricula)
        ).all()

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

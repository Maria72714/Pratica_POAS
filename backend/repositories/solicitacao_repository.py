from sqlmodel import Session, select

from models.disciplina import Disciplina
from models.solicitacao import Solicitacao


class SolicitacaoRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, solicitacao_id: int) -> Solicitacao | None:
        return self.session.get(Solicitacao, solicitacao_id)

    def list_by_aluno_id(self, aluno_id: int) -> list[Solicitacao]:
        return self.session.exec(
            select(Solicitacao).where(Solicitacao.id_aluno == aluno_id)
        ).all()

    def get_disciplina_by_nome(self, nome_disciplina: str) -> Disciplina | None:
        return self.session.exec(
            select(Disciplina).where(Disciplina.nome == nome_disciplina)
        ).first()

    def create(self, solicitacao: Solicitacao) -> Solicitacao:
        self.session.add(solicitacao)
        self.session.commit()
        self.session.refresh(solicitacao)
        return solicitacao

    def update(self, solicitacao: Solicitacao) -> Solicitacao:
        self.session.add(solicitacao)
        self.session.commit()
        self.session.refresh(solicitacao)
        return solicitacao

    def delete(self, solicitacao: Solicitacao) -> None:
        self.session.delete(solicitacao)
        self.session.commit()

from fastapi import HTTPException

from models.solicitacao import Solicitacao
from repositories.aluno_repository import AlunoRepository
from repositories.solicitacao_repository import SolicitacaoRepository
from repositories.usuario_repository import UsuarioRepository


class SolicitacaoService:
    def __init__(self, session):
        self.session = session
        self.usuario_repository = UsuarioRepository(session)
        self.aluno_repository = AlunoRepository(session)
        self.repository = SolicitacaoRepository(session)

    def criar_solicitacao(self, dados):
        usuario = self.usuario_repository.get_by_matricula(dados.matricula)
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")

        aluno = self.aluno_repository.get_by_user_id(usuario.id)
        if not aluno:
            raise HTTPException(status_code=404, detail="Aluno não encontrado")

        disciplina = self.repository.get_disciplina_by_nome(dados.disciplina)
        if not disciplina:
            raise HTTPException(status_code=404, detail="Disciplina não encontrada")

        solicitacao = Solicitacao(
            id_aluno=aluno.id,
            id_disciplina=disciplina.id,
            tipo_suporte=dados.tipo_suporte,
            descricao=dados.descricao,
        )
        return self.repository.create(solicitacao)

    def listar_solicitacoes_aluno(self, matricula: str):
        usuario = self.usuario_repository.get_by_matricula(matricula)
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")

        aluno = self.aluno_repository.get_by_user_id(usuario.id)
        if not aluno:
            raise HTTPException(status_code=404, detail="Aluno não encontrado")

        return self.repository.list_by_aluno_id(aluno.id)

    def buscar_por_id(self, solicitacao_id: int):
        solicitacao = self.repository.get_by_id(solicitacao_id)
        if not solicitacao:
            raise HTTPException(status_code=404, detail="Solicitacao não encontrada")
        return solicitacao

    def editar_solicitacao(self, solicitacao_id: int, dados: Solicitacao):
        solicitacao = self.repository.get_by_id(solicitacao_id)
        if not solicitacao:
            raise HTTPException(status_code=404, detail="Solicitacao não encontrada")

        dados_update = dados.model_dump(exclude_unset=True)
        for campo, valor in dados_update.items():
            setattr(solicitacao, campo, valor)

        return self.repository.update(solicitacao)

    def deletar_solicitacao(self, solicitacao_id: int):
        solicitacao = self.repository.get_by_id(solicitacao_id)
        if not solicitacao:
            raise HTTPException(status_code=404, detail="Solicitacao não encontrada")

        self.repository.delete(solicitacao)
        return {"ok": True}

from fastapi import HTTPException
from sqlmodel import select

from models.associativas.professor_disciplina import ProfessorDisciplina
from models.disciplina import Disciplina
from models.enums import StatusSolicitacao
from models.solicitacao import Solicitacao
from models.users.aluno import Aluno
from models.users.professor import Professor
from models.users.user import Usuario
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

    def listar_solicitacoes_pendentes(self):
        solicitacoes = self.repository.list_by_status(StatusSolicitacao.PENDENTE)
        itens = []

        for solicitacao in solicitacoes:
            aluno = self.session.get(Aluno, solicitacao.id_aluno)
            aluno_user = self.session.get(Usuario, aluno.id) if aluno else None
            disciplina = self.session.get(Disciplina, solicitacao.id_disciplina)

            professores = []
            if disciplina:
                professores_rows = self.session.exec(
                    select(Professor)
                    .join(ProfessorDisciplina, Professor.id == ProfessorDisciplina.professor_id)
                    .where(ProfessorDisciplina.disciplina_id == disciplina.id)
                ).all()

                for professor in professores_rows:
                    usuario_prof = self.session.get(Usuario, professor.id)
                    professores.append({
                        "id": professor.id,
                        "nome": usuario_prof.nome if usuario_prof else "Professor não identificado",
                        "email": usuario_prof.email if usuario_prof else "",
                    })

            itens.append({
                "id": solicitacao.id,
                "tipo_suporte": solicitacao.tipo_suporte,
                "descricao": solicitacao.descricao,
                "status": solicitacao.status.value if hasattr(solicitacao.status, "value") else solicitacao.status,
                "id_disciplina": solicitacao.id_disciplina,
                "disciplina_nome": disciplina.nome if disciplina else "Disciplina não localizada",
                "aluno": {
                    "id": aluno.id if aluno else None,
                    "nome": aluno_user.nome if aluno_user else "Aluno não identificado",
                    "email": aluno_user.email if aluno_user else "",
                    "matricula": aluno_user.matricula if aluno_user else "",
                },
                "professores": professores,
            })

        return itens

    def decidir_solicitacao(self, solicitacao_id: int, status: str, id_mediador: int | None = None):
        solicitacao = self.repository.get_by_id(solicitacao_id)
        if not solicitacao:
            raise HTTPException(status_code=404, detail="Solicitacao não encontrada")

        status_normalizado = (status or "").strip().title()
        valores_validos = {item.value for item in StatusSolicitacao}
        if status_normalizado not in valores_validos:
            raise HTTPException(status_code=400, detail="Status inválido. Use 'Aprovado' ou 'Recusado'.")

        solicitacao.status = status_normalizado
        if id_mediador is not None:
            solicitacao.id_mediador = id_mediador

        return self.repository.update(solicitacao)

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

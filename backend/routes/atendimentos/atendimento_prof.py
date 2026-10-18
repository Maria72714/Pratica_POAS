from fastapi import APIRouter, HTTPException
from models.atendimento import Atendimento
from models.solicitacao import Solicitacao
from models.users.user import Usuario
from models.users.professor import Professor
from models.disciplina import Disciplina
from deps.deps import SessionDep
from sqlmodel import select
from pydantic import BaseModel
from datetime import date
from typing import Optional


router = APIRouter(
    prefix='/atendimentos',
    tags=['Atendimentos']
)


@router.get("/professor/{professor_matricula}")
def listar_atendimentos_professor(professor_matricula: str, session: SessionDep):
    usuario = session.exec(
        select(Usuario).where(Usuario.matricula == professor_matricula)
    ).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="Professor não encontrado.")

    professor = session.exec(
        select(Professor).where(Professor.id == usuario.id)
    ).first()

    if not professor:
        raise HTTPException(status_code=404, detail="Perfil de professor não encontrado.")

    atendimentos = session.exec(
        select(Atendimento).where(Atendimento.id_professor == professor.id)
    ).all()

    resultado = []
    for a in atendimentos:
        disciplina = session.get(Disciplina, a.id_disciplina) if a.id_disciplina else None

        # Busca o mediador vinculado via solicitacao
        id_mediador = None
        id_aluno_solicitacao = None
        if a.id_solicitacao:
            sol = session.get(Solicitacao, a.id_solicitacao)
            if sol:
                id_mediador = sol.id_mediador
                id_aluno_solicitacao = sol.id_aluno

        # Busca aluno(s)
        from models.associativas.aluno_atendimento import AlunoAtendimento
        aluno_nome = None
        aluno_matricula = None
        aluno_id = id_aluno_solicitacao

        assoc = session.exec(
            select(AlunoAtendimento).where(AlunoAtendimento.atendimento_id == a.id)
        ).first()
        if assoc:
            aluno_id = assoc.aluno_id

        if aluno_id:
            u_aluno = session.get(Usuario, aluno_id)
            if u_aluno:
                aluno_nome = u_aluno.nome
                aluno_matricula = u_aluno.matricula

        resultado.append({
            "id": a.id,
            "id_professor": a.id_professor,
            "id_turma": a.id_turma,
            "id_disciplina": a.id_disciplina,
            "id_solicitacao": a.id_solicitacao,
            "id_horario": a.id_horario,
            "id_sala": a.id_sala,
            "data_atendimento": a.data_atendimento.isoformat() if a.data_atendimento else None,
            "tipo_atendimento": a.tipo_atendimento.value if hasattr(a.tipo_atendimento, "value") else str(a.tipo_atendimento),
            "modalidade": a.modalidade.value if hasattr(a.modalidade, "value") else str(a.modalidade),
            "assunto": a.assunto,
            "relatorio": a.relatorio,
            "status": a.status.value if hasattr(a.status, "value") else str(a.status),
            "disciplina_nome": disciplina.nome if disciplina else "Geral",
            "id_mediador": id_mediador,  # Selo do Mediador
            "aluno_nome": aluno_nome or "Aluno Geral",
            "aluno_matricula": aluno_matricula or "—",
            "aluno_id": aluno_id,
        })

    return resultado

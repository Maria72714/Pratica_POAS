from fastapi import APIRouter, HTTPException
from models.atendimento import Atendimento
from models.associativas.aluno_atendimento import AlunoAtendimento
from models.users.user import Usuario
from models.users.aluno import Aluno
from models.solicitacao import Solicitacao
from deps.deps import SessionDep
from sqlmodel import select
from pydantic import BaseModel
from datetime import date
from typing import Optional

router = APIRouter(
    prefix='/atendimentos',
    tags=['Atendimentos']
)


class AtendimentoCreateModel(BaseModel):
    data_atendimento: date
    disciplina: str                    # disciplina solicitada
    tipo_suporte: Optional[str] = None # tipo de suporte TAI (ex: libras, braille...)
    descricao: Optional[str] = None    # observações livres do aluno
    matricula: str                     # matrícula do aluno solicitante


class AtendimentoResponse(BaseModel):
    id: int
    data_atendimento: date
    assunto: Optional[str]
    status: str

    class Config:
        from_attributes = True


@router.get('/', response_model=list[Atendimento])
def listar_atendimento(session: SessionDep):
    atendimentos = session.exec(select(Atendimento)).all()
    return atendimentos


@router.get('/aluno/{matricula}')
def listar_atendimentos_aluno(matricula: str, session: SessionDep):
    """Retorna todos os atendimentos vinculados ao aluno."""
    usuario = session.exec(select(Usuario).where(Usuario.matricula == matricula)).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    aluno = session.exec(select(Aluno).where(Aluno.id == usuario.id)).first()
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")

    links = session.exec(
        select(AlunoAtendimento).where(AlunoAtendimento.aluno_id == aluno.id)
    ).all()
    ids = [l.atendimento_id for l in links]
    if not ids:
        return []
    atendimentos = session.exec(
        select(Atendimento).where(Atendimento.id.in_(ids))
    ).all()
    return atendimentos


@router.post("/", response_model=AtendimentoResponse)
def criar_atendimento(dados: AtendimentoCreateModel, session: SessionDep):
    """
    Cria um atendimento/solicitação de CA vinculando o aluno e registrando
    a disciplina e o tipo de suporte no campo assunto.
    """
    # Busca o aluno pela matrícula
    usuario = session.exec(
        select(Usuario).where(Usuario.matricula == dados.matricula)
    ).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    aluno = session.exec(select(Aluno).where(Aluno.id == usuario.id)).first()
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")

    # Monta o assunto com disciplina + tipo de suporte
    partes = [f"Disciplina: {dados.disciplina}"]
    if dados.tipo_suporte:
        partes.append(f"Suporte: {dados.tipo_suporte}")
    if dados.descricao:
        partes.append(f"Obs: {dados.descricao}")
    assunto = " | ".join(partes)

    atendimento = Atendimento(
        data_atendimento=dados.data_atendimento,
        assunto=assunto[:250],
    )
    session.add(atendimento)
    session.commit()
    session.refresh(atendimento)

    # Vincula o aluno ao atendimento
    link = AlunoAtendimento(aluno_id=aluno.id, atendimento_id=atendimento.id)
    session.add(link)

    # Cria a solicitação associada
    solicitacao = Solicitacao(id_aluno=aluno.id)
    session.add(solicitacao)
    session.commit()
    session.refresh(solicitacao)

    # Atualiza o atendimento com o id da solicitação
    atendimento.id_solicitacao = solicitacao.id
    session.add(atendimento)
    session.commit()
    session.refresh(atendimento)

    return atendimento


@router.delete("/{atendimento_id}")
def deletar_atendimento(atendimento_id: int, session: SessionDep):
    atendimento = session.get(Atendimento, atendimento_id)
    if not atendimento:
        raise HTTPException(status_code=404, detail="Atendimento não encontrado")
    session.delete(atendimento)
    session.commit()
    return {"ok": True}


@router.patch("/{atendimento_id}", response_model=Atendimento)
def editar_atendimento(atendimento_id: int, dados: Atendimento, session: SessionDep):
    atendimento = session.get(Atendimento, atendimento_id)
    if not atendimento:
        raise HTTPException(status_code=404, detail="Atendimento não encontrado")

    dados_update = dados.model_dump(exclude_unset=True)
    for campo, valor in dados_update.items():
        setattr(atendimento, campo, valor)

    session.add(atendimento)
    session.commit()
    session.refresh(atendimento)
    return atendimento

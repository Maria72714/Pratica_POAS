from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from models.users.user import Usuario
from models.users.aluno import Aluno
from models.solicitacao import Solicitacao
from models.disciplina import Disciplina
from models.solicitacao import Solicitacao
from deps.deps import SessionDep
from sqlmodel import select
from pydantic import BaseModel
from datetime import date
from typing import Optional

router = APIRouter(
    prefix='/solicitacao',
    tags=['Solicitação']
)

class SolicitacaoCreateModel(BaseModel):
  tipo_suporte: str
  descricao: Optional[str] = None
  matricula: str
  disciplina: str


class SolicitacaoResponse(BaseModel):
    id: int
    id_disciplina: int
    tipo_suporte: str
    descricao: Optional[str]
    status: str

    class Config:
        from_attributes = True
  

@router.post('/', response_model=SolicitacaoResponse)
def criar_solicitacao(dados: SolicitacaoCreateModel, session: SessionDep):
    usuario = session.exec(select(Usuario).where(Usuario.matricula == dados.matricula)).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    aluno = session.exec(select(Aluno).where(Aluno.id == usuario.id)).first()
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")

    disciplina = session.exec(select(Disciplina).where(Disciplina.nome == dados.disciplina)).first()
    if not disciplina:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada")

    solicitacao = Solicitacao(
        id_aluno=aluno.id,
        id_disciplina=disciplina.id,
        tipo_suporte=dados.tipo_suporte,
        descricao=dados.descricao
    )
    session.add(solicitacao)
    session.commit()
    session.refresh(solicitacao)

    return solicitacao


@router.get("/aluno/{matricula}", response_model=list[Solicitacao])
def listar_solicitacoes_aluno(
    matricula: str,
    session: SessionDep
):
    usuario = session.exec(
        select(Usuario).where(
            Usuario.matricula == matricula
        )
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    aluno = session.exec(
        select(Aluno).where(
            Aluno.id == usuario.id
        )
    ).first()

    if not aluno:
        raise HTTPException(
            status_code=404,
            detail="Aluno não encontrado"
        )

    solicitacoes = session.exec(
        select(Solicitacao).where(
            Solicitacao.id_aluno == aluno.id
        )
    ).all()

    return solicitacoes


@router.get("/{solicitacao_id}", response_model=Solicitacao)
def buscar_solicitacao_por_id(
    solicitacao_id: int,
    session: SessionDep
):
    solicitacao = session.get(
        Solicitacao,
        solicitacao_id
    )

    if not solicitacao:
        raise HTTPException(
            status_code=404,
            detail="Solicitacao não encontrada"
        )

    return solicitacao

@router.patch("/{solicitacao_id}", response_model= Solicitacao)
def editar_solicitacao(solicitacao_id: int, dados: Solicitacao, session: SessionDep):
    solicitacao = session.get(Solicitacao, solicitacao_id)
    if not solicitacao:
        raise HTTPException(status_code=404, detail="Solicitacao não encontrada")

    dados_update = dados.model_dump(exclude_unset=True)
    for campo, valor in dados_update.items():
        setattr(solicitacao, campo, valor)

    session.add(solicitacao)
    session.commit()
    session.refresh(solicitacao)
    return solicitacao


@router.delete("/{solicitacao_id}")
def deletar_solicitacao(solicitacao_id: int, session: SessionDep):
    solicitacao = session.get(Solicitacao, solicitacao_id)
    if not solicitacao:
        raise HTTPException(status_code=404, detail="Solicitacao não encontrada")
    session.delete(solicitacao)
    session.commit()
    return {"ok": True}

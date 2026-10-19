import logging
from typing import Annotated, Optional

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from sqlmodel import select

from deps.auth import AuthUser, require_roles
from deps.deps import SessionDep
from models.sala import Sala
from models.turma import Turma
from models.curso import Curso
from models.users.aluno import Aluno
from models.users.mediador import Mediador
from models.users.professor import Professor
from models.users.user import Usuario

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin"])

AdminUser = Annotated[AuthUser, Depends(require_roles("admin"))]


class TurmaInput(BaseModel):
    curso_id: Optional[int] = None
    ano: str = Field(min_length=4, max_length=4)
    turno: str = Field(min_length=1, max_length=50)
    codigo: Optional[str] = Field(default=None, max_length=10)


class SalaInput(BaseModel):
    nome: str = Field(min_length=1, max_length=100)


class MediadorRejeitar(BaseModel):
    motivo: Optional[str] = None


@router.get("/turmas")
def listar_turmas_admin(session: SessionDep, current_user: AdminUser, skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100)):
    turmas = session.exec(
        select(Turma)
        .order_by(Turma.ano.desc(), Turma.turno, Turma.codigo)
        .offset(skip)
        .limit(limit)
    ).all()

    total = session.exec(select(Turma)).all()

    return {
        "turmas": [
            {
                "id": t.id,
                "codigo": t.codigo,
                "ano": t.ano,
                "turno": t.turno,
                "curso_id": t.curso_id,
                "curso_nome": t.curso.nome if t.curso else None,
            }
            for t in turmas
        ],
        "total": len(total),
        "skip": skip,
        "limit": limit,
    }


@router.post("/turmas")
def criar_turma(payload: TurmaInput, session: SessionDep, current_user: AdminUser):
    """Criar nova turma."""
    # Validar ano
    if not payload.ano.isdigit():
        raise HTTPException(status_code=400, detail="Ano deve ser numérico (ex: 2024).")
    
    # Verificar se curso existe (opcional)
    if payload.curso_id:
        curso = session.get(Curso, payload.curso_id)
        if not curso:
            raise HTTPException(status_code=400, detail="Curso não encontrado.")
    
    # Verificar duplicata
    existente = session.exec(
        select(Turma)
        .where(Turma.ano == payload.ano)
        .where(Turma.turno == payload.turno)
        .where(Turma.codigo == payload.codigo)
    ).first()
    if existente:
        raise HTTPException(status_code=400, detail="Turma já existe.")
    
    turma = Turma(
        curso_id=payload.curso_id,
        ano=payload.ano,
        turno=payload.turno,
        codigo=payload.codigo,
    )
    session.add(turma)
    session.commit()
    session.refresh(turma)
    
    logger.info(f"Turma criada: {turma.id} - {turma.codigo}/{turma.ano}")
    return {
        "id": turma.id,
        "codigo": turma.codigo,
        "ano": turma.ano,
        "turno": turma.turno,
        "curso_id": turma.curso_id,
    }


@router.put("/turmas/{turma_id}")
def atualizar_turma(turma_id: int, payload: TurmaInput, session: SessionDep, current_user: AdminUser):
    """Atualizar turma."""
    turma = session.get(Turma, turma_id)
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada.")
    
    if payload.curso_id:
        curso = session.get(Curso, payload.curso_id)
        if not curso:
            raise HTTPException(status_code=400, detail="Curso não encontrado.")
        turma.curso_id = payload.curso_id
    
    turma.ano = payload.ano
    turma.turno = payload.turno
    turma.codigo = payload.codigo
    
    session.add(turma)
    session.commit()
    session.refresh(turma)
    
    logger.info(f"Turma atualizada: {turma.id}")
    return {"id": turma.id, "codigo": turma.codigo, "ano": turma.ano, "turno": turma.turno}


@router.delete("/turmas/{turma_id}")
def remover_turma(turma_id: int, session: SessionDep, current_user: AdminUser):
    turma = session.get(Turma, turma_id)
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada.")

    session.delete(turma)
    session.commit()

    logger.info(f"Turma removida: {turma_id}")
    return {"message": "Turma removida com sucesso."}


@router.get("/salas")
def listar_salas_admin(session: SessionDep, current_user: AdminUser):
    salas = session.exec(select(Sala).order_by(Sala.nome)).all()
    return [{"id": s.id, "nome": s.nome} for s in salas]


@router.post("/salas")
def criar_sala(payload: SalaInput, session: SessionDep, current_user: AdminUser):
    nome = payload.nome.strip()
    if not nome:
        raise HTTPException(status_code=400, detail="Nome da sala é obrigatório.")

    existente = session.exec(select(Sala).where(Sala.nome == nome)).first()
    if existente:
        raise HTTPException(status_code=400, detail="Sala já cadastrada.")

    sala = Sala(nome=nome)
    session.add(sala)
    session.commit()
    session.refresh(sala)

    logger.info(f"Sala criada: {sala.id} - {sala.nome}")
    return {"id": sala.id, "nome": sala.nome}


@router.put("/salas/{sala_id}")
def atualizar_sala(sala_id: int, payload: SalaInput, session: SessionDep, current_user: AdminUser):
    sala = session.get(Sala, sala_id)
    if not sala:
        raise HTTPException(status_code=404, detail="Sala não encontrada.")

    nome = payload.nome.strip()
    if not nome:
        raise HTTPException(status_code=400, detail="Nome não pode ser vazio.")

    outro = session.exec(
        select(Sala)
        .where(Sala.nome == nome)
        .where(Sala.id != sala_id)
    ).first()
    if outro:
        raise HTTPException(status_code=400, detail="Nome de sala já existe.")

    sala.nome = nome
    session.add(sala)
    session.commit()
    session.refresh(sala)

    logger.info(f"Sala atualizada: {sala.id} - {sala.nome}")
    return {"id": sala.id, "nome": sala.nome}


@router.delete("/salas/{sala_id}")
def remover_sala(sala_id: int, session: SessionDep, current_user: AdminUser):
    sala = session.get(Sala, sala_id)
    if not sala:
        raise HTTPException(status_code=404, detail="Sala não encontrada.")

    session.delete(sala)
    session.commit()

    logger.info(f"Sala removida: {sala_id}")
    return {"message": "Sala removida com sucesso."}


@router.get("/usuarios")
def listar_usuarios(
    session: SessionDep,
    current_user: AdminUser,
    role: Optional[str] = Query(default=None, description="Filtra por papel: aluno, professor ou mediador."),
    busca: Optional[str] = Query(default=None, description="Busca por nome, matrícula ou e-mail."),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
):
    """Lista alunos, professores e mediadores cadastrados (somente leitura)."""
    query = select(Usuario)

    if role == "aluno":
        query = query.where(Usuario.id.in_(select(Aluno.id)))
    elif role == "professor":
        query = query.where(Usuario.id.in_(select(Professor.id)))
    elif role == "mediador":
        query = query.where(Usuario.id.in_(select(Mediador.id)))

    termo = busca.strip() if busca else ""
    if termo:
        like = f"%{termo}%"
        query = query.where(
            (Usuario.nome.ilike(like))
            | (Usuario.matricula.ilike(like))
            | (Usuario.email.ilike(like))
        )

    usuarios = session.exec(
        query.order_by(Usuario.nome).offset(skip).limit(limit)
    ).all()

    ids = [u.id for u in usuarios]
    alunos = {a.id: a for a in session.exec(select(Aluno).where(Aluno.id.in_(ids))).all()} if ids else {}
    professores = set(session.exec(select(Professor.id).where(Professor.id.in_(ids))).all()) if ids else set()
    mediadores = {m.id: m for m in session.exec(select(Mediador).where(Mediador.id.in_(ids))).all()} if ids else {}

    resultado = []
    for u in usuarios:
        if u.id in alunos:
            papel = "aluno"
        elif u.id in professores:
            papel = "professor"
        elif u.id in mediadores:
            papel = "mediador"
        elif (u.matricula or "").lower() == "admin":
            papel = "admin"
        else:
            papel = "desconhecido"

        item = {
            "id": u.id,
            "nome": u.nome,
            "matricula": u.matricula,
            "email": u.email,
            "role": papel,
        }
        if papel == "aluno":
            a = alunos[u.id]
            item["necessidades_especiais"] = a.necessidades_especiais
            item["perfil_completo"] = a.perfil_completo
            item["turma_id"] = a.turma_id
        elif papel == "mediador":
            m = mediadores[u.id]
            item["aprovado"] = m.aprovado
            item["tipo"] = m.tipo.value if hasattr(m.tipo, "value") else str(m.tipo)
        resultado.append(item)

    return {"usuarios": resultado, "total": len(resultado)}


@router.get("/mediadores/pendentes")
def listar_mediadores_pendentes(session: SessionDep, current_user: AdminUser):
    rows = session.exec(
        select(Mediador, Usuario)
        .join(Usuario, Usuario.id == Mediador.id)
        .where(Mediador.aprovado == False)  # noqa: E712
    ).all()

    return [
        {
            "id": med.id,
            "nome": user.nome,
            "email": user.email,
            "matricula": user.matricula,
            "tipo": med.tipo.value if hasattr(med.tipo, "value") else str(med.tipo),
            "apoio_descricao": med.apoio_descricao,
            "criado_em": user.id,
        }
        for med, user in rows
    ]


@router.get("/mediadores")
def listar_mediadores_admin(session: SessionDep, current_user: AdminUser):
    rows = session.exec(
        select(Mediador, Usuario)
        .join(Usuario, Usuario.id == Mediador.id)
    ).all()

    return [
        {
            "id": med.id,
            "nome": user.nome,
            "email": user.email,
            "matricula": user.matricula,
            "tipo": med.tipo.value if hasattr(med.tipo, "value") else str(med.tipo),
            "aprovado": med.aprovado,
        }
        for med, user in rows
    ]


@router.post("/mediadores/{mediador_id}/aprovar")
def aprovar_mediador(mediador_id: int, session: SessionDep, current_user: AdminUser):
    mediador = session.get(Mediador, mediador_id)
    if not mediador:
        raise HTTPException(status_code=404, detail="Mediador não encontrado.")

    if mediador.aprovado:
        raise HTTPException(status_code=400, detail="Mediador já aprovado.")

    mediador.aprovado = True
    session.add(mediador)
    session.commit()

    logger.info(f"Mediador aprovado: {mediador_id}")
    return {"message": "Mediador aprovado com sucesso.", "id": mediador_id, "aprovado": True}


@router.post("/mediadores/{mediador_id}/rejeitar")
def rejeitar_mediador(mediador_id: int, payload: MediadorRejeitar, session: SessionDep, current_user: AdminUser):
    mediador = session.get(Mediador, mediador_id)
    if not mediador:
        raise HTTPException(status_code=404, detail="Mediador não encontrado.")

    usuario = session.get(Usuario, mediador_id)

    if mediador:
        session.delete(mediador)
    if usuario:
        session.delete(usuario)

    session.commit()
    
    logger.info(f"Mediador rejeitado e removido: {mediador_id}")
    return {"message": "Mediador rejeitado e removido.", "id": mediador_id}

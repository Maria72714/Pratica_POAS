from typing import Annotated

from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from datetime import datetime
from pydantic import BaseModel

from deps.auth import AuthUser, assert_self_or_roles, get_current_user
from deps.deps import SessionDep
from models.users.user import Usuario
from models.notificacao import Notificacao
from models.associativas.usuario_notificacao import UsuarioNotificacao
router = APIRouter(
    prefix="/notificacoes",
    tags=["Notificações"]
)


class CriarNotificacaoInput(BaseModel):
    usuario_id: int | None = None
    matricula: str | None = None
    titulo: str
    mensagem: str


@router.get("/{matricula_ou_id}")
def listar_notificacoes(
    matricula_ou_id: str,
    session: SessionDep,
    current: Annotated[AuthUser, Depends(get_current_user)],
):
    assert_self_or_roles(current, matricula_ou_id, "admin")
    # Procura usuário por id ou matrícula
    db_user = None
    if matricula_ou_id.isdigit():
        db_user = session.exec(select(Usuario).where(Usuario.id == int(matricula_ou_id))).first()
    
    if not db_user:
        db_user = session.exec(select(Usuario).where(Usuario.matricula == matricula_ou_id)).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    # Se usuário existe, carrega suas notificações do Neon DB
    notificacoes = db_user.notificacoes

    # Formata lista de retorno
    resultado = []
    for n in notificacoes:
        resultado.append({
            "id": n.id,
            "titulo": n.titulo,
            "mensagem": n.mensagem,
            "lida": n.lida,
            "criado_em": n.criado_em.isoformat() if n.criado_em else None,
            "lido_em": n.lido_em.isoformat() if n.lido_em else None,
        })

    return resultado


@router.post("/")
def criar_notificacao(
    payload: CriarNotificacaoInput,
    session: SessionDep,
    current: Annotated[AuthUser, Depends(get_current_user)],
):
    if current.role not in {"admin", "professor", "mediador"}:
        raise HTTPException(status_code=403, detail="Permissão insuficiente.")
    db_user = None
    if payload.usuario_id:
        db_user = session.exec(select(Usuario).where(Usuario.id == payload.usuario_id)).first()
    elif payload.matricula:
        db_user = session.exec(select(Usuario).where(Usuario.matricula == payload.matricula)).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário destinatário não encontrado.")

    notif = Notificacao(titulo=payload.titulo.strip(), mensagem=payload.mensagem.strip(), lida=False)
    session.add(notif)
    session.commit()
    session.refresh(notif)

    link = UsuarioNotificacao(usuario_id=db_user.id, notificacao_id=notif.id)
    session.add(link)
    session.commit()

    return {
        "message": "Notificação criada com sucesso no Neon DB.",
        "notificacao_id": notif.id,
        "usuario_id": db_user.id
    }


@router.put("/{notificacao_id}/ler")
def marcar_como_lida(notificacao_id: int, session: SessionDep):
    notif = session.exec(select(Notificacao).where(Notificacao.id == notificacao_id)).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notificação não encontrada.")

    notif.lida = True
    notif.lido_em = datetime.now()
    session.add(notif)
    session.commit()
    session.refresh(notif)

    return {"message": "Notificação marcada como lida no Neon DB.", "id": notif.id, "lida": True}


@router.put("/ler-todas/{matricula_ou_id}")
def marcar_todas_como_lidas(matricula_ou_id: str, session: SessionDep):
    db_user = None
    if matricula_ou_id.isdigit():
        db_user = session.exec(select(Usuario).where(Usuario.id == int(matricula_ou_id))).first()
    if not db_user:
        db_user = session.exec(select(Usuario).where(Usuario.matricula == matricula_ou_id)).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    for notif in db_user.notificacoes:
        if not notif.lida:
            notif.lida = True
            notif.lido_em = datetime.now()
            session.add(notif)

    session.commit()
    return {"message": "Todas as notificações do usuário foram marcadas como lidas."}


@router.delete("/{notificacao_id}")
def deletar_notificacao(notificacao_id: int, session: SessionDep):
    notif = session.exec(select(Notificacao).where(Notificacao.id == notificacao_id)).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notificação não encontrada.")

    links = session.exec(select(UsuarioNotificacao).where(UsuarioNotificacao.notificacao_id == notificacao_id)).all()
    for link in links:
        session.delete(link)

    session.delete(notif)
    session.commit()
    return {"message": "Notificação excluída com sucesso do Neon DB."}

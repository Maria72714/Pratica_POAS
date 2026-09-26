from fastapi import APIRouter, HTTPException
from sqlmodel import select
from datetime import datetime
from pydantic import BaseModel

from deps.deps import SessionDep
from models.users.user import Usuario
from models.notificacao import Notificacao
from models.associativas.usuario_notificacao import UsuarioNotificacao
from models.users.professor import Professor
from models.users.mediador import Mediador
from models.users.aluno import Aluno

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
def listar_notificacoes(matricula_ou_id: str, session: SessionDep):
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

    # Se o usuário não possui notificações salvas no Neon ainda, cria sementes reais no banco de acordo com seu perfil
    if not notificacoes:
        is_prof = session.exec(select(Professor).where(Professor.id == db_user.id)).first()
        is_med = session.exec(select(Mediador).where(Mediador.id == db_user.id)).first()

        sementes = []
        if is_prof:
            sementes = [
                {"titulo": "Novo Agendamento Realizado", "mensagem": "O aluno João Silva agendou um atendimento em POO para amanhã às 14:00."},
                {"titulo": "Horários Disponíveis", "mensagem": "Você possui 3 horários abertos para atendimento nesta semana."},
                {"titulo": "Lembrete de Frequência", "mensagem": "Lembre-se de registrar a frequência dos atendimentos realizados ontem."},
            ]
        elif is_med:
            sementes = [
                {"titulo": "Nova Solicitação TAI", "mensagem": "Uma nova solicitação de atendimento inclusivo (LIBRAS) foi recebida no sistema."},
                {"titulo": "Sessão de Apoio Inclusivo", "mensagem": "Sua próxima sessão de suporte inclusivo está agendada para quinta-feira às 10:00."},
                {"titulo": "Perfil Aprovado", "mensagem": "Seu acesso como Mediador de Aprendizagem Inclusiva (NAPNE) está ativo."},
            ]
        else:
            sementes = [
                {"titulo": "Atendimento Confirmado", "mensagem": "Seu agendamento em POO foi confirmado para amanhã às 14:00."},
                {"titulo": "Novo Horário Disponível", "mensagem": "A Prof. Maria Oliveira adicionou novos horários de atendimento em Estrutura de Dados."},
                {"titulo": "Suporte Inclusivo (TAI)", "mensagem": "Sua solicitação de atendimento inclusivo foi vinculada ao Mediador com sucesso."},
            ]

        for item in sementes:
            notif = Notificacao(titulo=item["titulo"], mensagem=item["mensagem"], lida=False)
            session.add(notif)
            session.commit()
            session.refresh(notif)
            
            link = UsuarioNotificacao(usuario_id=db_user.id, notificacao_id=notif.id)
            session.add(link)
            session.commit()

        session.refresh(db_user)
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
def criar_notificacao(payload: CriarNotificacaoInput, session: SessionDep):
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

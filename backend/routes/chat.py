from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlmodel import select

from deps.deps import SessionDep
from models.chat_mensagem import ChatMensagem
from models.users.user import Usuario
from models.users.aluno import Aluno
from models.users.professor import Professor
from models.users.mediador import Mediador
from models.atendimento import Atendimento

router = APIRouter(prefix="/chat", tags=["Chat"])


def _dados_autores(session: SessionDep, ids: set[int]) -> tuple[dict[int, str], dict[int, str]]:
    """Carrega em lote o nome e o papel (aluno/professor/mediador/admin) dos autores."""
    if not ids:
        return {}, {}

    usuarios = {
        u.id: u
        for u in session.exec(select(Usuario).where(Usuario.id.in_(ids))).all()
    }
    alunos = set(session.exec(select(Aluno.id).where(Aluno.id.in_(ids))).all())
    professores = set(session.exec(select(Professor.id).where(Professor.id.in_(ids))).all())
    mediadores = set(session.exec(select(Mediador.id).where(Mediador.id.in_(ids))).all())

    nomes: dict[int, str] = {}
    roles: dict[int, str] = {}
    for uid in ids:
        usuario = usuarios.get(uid)
        nomes[uid] = usuario.nome if usuario else "Usuário desconhecido"
        if usuario and (usuario.matricula or "").lower() == "admin":
            roles[uid] = "admin"
        elif uid in alunos:
            roles[uid] = "aluno"
        elif uid in professores:
            roles[uid] = "professor"
        elif uid in mediadores:
            roles[uid] = "mediador"
        else:
            roles[uid] = "aluno"
    return nomes, roles


class MensagemInput(BaseModel):
    atendimento_id: int
    autor_id: int | str  # aceita id numérico ou matrícula
    mensagem: str


class MensagemResponse(BaseModel):
    id: int
    atendimento_id: int
    autor_id: int
    autor_nome: str
    autor_role: str = "aluno"
    mensagem: str
    criado_em: datetime
    lida: bool


@router.get("/usuario-id/{identificador}")
def obter_usuario_id(identificador: str, session: SessionDep):
    """Resolve o ID numérico do usuário a partir da matrícula ou ID em string."""
    usuario = None
    if identificador.isdigit():
        usuario = session.get(Usuario, int(identificador))
    if not usuario:
        usuario = session.exec(select(Usuario).where(Usuario.matricula == identificador.strip())).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return {"id": usuario.id, "nome": usuario.nome, "matricula": usuario.matricula}


@router.post("/", response_model=MensagemResponse)
def enviar_mensagem(dados: MensagemInput, session: SessionDep):
    atendimento = session.get(Atendimento, dados.atendimento_id)
    if not atendimento:
        raise HTTPException(status_code=404, detail="Atendimento não encontrado")

    # Resolve autor (pode ser id numérico ou matrícula)
    usuario = None
    if isinstance(dados.autor_id, int):
        usuario = session.get(Usuario, dados.autor_id)
    elif isinstance(dados.autor_id, str):
        if dados.autor_id.strip().isdigit():
            usuario = session.get(Usuario, int(dados.autor_id.strip()))
        if not usuario:
            usuario = session.exec(select(Usuario).where(Usuario.matricula == dados.autor_id.strip())).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário autor não encontrado")

    msg = ChatMensagem(
        atendimento_id=dados.atendimento_id,
        autor_id=usuario.id,
        mensagem=dados.mensagem.strip(),
    )
    session.add(msg)
    session.commit()
    session.refresh(msg)

    _, roles = _dados_autores(session, {usuario.id})

    return MensagemResponse(
        id=msg.id,
        atendimento_id=msg.atendimento_id,
        autor_id=msg.autor_id,
        autor_nome=usuario.nome,
        autor_role=roles.get(usuario.id, "aluno"),
        mensagem=msg.mensagem,
        criado_em=msg.criado_em,
        lida=msg.lida,
    )


@router.get("/{atendimento_id}", response_model=list[MensagemResponse])
def listar_mensagens(atendimento_id: int, session: SessionDep):
    atendimento = session.get(Atendimento, atendimento_id)
    if not atendimento:
        raise HTTPException(status_code=404, detail="Atendimento não encontrado")

    mensagens = session.exec(
        select(ChatMensagem)
        .where(ChatMensagem.atendimento_id == atendimento_id)
        .order_by(ChatMensagem.criado_em)
    ).all()

    nomes, roles = _dados_autores(session, {m.autor_id for m in mensagens})

    resultado = []
    for m in mensagens:
        resultado.append(MensagemResponse(
            id=m.id,
            atendimento_id=m.atendimento_id,
            autor_id=m.autor_id,
            autor_nome=nomes.get(m.autor_id, "Usuário desconhecido"),
            autor_role=roles.get(m.autor_id, "aluno"),
            mensagem=m.mensagem,
            criado_em=m.criado_em,
            lida=m.lida,
        ))

    return resultado


@router.patch("/{atendimento_id}/lidas")
def marcar_como_lidas(atendimento_id: int, leitor_id: int, session: SessionDep):
    """Marca como lidas todas as mensagens de um CA que NÃO são do leitor."""
    mensagens = session.exec(
        select(ChatMensagem).where(
            ChatMensagem.atendimento_id == atendimento_id,
            ChatMensagem.autor_id != leitor_id,
            ChatMensagem.lida == False,  # noqa: E712
        )
    ).all()
    for m in mensagens:
        m.lida = True
        session.add(m)
    session.commit()
    return {"marcadas": len(mensagens)}

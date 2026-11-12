"""
Página específica do CA (Centro de Aprendizagem).

Reúne, em uma única visão, os dados do encontro de CA: professor, disciplina,
modalidade, link da videochamada, alunos inscritos (e a contagem), avaliações
(estrelas + comentário) dos alunos após a conclusão e os comentários públicos.

Acesso: qualquer usuário autenticado (aluno, professor, mediador ou admin) pode
consultar os detalhes e participar dos comentários públicos. A avaliação é
restrita aos alunos vinculados ao atendimento e somente após status "Concluído".
"""
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlmodel import select
from sqlalchemy import or_
from typing import Annotated

from deps.deps import SessionDep
from deps.auth import AuthUser, get_current_user
from models.atendimento import Atendimento
from models.users.user import Usuario
from models.users.aluno import Aluno
from models.users.professor import Professor
from models.users.mediador import Mediador
from models.disciplina import Disciplina
from models.solicitacao import Solicitacao
from models.associativas.aluno_atendimento import AlunoAtendimento
from models.associativas.aluno_disciplina import AlunoDisciplina
from models.avaliacao_ca import AvaliacaoCA
from models.comentario_ca import ComentarioCA
from models.enums import StatusAtendimento, TipoAtendimento
from utils.cache import cache_read


router = APIRouter(prefix="/atendimentos", tags=["CA - Página do Atendimento"])


def _valor(enum_ou_str):
    return enum_ou_str.value if hasattr(enum_ou_str, "value") else str(enum_ou_str)


def _resolver_roles(session, ids: set[int]) -> dict[int, str]:
    """Resolve o papel (aluno/professor/mediador/admin) dos autores em lote."""
    if not ids:
        return {}
    usuarios = {
        u.id: u for u in session.exec(select(Usuario).where(Usuario.id.in_(ids))).all()
    }
    alunos = set(session.exec(select(Aluno.id).where(Aluno.id.in_(ids))).all())
    professores = set(session.exec(select(Professor.id).where(Professor.id.in_(ids))).all())
    mediadores = set(session.exec(select(Mediador.id).where(Mediador.id.in_(ids))).all())
    roles: dict[int, str] = {}
    for uid in ids:
        usuario = usuarios.get(uid)
        if usuario and (usuario.matricula or "").lower() == "admin":
            roles[uid] = "admin"
        elif uid in professores:
            roles[uid] = "professor"
        elif uid in mediadores:
            roles[uid] = "mediador"
        elif uid in alunos:
            roles[uid] = "aluno"
        else:
            roles[uid] = "aluno"
    return roles


def _alunos_do_atendimento(session, atendimento: Atendimento) -> list[dict]:
    """Lista os alunos vinculados (via associação ou via solicitação de origem)."""
    aluno_ids: list[int] = []
    for aa in session.exec(
        select(AlunoAtendimento).where(AlunoAtendimento.atendimento_id == atendimento.id)
    ).all():
        if aa.aluno_id and aa.aluno_id not in aluno_ids:
            aluno_ids.append(aa.aluno_id)

    if not aluno_ids and atendimento.id_solicitacao:
        sol = session.get(Solicitacao, atendimento.id_solicitacao)
        if sol and sol.id_aluno and sol.id_aluno not in aluno_ids:
            aluno_ids.append(sol.id_aluno)

    if not aluno_ids:
        return []

    usuarios = {
        u.id: u
        for u in session.exec(select(Usuario).where(Usuario.id.in_(aluno_ids))).all()
    }
    return [
        {
            "id": uid,
            "nome": usuarios[uid].nome if uid in usuarios else "Aluno",
            "matricula": usuarios[uid].matricula if uid in usuarios else None,
        }
        for uid in aluno_ids
    ]


def _estatisticas_avaliacao(session, atendimento_id: int) -> tuple[float | None, int]:
    avaliacoes = session.exec(
        select(AvaliacaoCA).where(AvaliacaoCA.atendimento_id == atendimento_id)
    ).all()
    if not avaliacoes:
        return None, 0
    media = round(sum(a.nota for a in avaliacoes) / len(avaliacoes), 2)
    return media, len(avaliacoes)


def _usuario_e_aluno_do_atendimento(session, atendimento: Atendimento, user_id: int) -> bool:
    """Verifica se o usuário é um aluno vinculado ao atendimento."""
    aluno = session.exec(select(Aluno).where(Aluno.id == user_id)).first()
    if not aluno:
        return False
    vinculo = session.exec(
        select(AlunoAtendimento)
        .where(AlunoAtendimento.atendimento_id == atendimento.id)
        .where(AlunoAtendimento.aluno_id == user_id)
    ).first()
    if vinculo:
        return True
    if atendimento.id_solicitacao:
        sol = session.get(Solicitacao, atendimento.id_solicitacao)
        if sol and sol.id_aluno == user_id:
            return True
    return False


@router.get("/mural")
@cache_read(ttl=30)
def listar_mural_ca(
    session: SessionDep,
    current: Annotated[AuthUser, Depends(get_current_user)],
):
    """Lista os Centros de Aprendizagem (CAs) visíveis ao usuário logado.

    Filtro por papel:
      - aluno: CAs das disciplinas em que está matriculado ou nos quais já está
        inscrito;
      - professor: CAs que ele mesmo criou;
      - mediador: apenas CAs do tipo TAI (acompanhamento);
      - admin: todos.
    Atendimentos cancelados são omitidos do mural.
    """
    stmt = select(Atendimento).where(Atendimento.status != StatusAtendimento.CANCELADO)

    if current.role == "professor":
        stmt = stmt.where(Atendimento.id_professor == current.id)
    elif current.role == "mediador":
        stmt = stmt.where(Atendimento.tipo_atendimento == TipoAtendimento.TAI)
    elif current.role == "aluno":
        disciplinas_aluno = select(AlunoDisciplina.disciplina_id).where(
            AlunoDisciplina.aluno_id == current.id
        )
        inscricoes_aluno = select(AlunoAtendimento.atendimento_id).where(
            AlunoAtendimento.aluno_id == current.id
        )
        stmt = stmt.where(
            or_(
                Atendimento.id_disciplina.in_(disciplinas_aluno),
                Atendimento.id.in_(inscricoes_aluno),
            )
        )

    atendimentos = session.exec(stmt).all()
    if not atendimentos:
        return []

    at_ids = [a.id for a in atendimentos]
    disc_ids = {a.id_disciplina for a in atendimentos if a.id_disciplina}
    prof_ids = {a.id_professor for a in atendimentos if a.id_professor}
    sol_ids = {a.id_solicitacao for a in atendimentos if a.id_solicitacao}

    # Todas as consultas abaixo são feitas em lote para evitar N+1 (cada query
    # custa um round-trip completo até o banco).
    disc_map = {
        d.id: d
        for d in session.exec(select(Disciplina).where(Disciplina.id.in_(disc_ids))).all()
    } if disc_ids else {}
    prof_map = {
        u.id: u
        for u in session.exec(select(Usuario).where(Usuario.id.in_(prof_ids))).all()
    } if prof_ids else {}
    sol_map = {
        s.id: s
        for s in session.exec(select(Solicitacao).where(Solicitacao.id.in_(sol_ids))).all()
    } if sol_ids else {}

    contagem: dict[int, int] = {}
    for aa in session.exec(
        select(AlunoAtendimento).where(AlunoAtendimento.atendimento_id.in_(at_ids))
    ).all():
        contagem[aa.atendimento_id] = contagem.get(aa.atendimento_id, 0) + 1

    notas: dict[int, list[int]] = {}
    for av in session.exec(
        select(AvaliacaoCA).where(AvaliacaoCA.atendimento_id.in_(at_ids))
    ).all():
        notas.setdefault(av.atendimento_id, []).append(av.nota)

    resultado = []
    for a in atendimentos:
        disciplina = disc_map.get(a.id_disciplina)
        professor = prof_map.get(a.id_professor)
        sol = sol_map.get(a.id_solicitacao) if a.id_solicitacao else None
        notas_ca = notas.get(a.id, [])
        resultado.append(
            {
                "id": a.id,
                "assunto": a.assunto,
                "disciplina_nome": disciplina.nome if disciplina else "Geral",
                "professor_nome": professor.nome if professor else None,
                "tipo_atendimento": _valor(a.tipo_atendimento),
                "modalidade": _valor(a.modalidade),
                "status": _valor(a.status),
                "data_atendimento": a.data_atendimento.isoformat()
                if a.data_atendimento
                else None,
                "link_ca_online": a.link_ca_online,
                "total_alunos": contagem.get(a.id, 0),
                "tem_selo": bool(sol and sol.id_mediador),
                "avaliacao_media": round(sum(notas_ca) / len(notas_ca), 2)
                if notas_ca
                else None,
                "total_avaliacoes": len(notas_ca),
            }
        )

    # Agendados (mais próximos primeiro) e depois os demais (mais recentes).
    agendados = sorted(
        [r for r in resultado if r["status"] == StatusAtendimento.AGENDADO.value],
        key=lambda x: x["data_atendimento"] or "",
    )
    outros = sorted(
        [r for r in resultado if r["status"] != StatusAtendimento.AGENDADO.value],
        key=lambda x: x["data_atendimento"] or "",
        reverse=True,
    )
    return agendados + outros


@router.get("/{atendimento_id}/detalhes")
@cache_read(ttl=30)
def detalhes_atendimento(
    atendimento_id: int,
    session: SessionDep,
    current: Annotated[AuthUser, Depends(get_current_user)],
):
    atendimento = session.get(Atendimento, atendimento_id)
    if not atendimento:
        raise HTTPException(status_code=404, detail="Atendimento não encontrado.")

    disciplina = (
        session.get(Disciplina, atendimento.id_disciplina)
        if atendimento.id_disciplina
        else None
    )

    professor = None
    if atendimento.id_professor:
        u_prof = session.get(Usuario, atendimento.id_professor)
        if u_prof:
            professor = {"id": u_prof.id, "nome": u_prof.nome, "email": u_prof.email}

    id_mediador = None
    mediador_nome = None
    if atendimento.id_solicitacao:
        sol = session.get(Solicitacao, atendimento.id_solicitacao)
        if sol and sol.id_mediador:
            id_mediador = sol.id_mediador
            u_med = session.get(Usuario, sol.id_mediador)
            mediador_nome = u_med.nome if u_med else None

    alunos = _alunos_do_atendimento(session, atendimento)
    media, total_avaliacoes = _estatisticas_avaliacao(session, atendimento_id)
    total_comentarios = len(
        session.exec(
            select(ComentarioCA).where(ComentarioCA.atendimento_id == atendimento_id)
        ).all()
    )

    status_valor = _valor(atendimento.status)
    eh_aluno_vinculado = _usuario_e_aluno_do_atendimento(session, atendimento, current.id)

    minha_avaliacao = None
    if eh_aluno_vinculado:
        av = session.exec(
            select(AvaliacaoCA)
            .where(AvaliacaoCA.atendimento_id == atendimento_id)
            .where(AvaliacaoCA.aluno_id == current.id)
        ).first()
        if av:
            minha_avaliacao = {
                "nota": av.nota,
                "comentario": av.comentario,
                "criado_em": av.criado_em.isoformat() if av.criado_em else None,
            }

    pode_gerenciar = current.role in ("admin", "professor", "mediador")

    return {
        "id": atendimento.id,
        "assunto": atendimento.assunto,
        "relatorio": atendimento.relatorio,
        "disciplina_nome": disciplina.nome if disciplina else "Geral",
        "professor": professor,
        "mediador_nome": mediador_nome,
        "tem_selo": bool(id_mediador),
        "data_atendimento": atendimento.data_atendimento.isoformat()
        if atendimento.data_atendimento
        else None,
        "tipo_atendimento": _valor(atendimento.tipo_atendimento),
        "modalidade": _valor(atendimento.modalidade),
        "status": status_valor,
        "link_ca_online": atendimento.link_ca_online,
        "total_alunos": len(alunos),
        "alunos": alunos,
        "avaliacao": {"media": media, "total": total_avaliacoes},
        "minha_avaliacao": minha_avaliacao,
        "pode_avaliar": (
            eh_aluno_vinculado
            and status_valor == StatusAtendimento.CONCLUIDO.value
            and minha_avaliacao is None
        ),
        "total_comentarios": total_comentarios,
        "pode_gerenciar": pode_gerenciar,
    }


class ComentarioInput(BaseModel):
    mensagem: str


@router.get("/{atendimento_id}/comentarios")
@cache_read(ttl=15)
def listar_comentarios(
    atendimento_id: int,
    session: SessionDep,
    current: Annotated[AuthUser, Depends(get_current_user)],
):
    atendimento = session.get(Atendimento, atendimento_id)
    if not atendimento:
        raise HTTPException(status_code=404, detail="Atendimento não encontrado.")

    comentarios = session.exec(
        select(ComentarioCA)
        .where(ComentarioCA.atendimento_id == atendimento_id)
        .order_by(ComentarioCA.criado_em)
    ).all()

    roles = _resolver_roles(session, {c.autor_id for c in comentarios})
    usuarios = {
        u.id: u
        for u in session.exec(
            select(Usuario).where(Usuario.id.in_({c.autor_id for c in comentarios}))
        ).all()
    } if comentarios else {}

    return [
        {
            "id": c.id,
            "autor_id": c.autor_id,
            "autor_nome": usuarios[c.autor_id].nome if c.autor_id in usuarios else "Usuário",
            "autor_role": roles.get(c.autor_id, "aluno"),
            "mensagem": c.mensagem,
            "criado_em": c.criado_em.isoformat() if c.criado_em else None,
            "proprio": c.autor_id == current.id,
        }
        for c in comentarios
    ]


@router.post("/{atendimento_id}/comentarios")
def criar_comentario(
    atendimento_id: int,
    dados: ComentarioInput,
    session: SessionDep,
    current: Annotated[AuthUser, Depends(get_current_user)],
):
    atendimento = session.get(Atendimento, atendimento_id)
    if not atendimento:
        raise HTTPException(status_code=404, detail="Atendimento não encontrado.")

    mensagem = (dados.mensagem or "").strip()
    if not mensagem:
        raise HTTPException(status_code=400, detail="O comentário não pode estar vazio.")

    comentario = ComentarioCA(
        atendimento_id=atendimento_id,
        autor_id=current.id,
        mensagem=mensagem[:1000],
    )
    session.add(comentario)
    session.commit()
    session.refresh(comentario)

    roles = _resolver_roles(session, {current.id})
    usuario = session.get(Usuario, current.id)

    return {
        "id": comentario.id,
        "autor_id": comentario.autor_id,
        "autor_nome": usuario.nome if usuario else "Usuário",
        "autor_role": roles.get(current.id, current.role),
        "mensagem": comentario.mensagem,
        "criado_em": comentario.criado_em.isoformat() if comentario.criado_em else None,
        "proprio": True,
    }


@router.delete("/{atendimento_id}/comentarios/{comentario_id}")
def deletar_comentario(
    atendimento_id: int,
    comentario_id: int,
    session: SessionDep,
    current: Annotated[AuthUser, Depends(get_current_user)],
):
    comentario = session.get(ComentarioCA, comentario_id)
    if not comentario or comentario.atendimento_id != atendimento_id:
        raise HTTPException(status_code=404, detail="Comentário não encontrado.")

    if comentario.autor_id != current.id and current.role not in ("admin", "mediador"):
        raise HTTPException(status_code=403, detail="Você não pode excluir este comentário.")

    session.delete(comentario)
    session.commit()
    return {"message": "Comentário excluído."}


class AvaliacaoInput(BaseModel):
    nota: int
    comentario: Optional[str] = None


@router.get("/{atendimento_id}/avaliacao")
@cache_read(ttl=15)
def listar_avaliacoes(
    atendimento_id: int,
    session: SessionDep,
    current: Annotated[AuthUser, Depends(get_current_user)],
):
    atendimento = session.get(Atendimento, atendimento_id)
    if not atendimento:
        raise HTTPException(status_code=404, detail="Atendimento não encontrado.")

    media, total = _estatisticas_avaliacao(session, atendimento_id)

    # A listagem individual (com nomes e comentários) é restrita ao professor
    # responsável e administradores.
    pode_ver_detalhes = current.role == "admin" or (
        current.role == "professor" and atendimento.id_professor == current.id
    )

    avaliacoes = []
    if pode_ver_detalhes:
        registros = session.exec(
            select(AvaliacaoCA)
            .where(AvaliacaoCA.atendimento_id == atendimento_id)
            .order_by(AvaliacaoCA.criado_em.desc())
        ).all()
        usuario_ids = {a.aluno_id for a in registros}
        usuarios = {
            u.id: u
            for u in session.exec(select(Usuario).where(Usuario.id.in_(usuario_ids))).all()
        } if usuario_ids else {}
        avaliacoes = [
            {
                "id": a.id,
                "aluno_id": a.aluno_id,
                "aluno_nome": usuarios[a.aluno_id].nome if a.aluno_id in usuarios else "Aluno",
                "nota": a.nota,
                "comentario": a.comentario,
                "criado_em": a.criado_em.isoformat() if a.criado_em else None,
            }
            for a in registros
        ]

    return {
        "media": media,
        "total": total,
        "avaliacoes": avaliacoes,
    }


@router.post("/{atendimento_id}/avaliacao")
def avaliar_atendimento(
    atendimento_id: int,
    dados: AvaliacaoInput,
    session: SessionDep,
    current: Annotated[AuthUser, Depends(get_current_user)],
):
    atendimento = session.get(Atendimento, atendimento_id)
    if not atendimento:
        raise HTTPException(status_code=404, detail="Atendimento não encontrado.")

    if not _usuario_e_aluno_do_atendimento(session, atendimento, current.id):
        raise HTTPException(
            status_code=403,
            detail="Apenas alunos participantes deste CA podem avaliá-lo.",
        )

    if _valor(atendimento.status) != StatusAtendimento.CONCLUIDO.value:
        raise HTTPException(
            status_code=400,
            detail="Só é possível avaliar um CA após a sua conclusão.",
        )

    if dados.nota is None or not (1 <= int(dados.nota) <= 5):
        raise HTTPException(status_code=400, detail="A nota deve ser um valor entre 1 e 5.")

    existente = session.exec(
        select(AvaliacaoCA)
        .where(AvaliacaoCA.atendimento_id == atendimento_id)
        .where(AvaliacaoCA.aluno_id == current.id)
    ).first()
    if existente:
        raise HTTPException(status_code=409, detail="Você já avaliou este CA.")

    avaliacao = AvaliacaoCA(
        atendimento_id=atendimento_id,
        aluno_id=current.id,
        nota=int(dados.nota),
        comentario=(dados.comentario or "").strip()[:1000] or None,
    )
    session.add(avaliacao)
    session.commit()
    session.refresh(avaliacao)

    media, total = _estatisticas_avaliacao(session, atendimento_id)
    return {
        "message": "Avaliação registrada. Obrigado pelo feedback!",
        "avaliacao": {
            "id": avaliacao.id,
            "nota": avaliacao.nota,
            "comentario": avaliacao.comentario,
            "criado_em": avaliacao.criado_em.isoformat() if avaliacao.criado_em else None,
        },
        "media": media,
        "total": total,
    }

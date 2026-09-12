import os
import re
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlmodel import select

from deps.deps import SessionDep
from models.users.user import Usuario
from models.users.aluno import Aluno
from data.cursos import CURSOS, get_disciplinas, get_curso
from data.turmas import get_turmas, get_turma, inferir_turma_sugerida, ano_letivo_da_turma

router = APIRouter(tags=["Alunos"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads" / "laudos"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

EMAIL_ESCOLAR_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@escolar\.ifrn\.edu\.br$")


class PerfilAlunoResponse(BaseModel):
    matricula: str
    nome: str
    email: str
    foto: str | None = None
    tipo_vinculo: str | None = None
    # turma (novo campo principal)
    turma_id: str | None = None
    turma_nome: str | None = None
    turma_codigo: str | None = None
    turno: str | None = None
    turno_label: str | None = None
    # campos legados mantidos para compatibilidade
    curso_id: str | None = None
    curso_nome: str | None = None
    ano_letivo: str | None = None
    # demais campos
    necessidades_especiais: bool = False
    perfil_completo: bool = False
    laudo_path: str | None = None
    disciplinas: list[str] = []


def _build_perfil(usuario: Usuario, aluno: Aluno | None, foto: str | None = None) -> PerfilAlunoResponse:
    turma = get_turma(aluno.turma_id) if aluno and aluno.turma_id else None

    # curso_id vem da turma (fonte primária) ou do campo legado
    curso_id_efetivo = turma["curso_id"] if turma else (aluno.curso_id if aluno else None)

    # ano_letivo: deriva da turma automaticamente; só usa o campo salvo como fallback
    ano_letivo_efetivo = (
        ano_letivo_da_turma(aluno.turma_id)
        if aluno and aluno.turma_id
        else (aluno.ano_letivo if aluno else None)
    )

    curso = get_curso(curso_id_efetivo) if curso_id_efetivo else None
    disciplinas = (
        get_disciplinas(curso_id_efetivo, ano_letivo_efetivo)
        if curso_id_efetivo and ano_letivo_efetivo
        else []
    )

    return PerfilAlunoResponse(
        matricula=usuario.matricula,
        nome=usuario.nome,
        email=usuario.email,
        foto=foto or (aluno.foto_suap if aluno else None),
        tipo_vinculo="Aluno",
        turma_id=aluno.turma_id if aluno else None,
        turma_nome=turma["nome"] if turma else None,
        turma_codigo=turma["codigo"] if turma else None,
        turno=turma["turno"] if turma else None,
        turno_label=turma["turno_label"] if turma else None,
        curso_id=curso_id_efetivo,
        curso_nome=curso["nome"] if curso else None,
        ano_letivo=ano_letivo_efetivo,
        necessidades_especiais=aluno.necessidades_especiais if aluno else False,
        perfil_completo=aluno.perfil_completo if aluno else False,
        laudo_path=aluno.laudo_path if aluno else None,
        disciplinas=disciplinas,
    )


def _get_aluno_por_matricula(session, matricula: str) -> tuple[Usuario, Aluno]:
    usuario = session.exec(select(Usuario).where(Usuario.matricula == matricula)).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    aluno = session.exec(select(Aluno).where(Aluno.id == usuario.id)).first()
    if not aluno:
        raise HTTPException(status_code=404, detail="Perfil de aluno não encontrado.")
    return usuario, aluno


# ---------------------------------------------------------------------------
# Rotas de listagem
# ---------------------------------------------------------------------------

@router.get("/cursos")
def listar_cursos():
    return [
        {
            "id": curso["id"],
            "nome": curso["nome"],
            "anos": [{"ano": a["ano"], "disciplinas": a["disciplinas"]} for a in curso["anos"]],
        }
        for curso in CURSOS
    ]


@router.get("/cursos/{curso_id}/{ano_letivo}/disciplinas")
def listar_disciplinas(curso_id: str, ano_letivo: str):
    curso = get_curso(curso_id)
    if not curso:
        raise HTTPException(status_code=404, detail="Curso não encontrado.")
    disciplinas = get_disciplinas(curso_id, ano_letivo)
    if not disciplinas:
        raise HTTPException(status_code=404, detail="Ano letivo não encontrado para este curso.")
    return {"curso_id": curso_id, "curso_nome": curso["nome"], "ano_letivo": ano_letivo, "disciplinas": disciplinas}


@router.get("/turmas")
def listar_turmas(ano_ingresso: int | None = None):
    """Lista todas as turmas ativas, opcionalmente filtradas por ano de ingresso."""
    return get_turmas(ano_ingresso=ano_ingresso)


@router.get("/turmas/codigos/{curso_id}")
def listar_codigos_turma(curso_id: str):
    """
    Retorna os códigos de turma disponíveis para um curso (ex: 1M, 2M, 1V, 2V).
    Independe do ano de ingresso — serve para o aluno escolher qual turma é a sua.
    """
    from data.turmas import CURSOS_TURMAS, TURNO_LABEL
    info = CURSOS_TURMAS.get(curso_id)
    if not info:
        raise HTTPException(status_code=404, detail="Curso não encontrado.")
    codigos = []
    for turno in info["turnos"]:
        for serie in range(1, info["series_por_turno"] + 1):
            codigos.append({
                "codigo": f"{serie}{turno}",
                "serie": serie,
                "turno": turno,
                "turno_label": TURNO_LABEL[turno],
                "label": f"{serie}{turno} — {TURNO_LABEL[turno]}",
            })
    return codigos


@router.get("/turmas/sugestao/{matricula}")
def sugerir_turma(matricula: str, turno: str):
    """
    Retorna a turma sugerida para o aluno com base na matrícula e no turno
    escolhido (M = Matutino, V = Vespertino).
    """
    turma = inferir_turma_sugerida(matricula, turno)
    if not turma:
        raise HTTPException(status_code=404, detail="Não foi possível inferir a turma para esta matrícula e turno.")
    return turma


# ---------------------------------------------------------------------------
# Rotas de perfil do aluno
# ---------------------------------------------------------------------------

@router.get("/alunos/perfil/{matricula}", response_model=PerfilAlunoResponse, response_model_exclude_none=True)
def obter_perfil(matricula: str, session: SessionDep):
    usuario, aluno = _get_aluno_por_matricula(session, matricula)
    return _build_perfil(usuario, aluno)


@router.post("/alunos/perfil/{matricula}", response_model=PerfilAlunoResponse, response_model_exclude_none=True)
async def completar_perfil(
    matricula: str,
    session: SessionDep,
    email: str = Form(...),
    turma_id: str = Form(...),
    necessidades_especiais: bool = Form(False),
    foto: str | None = Form(None),
    laudo: UploadFile | None = File(None),
):
    if not EMAIL_ESCOLAR_REGEX.match(email.strip().lower()):
        raise HTTPException(
            status_code=400,
            detail="Use um e-mail institucional terminado em @escolar.ifrn.edu.br.",
        )

    turma = get_turma(turma_id)
    if not turma:
        raise HTTPException(status_code=400, detail="Turma inválida.")

    usuario, aluno = _get_aluno_por_matricula(session, matricula)

    email_normalizado = email.strip().lower()
    outro = session.exec(
        select(Usuario).where(Usuario.email == email_normalizado, Usuario.id != usuario.id)
    ).first()
    if outro:
        raise HTTPException(status_code=400, detail="Este e-mail já está cadastrado por outro usuário.")

    laudo_path = aluno.laudo_path
    if necessidades_especiais and laudo and laudo.filename:
        ext = Path(laudo.filename).suffix.lower()
        if ext not in {".pdf", ".png", ".jpg", ".jpeg"}:
            raise HTTPException(status_code=400, detail="Laudo deve ser PDF, PNG ou JPG.")
        filename = f"{matricula}_{uuid.uuid4().hex}{ext}"
        destino = UPLOAD_DIR / filename
        conteudo = await laudo.read()
        destino.write_bytes(conteudo)
        laudo_path = f"uploads/laudos/{filename}"

    usuario.email = email_normalizado
    aluno.turma_id = turma_id
    # Mantemos curso_id e ano_letivo sincronizados com a turma para compatibilidade
    aluno.curso_id = turma["curso_id"]
    aluno.ano_letivo = ano_letivo_da_turma(turma_id)  # deriva automaticamente do ano de ingresso
    aluno.necessidades_especiais = necessidades_especiais
    aluno.perfil_completo = True
    aluno.laudo_path = laudo_path
    if foto:
        aluno.foto_suap = foto

    session.add(usuario)
    session.add(aluno)
    session.commit()
    session.refresh(usuario)
    session.refresh(aluno)

    return _build_perfil(usuario, aluno, foto=foto)

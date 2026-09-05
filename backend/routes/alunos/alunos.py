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
    curso_id: str | None = None
    curso_nome: str | None = None
    ano_letivo: str | None = None
    necessidades_especiais: bool = False
    perfil_completo: bool = False
    laudo_path: str | None = None
    disciplinas: list[str] = []


def _build_perfil(usuario: Usuario, aluno: Aluno | None, foto: str | None = None) -> PerfilAlunoResponse:
    curso = get_curso(aluno.curso_id) if aluno and aluno.curso_id else None
    disciplinas = (
        get_disciplinas(aluno.curso_id, aluno.ano_letivo)
        if aluno and aluno.curso_id and aluno.ano_letivo
        else []
    )
    return PerfilAlunoResponse(
        matricula=usuario.matricula,
        nome=usuario.nome,
        email=usuario.email,
        foto=foto or (aluno.foto_suap if aluno else None),
        tipo_vinculo="Aluno",
        curso_id=aluno.curso_id if aluno else None,
        curso_nome=curso["nome"] if curso else None,
        ano_letivo=aluno.ano_letivo if aluno else None,
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


@router.get("/alunos/perfil/{matricula}", response_model=PerfilAlunoResponse, response_model_exclude_none=True)
def obter_perfil(matricula: str, session: SessionDep):
    usuario, aluno = _get_aluno_por_matricula(session, matricula)
    return _build_perfil(usuario, aluno)


@router.post("/alunos/perfil/{matricula}", response_model=PerfilAlunoResponse, response_model_exclude_none=True)
async def completar_perfil(
    matricula: str,
    session: SessionDep,
    email: str = Form(...),
    curso_id: str = Form(...),
    ano_letivo: str = Form(...),
    necessidades_especiais: bool = Form(False),
    foto: str | None = Form(None),
    laudo: UploadFile | None = File(None),
):
    if not EMAIL_ESCOLAR_REGEX.match(email.strip().lower()):
        raise HTTPException(
            status_code=400,
            detail="Use um e-mail institucional terminado em @escolar.ifrn.edu.br.",
        )

    curso = get_curso(curso_id)
    if not curso:
        raise HTTPException(status_code=400, detail="Curso inválido.")

    disciplinas = get_disciplinas(curso_id, ano_letivo)
    if not disciplinas:
        raise HTTPException(status_code=400, detail="Ano letivo inválido para o curso selecionado.")

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
    aluno.curso_id = curso_id
    aluno.ano_letivo = ano_letivo
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

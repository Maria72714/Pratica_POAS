from typing import Annotated

from fastapi import APIRouter, UploadFile, File, Form
from pydantic import BaseModel

from deps.auth import AuthUser, assert_self_or_roles, get_current_user, require_roles
from deps.deps import SessionDep
from services.aluno_service import AlunoService

router = APIRouter(tags=["Alunos"])


class PerfilAlunoResponse(BaseModel):
    matricula: str
    nome: str
    email: str
    foto: str | None = None
    tipo_vinculo: str | None = None
    turma_id: str | None = None
    turma_nome: str | None = None
    turma_codigo: str | None = None
    turno: str | None = None
    turno_label: str | None = None
    curso_id: str | None = None
    curso_nome: str | None = None
    ano_letivo: str | None = None
    necessidades_especiais: bool = False
    perfil_completo: bool = True
    laudo_path: str | None = None
    disciplinas: list[str] = []


@router.get("/cursos")
def listar_cursos():
    return AlunoService(session=None).listar_cursos()


@router.get("/cursos/{curso_id}/{ano_letivo}/disciplinas")
def listar_disciplinas(curso_id: str, ano_letivo: str):
    return AlunoService(session=None).listar_disciplinas(curso_id, ano_letivo)


@router.get("/turmas")
def listar_turmas(ano_ingresso: int | None = None):
    return AlunoService(session=None).listar_turmas(ano_ingresso=ano_ingresso)


@router.get("/turmas/codigos/{curso_id}")
def listar_codigos_turma(curso_id: str):
    return AlunoService(session=None).listar_codigos_turma(curso_id)


@router.get("/turmas/sugestao/{matricula}")
def sugerir_turma(matricula: str, turno: str):
    return AlunoService(session=None).sugerir_turma(matricula, turno)


MediadorOuAdmin = Annotated[AuthUser, require_roles("mediador", "admin")]


@router.get("/alunos/laudos")
def listar_laudos_pnee(session: SessionDep, current_user: MediadorOuAdmin):
    """Lista todos os alunos que enviaram laudo ou solicitaram atendimento PNEE."""
    return AlunoService(session).listar_laudos_pnee()


class AvaliarLaudoInput(BaseModel):
    aprovado: bool


@router.patch("/alunos/{aluno_id}/avaliar-laudo")
def avaliar_laudo_pnee(
    aluno_id: str,
    payload: AvaliarLaudoInput,
    session: SessionDep,
    current_user: MediadorOuAdmin,
):
    """Aprova ou recusa o status de PNEE do aluno pelo Mediador."""
    return AlunoService(session).avaliar_laudo_pnee(aluno_id=aluno_id, aprovado=payload.aprovado)


@router.get("/alunos/perfil/{matricula}", response_model=PerfilAlunoResponse, response_model_exclude_none=True)
def obter_perfil(
    matricula: str,
    session: SessionDep,
    current: Annotated[AuthUser, get_current_user],
):
    assert_self_or_roles(current, matricula, "admin", "mediador", "professor")
    return AlunoService(session).obter_perfil(matricula)


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
    return await AlunoService(session).completar_perfil(
        matricula=matricula,
        email=email,
        turma_id=turma_id,
        necessidades_especiais=necessidades_especiais,
        foto=foto,
        laudo=laudo,
    )

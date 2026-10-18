import logging
import logging
import pathlib
import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from sqlmodel import select

from config.security import SecurityConfig
from config.logging_config import setup_logging
from routes.atendimentos import atendimento, atendimento_prof
from routes.usuarios import usuarios
from routes.alunos import alunos
from fastapi.staticfiles import StaticFiles
from deps.deps import lifespan, SessionDep
from deps.auth_middleware import JWTAuthMiddleware
from models.users.user import Usuario
from models.users.aluno import Aluno
from models.users.professor import Professor
from models.users.mediador import Mediador
from services.usuario_service import UsuarioService

load_dotenv()

logger = setup_logging()
logger = logging.getLogger(__name__)

try:
    SecurityConfig.validate_all()
except RuntimeError as e:
    logger.critical(f"Erro na configuração de segurança: {e}")
    raise

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")
SUAP_TOKEN_URL = os.getenv("SUAP_TOKEN_URL")
SUAP_PROFILE_URL = os.getenv("SUAP_PROFILE_URL")

app = FastAPI(lifespan=lifespan, title="POAS API", version="1.0.0")

allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allowed_origins if o.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.add_middleware(JWTAuthMiddleware)

# Routers
from routes import notificacoes, professores, solicitacao, chat, admin

app.include_router(atendimento.router, prefix="/api")
app.include_router(atendimento_prof.router, prefix="/api")
app.include_router(usuarios.router, prefix="/api")
app.include_router(alunos.router, prefix="/api")
app.include_router(notificacoes.router, prefix="/api")
app.include_router(professores.router, prefix="/api")
app.include_router(solicitacao.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

uploads_laudos = pathlib.Path(__file__).parent / "uploads" / "laudos"
uploads_laudos.mkdir(parents=True, exist_ok=True)
app.mount("/api/uploads/laudos", StaticFiles(directory=str(uploads_laudos)), name="uploads_laudos")


class AuthCode(BaseModel):
    code: str


class LoginInput(BaseModel):
    matricula: str
    senha: str


def _to_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    if isinstance(value, str):
        v = value.strip().lower()
        if v in {"1", "true", "verdadeiro", "sim", "s", "yes", "y", "ativo", "habilitado"}:
            return True
        if v in {"0", "false", "falso", "nao", "n", "no", "não", "inativo", "desabilitado", ""}:
            return False
        if any(token in v for token in ["pne", "pessoa com", "pcd", "deficien", "necessidade educacional", "necessidade especial"]):
            return True
    if isinstance(value, (list, tuple, set, dict)):
        return bool(value)
    return False


def _detect_special_needs(profile: dict):
    if not isinstance(profile, dict):
        return False

    keys = [
        "necessidades_especiais", "necessidades_educacionais_especiais", "pnee", "pne",
        "tem_pnee", "tem_necessidade_especial", "possui_necessidade_especial",
        "necessidade_especial", "pcd", "pessoa_com_deficiencia",
        "pessoa_com_deficiencia_ou_necessidade_especial", "deficiencia", "tem_deficiencia",
        "tipo_deficiencia", "tipo_necessidade", "aluno_pnee", "is_pnee",
    ]

    for key in keys:
        if key in profile:
            return _to_bool(profile.get(key))

    for value in profile.values():
        if isinstance(value, str) and any(
            token in value.lower()
            for token in ["pne", "pessoa com", "pcd", "deficien", "necessidade educacional", "necessidade especial"]
        ):
            return True

    return False


@app.post("/api/login")
def login_local(payload: LoginInput, session: SessionDep):
    return UsuarioService(session).autenticar_local(payload)


@app.post("/api/auth/suap")
async def auth_suap(payload: AuthCode, session: SessionDep):
    logger.info("Iniciando autenticação SUAP")

    async with httpx.AsyncClient() as client:
        token_payload = {
            "grant_type": "authorization_code",
            "code": payload.code,
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "redirect_uri": REDIRECT_URI,
        }

        token_response = await client.post(SUAP_TOKEN_URL, data=token_payload)
        logger.debug(f"Token response status: {token_response.status_code}")
        
        if token_response.status_code != 200:
            logger.warning(f"Falha ao obter token SUAP: {token_response.status_code} - {token_response.text[:500]}")
            raise HTTPException(status_code=400, detail="Falha ao obter token do SUAP")

        token_data = token_response.json()
        access_token = token_data.get("access_token")
        logger.debug(f"Token response keys: {token_data.keys()}")
        
        if not access_token:
            logger.warning(f"access_token não retornado pelo SUAP. Response: {token_data}")
            raise HTTPException(status_code=400, detail="Token inválido do SUAP")

        suap_rh_eu = os.getenv("SUAP_RH_EU")
        base_profile = SUAP_PROFILE_URL or "https://suap.ifrn.edu.br/api/v2/minhas-informacoes/meus-dados/"
        
        attempts = [
            {"url": base_profile, "auth": f"Bearer {access_token}"},
            {"url": base_profile, "auth": f"JWT {access_token}"},
        ]
        if suap_rh_eu:
            attempts.extend([
                {"url": suap_rh_eu, "auth": f"Bearer {access_token}"},
                {"url": suap_rh_eu, "auth": f"JWT {access_token}"},
            ])
        
        logger.debug(f"Tentando {len(attempts)} URLs para perfil")
        profile_response = None
        last_error = None
        for i, attempt in enumerate(attempts):
            try:
                url_tentativa = attempt["url"].rstrip("/")
                logger.debug(f"Tentativa {i+1}: GET {url_tentativa}")
                response = await client.get(
                    url_tentativa,
                    headers={"Authorization": attempt["auth"]},
                    timeout=5.0,
                    follow_redirects=True,
                )
                logger.debug(f"Tentativa {i+1} - Status: {response.status_code}")
                if response.status_code == 200:
                    profile_response = response
                    logger.debug(f"Perfil obtido com sucesso na tentativa {i+1}")
                    break
                last_error = f"Status {response.status_code}: {response.text[:200]}"
            except Exception as e:
                logger.debug(f"Tentativa {i+1} falhou com erro: {e}")
                last_error = str(e)

        if not profile_response or profile_response.status_code != 200:
            logger.warning(f"Falha ao buscar perfil SUAP. Último erro: {last_error}")
            raise HTTPException(status_code=400, detail="Falha ao buscar perfil do SUAP")

        perfil = profile_response.json()

    nome = perfil.get("nome_usual") or perfil.get("nome")
    nome_completo = perfil.get("nome_registro") or perfil.get("nome")
    matricula = perfil.get("matricula") or perfil.get("identificacao")
    email = (
        perfil.get("email")
        or perfil.get("email_preferencial")
        or perfil.get("email_academico")
        or perfil.get("email_secundario")
        or f"{matricula}@suap.ifrn.edu.br"
    )
    tipo_vinculo = perfil.get("tipo_vinculo") or perfil.get("tipo_usuario")
    foto = perfil.get("foto")
    necessidades_especiais = _detect_special_needs(perfil)

    if not matricula:
        raise HTTPException(status_code=400, detail="Matrícula não encontrada no perfil do SUAP")

    db_user = session.exec(select(Usuario).where(Usuario.matricula == matricula)).first()
    vinculo_lower = (tipo_vinculo or "").lower()
    is_aluno = "aluno" in vinculo_lower

    if not db_user:
        db_user = Usuario(
            nome=nome_completo or nome,
            email=email,
            matricula=matricula,
            senha="auth_suap"
        )
        session.add(db_user)
        session.commit()
        session.refresh(db_user)

        if is_aluno:
            session.add(Aluno(
                id=db_user.id,
                perfil_completo=False,
                necessidades_especiais=necessidades_especiais,
            ))
        elif "professor" in vinculo_lower or "servidor" in vinculo_lower or "docente" in vinculo_lower:
            session.add(Professor(id=db_user.id))
        session.commit()
    else:
        if is_aluno:
            aluno_existente = session.exec(select(Aluno).where(Aluno.id == db_user.id)).first()
            if not aluno_existente:
                session.add(Aluno(
                    id=db_user.id,
                    perfil_completo=False,
                    necessidades_especiais=necessidades_especiais,
                ))
                session.commit()
        elif "professor" in vinculo_lower or "servidor" in vinculo_lower or "docente" in vinculo_lower:
            prof_existente = session.exec(select(Professor).where(Professor.id == db_user.id)).first()
            if not prof_existente:
                session.add(Professor(id=db_user.id))
                session.commit()

    is_professor = not is_aluno and any(x in vinculo_lower for x in ["professor", "servidor", "docente"])
    if is_professor:
        try:
            from datetime import date
            from models.turma import Turma
            from models.disciplina import Disciplina
            from models.associativas.professor_turma import ProfessorTurma
            from models.associativas.professor_disciplina import ProfessorDisciplina

            ano_atual = date.today().year
            diarios = []
            
            for sem in [1, 2]:
                diarios_url = f"https://suap.ifrn.edu.br/api/v2/minhas-informacoes/meus-diarios/{ano_atual}/{sem}/"
                async with httpx.AsyncClient() as diario_client:
                    r_diario = await diario_client.get(
                        diarios_url,
                        headers={"Authorization": f"Bearer {access_token}"},
                        timeout=5.0
                    )
                    if r_diario.status_code == 200:
                        res_json = r_diario.json()
                        if isinstance(res_json, list):
                            diarios.extend(res_json)

            prof_obj = session.exec(select(Professor).where(Professor.id == db_user.id)).first()
            if prof_obj and diarios:
                for d in diarios:
                    nome_disc = d.get("componente_curricular") or d.get("disciplina") or d.get("descricao")
                    codigo_turma = d.get("turma") or d.get("codigo_turma") or d.get("sigla")

                    if nome_disc:
                        nome_disc = nome_disc.strip()
                        db_disc = session.exec(select(Disciplina).where(Disciplina.nome == nome_disc)).first()
                        if not db_disc:
                            db_disc = Disciplina(nome=nome_disc)
                            session.add(db_disc)
                            session.commit()
                            session.refresh(db_disc)

                        link_d = session.exec(
                            select(ProfessorDisciplina)
                            .where(ProfessorDisciplina.professor_id == prof_obj.id)
                            .where(ProfessorDisciplina.disciplina_id == db_disc.id)
                        ).first()
                        if not link_d:
                            session.add(ProfessorDisciplina(professor_id=prof_obj.id, disciplina_id=db_disc.id))

                    if codigo_turma:
                        codigo_turma = str(codigo_turma).strip()
                        db_turma = session.exec(select(Turma).where(Turma.codigo == codigo_turma)).first()
                        if not db_turma:
                            db_turma = Turma(ano=str(ano_atual), turno="Flexível", codigo=codigo_turma)
                            session.add(db_turma)
                            session.commit()
                            session.refresh(db_turma)

                        link_t = session.exec(
                            select(ProfessorTurma)
                            .where(ProfessorTurma.professor_id == prof_obj.id)
                            .where(ProfessorTurma.turma_id == db_turma.id)
                        ).first()
                        if not link_t:
                            session.add(ProfessorTurma(professor_id=prof_obj.id, turma_id=db_turma.id))

                session.commit()
                logger.info(f"Diários sincronizados para professor {db_user.nome}")
        except Exception as e_diarios:
            logger.warning(f"Não foi possível sincronizar diários: {e_diarios}")

    aluno = session.exec(select(Aluno).where(Aluno.id == db_user.id)).first()
    perfil_completo = True
    turma_id = None
    turma_nome = None
    turma_codigo = None
    turno = None
    turno_label = None
    curso_id = None
    curso_nome = None
    ano_letivo = None

    if aluno:
        from data.cursos import get_curso
        from data.turmas import get_turma as _get_turma
        from data.turmas import ano_letivo_da_turma as _ano_letivo_da_turma

        perfil_completo = True
        aluno.perfil_completo = True
        turma_id = aluno.turma_id
        curso_id = aluno.curso_id
        ano_letivo = aluno.ano_letivo

        if aluno.necessidades_especiais != necessidades_especiais:
            aluno.necessidades_especiais = necessidades_especiais
            session.add(aluno)
            session.commit()

        turma = _get_turma(turma_id) if turma_id else None
        if turma:
            turma_nome = turma["nome"]
            turma_codigo = turma["codigo"]
            turno = turma["turno"]
            turno_label = turma["turno_label"]
            curso_id = turma["curso_id"]

        ano_letivo = _ano_letivo_da_turma(turma_id) if turma_id else aluno.ano_letivo
        curso = get_curso(curso_id) if curso_id else None
        curso_nome = curso["nome"] if curso else None

        if foto and not aluno.foto_suap:
            aluno.foto_suap = foto
            session.add(aluno)
            session.commit()

    from data.cursos import get_disciplinas as _get_disciplinas
    from deps.auth import create_access_token
    from repositories.usuario_repository import UsuarioRepository

    disciplinas = _get_disciplinas(curso_id, ano_letivo) if curso_id and ano_letivo else []
    foto_resposta = foto or (aluno.foto_suap if aluno else None)

    role = "aluno" if is_aluno else UsuarioRepository(session).get_tipo_usuario(db_user.id)
    token = create_access_token(db_user, role)

    return {
        "id": db_user.id,
        "nome": nome,
        "nome_completo": nome_completo,
        "matricula": matricula,
        "email": db_user.email,
        "tipo_vinculo": tipo_vinculo,
        "foto": foto_resposta,
        "is_aluno": is_aluno,
        "perfil_completo": perfil_completo if is_aluno else True,
        "turma_id": turma_id,
        "turma_nome": turma_nome,
        "turma_codigo": turma_codigo,
        "turno": turno,
        "turno_label": turno_label,
        "curso_id": curso_id,
        "curso_nome": curso_nome,
        "ano_letivo": ano_letivo,
        "necessidades_especiais": necessidades_especiais,
        "disciplinas": disciplinas,
        "access_token": token,
        "token_type": "bearer",
        "tipo_usuario": role,
    }

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import httpx
import os
import json
import uuid
from typing import Optional, List
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

try:
    from backend.services.curriculo_service import get_curriculos_catalog
except ImportError:
    from services.curriculo_service import get_curriculos_catalog

# Configurações do cliente OAuth2 do SUAP
CLIENT_ID     = os.getenv("CLIENT_ID",     "6IPsGy1xSQlxdmEydLEfygqTVwoH06vkxdCwyZQa")
CLIENT_SECRET = os.getenv("CLIENT_SECRET", "7h9WemkRNQXy0is2iCHdieq75ZR0DRHu8ONqzhqaWRmdjksAN7TeGh4yZYKNRDXxQrpGVVZkfNaBqeDG6jKpNF43epS3b4z2d6zNDr1QzTPPDmgnFUmwRHEQ9fWbMf6E")
REDIRECT_URI  = os.getenv("REDIRECT_URI",  "http://localhost:5173/callback")

SUAP_TOKEN_URL   = "https://suap.ifrn.edu.br/o/token/"
SUAP_PROFILE_URL = "https://suap.ifrn.edu.br/api/v2/minhas-informacoes/meus-dados/"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuração de servir arquivos estáticos de uploads
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")
LAUDOS_DIR = os.path.join(UPLOADS_DIR, "laudos")
os.makedirs(LAUDOS_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Banco de dados de persistência de perfis complementares
DB_PROFILES_FILE = os.path.join(os.path.dirname(__file__), "user_profiles_db.json")

def load_user_profiles() -> dict:
    if os.path.exists(DB_PROFILES_FILE):
        try:
            with open(DB_PROFILES_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[DB] Erro ao carregar perfis: {e}")
            return {}
    return {}

def save_user_profiles(profiles: dict):
    try:
        with open(DB_PROFILES_FILE, "w", encoding="utf-8") as f:
            json.dump(profiles, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[DB] Erro ao salvar perfis: {e}")

user_profiles_db = load_user_profiles()


class AuthCode(BaseModel):
    code: str


@app.post("/api/auth/suap")
async def auth_suap(payload: AuthCode):
    print(f"\n[SUAP] Code recebido: {payload.code[:20]}...")

    async with httpx.AsyncClient() as client:

        # Realizamos a troca do código de autorização pelo token de acesso
        token_payload = {
            "grant_type":    "authorization_code",
            "code":          payload.code,
            "client_id":     CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "redirect_uri":  REDIRECT_URI,
        }
        print(f"[SUAP] Enviando para {SUAP_TOKEN_URL}")

        token_response = await client.post(SUAP_TOKEN_URL, data=token_payload)

        if token_response.status_code != 200:
            raise HTTPException(
                status_code=400,
                detail=f"Falha ao obter token do SUAP: {token_response.text}",
            )

        access_token = token_response.json().get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="access_token não retornado pelo SUAP.")

        # Buscamos os dados de perfil no SUAP
        profile_response = None
        SUAP_RH_EU = "https://suap.ifrn.edu.br/api/rh/eu/"
        
        tentativas = [
            {"url": SUAP_PROFILE_URL, "auth": f"Bearer {access_token}"},
            {"url": SUAP_PROFILE_URL, "auth": f"JWT {access_token}"},
            {"url": SUAP_RH_EU, "auth": f"Bearer {access_token}"},
            {"url": SUAP_RH_EU, "auth": f"JWT {access_token}"},
        ]
        
        for tent in tentativas:
            try:
                response = await client.get(
                    tent["url"],
                    headers={"Authorization": tent["auth"]},
                )
                if response.status_code == 200:
                    profile_response = response
                    break
            except Exception as e:
                print(f"[SUAP] Erro na tentativa de perfil: {e}")

        if not profile_response or profile_response.status_code != 200:
            profile_response = await client.get(
                SUAP_PROFILE_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )

        if profile_response.status_code != 200:
            raise HTTPException(
                status_code=400,
                detail=f"Falha ao buscar perfil do SUAP: {profile_response.text[:500]}",
            )

        perfil = profile_response.json()

    matricula = perfil.get("matricula") or f"USER_{uuid.uuid4().hex[:6]}"
    nome = perfil.get("nome_usual") or perfil.get("nome") or "Usuário SUAP"
    tipo_vinculo = perfil.get("tipo_vinculo") or "Aluno"

    foto_suap = (
        perfil.get("url_foto_150x200") or
        perfil.get("url_foto_75x100") or
        perfil.get("url_foto") or
        perfil.get("foto")
    )
    if foto_suap and not foto_suap.startswith("http"):
        foto_suap = f"https://suap.ifrn.edu.br{foto_suap}"

    if matricula not in user_profiles_db:
        user_profiles_db[matricula] = {
            "matricula": matricula,
            "nome": nome,
            "nome_completo": perfil.get("nome") or nome,
            "email": perfil.get("email") or "",
            "email_escolar": "",
            "tipo_vinculo": tipo_vinculo,
            "foto": foto_suap,
            "perfil_preenchido": False,
            "curso": "",
            "ano_letivo": "",
            "is_tai_claimed": False,
            "tai_status": "NAO_SOLICITADO",
            "laudo_url": None,
            "disciplinas": [],
            "turmas": []
        }
    else:
        # Atualiza campos vindos do SUAP
        user_profiles_db[matricula]["nome"] = nome
        if perfil.get("email"):
            user_profiles_db[matricula]["email"] = perfil.get("email")
        if foto_suap:
            user_profiles_db[matricula]["foto"] = foto_suap

    save_user_profiles(user_profiles_db)
    return user_profiles_db[matricula]


@app.get("/api/auth/me/{matricula}")
def get_current_user(matricula: str):
    if matricula in user_profiles_db:
        return user_profiles_db[matricula]
    raise HTTPException(status_code=404, detail="Usuário não encontrado.")


@app.get("/api/curriculos")
def get_curriculos():
    return get_curriculos_catalog()


@app.post("/api/perfil/completar")
async def completar_perfil(
    matricula: str = Form(...),
    email_escolar: str = Form(...),
    curso: str = Form(...),
    ano_letivo: Optional[str] = Form(None),
    is_tai_claimed: Optional[bool] = Form(False),
    disciplinas: Optional[str] = Form(None),
    turmas: Optional[str] = Form(None),
    laudo: Optional[UploadFile] = File(None)
):
    if matricula not in user_profiles_db:
        user_profiles_db[matricula] = {
            "matricula": matricula,
            "nome": "Usuário",
            "tipo_vinculo": "Aluno",
            "perfil_preenchido": False,
            "tai_status": "NAO_SOLICITADO"
        }

    usr = user_profiles_db[matricula]

    email_clean = email_escolar.strip().lower()
    tipo_v = (usr.get("tipo_vinculo") or "").lower()
    is_prof = "servidor" in tipo_v or "professor" in tipo_v or "docente" in tipo_v

    if not is_prof and not email_clean.endswith("@escolar.ifrn.edu.br"):
        raise HTTPException(
            status_code=400,
            detail="O e-mail escolar do aluno deve terminar obrigatoriamente com @escolar.ifrn.edu.br"
        )

    usr["email_escolar"] = email_escolar
    usr["curso"] = curso
    usr["perfil_preenchido"] = True

    if ano_letivo:
        usr["ano_letivo"] = ano_letivo

    if disciplinas:
        try:
            usr["disciplinas"] = json.loads(disciplinas)
        except Exception:
            usr["disciplinas"] = [d.strip() for d in disciplinas.split(",") if d.strip()]

    if turmas:
        try:
            usr["turmas"] = json.loads(turmas)
        except Exception:
            usr["turmas"] = [t.strip() for t in turmas.split(",") if t.strip()]

    if is_tai_claimed:
        usr["is_tai_claimed"] = True
        usr["tai_status"] = "PENDENTE"

        if laudo and laudo.filename:
            file_ext = os.path.splitext(laudo.filename)[1]
            unique_filename = f"laudo_{matricula}_{uuid.uuid4().hex[:8]}{file_ext}"
            file_path = os.path.join(LAUDOS_DIR, unique_filename)

            with open(file_path, "wb") as buffer:
                content = await laudo.read()
                buffer.write(content)

            usr["laudo_url"] = f"/uploads/laudos/{unique_filename}"
    else:
        usr["is_tai_claimed"] = False
        if usr.get("tai_status") == "PENDENTE":
            usr["tai_status"] = "NAO_SOLICITADO"

    save_user_profiles(user_profiles_db)
    return {"message": "Perfil atualizado com sucesso!", "usuario": usr}


@app.get("/api/admin/tai-solicitacoes")
def get_tai_solicitacoes():
    solicitacoes = []
    for mat, usr in user_profiles_db.items():
        if usr.get("is_tai_claimed") or usr.get("tai_status") in ["PENDENTE", "APROVADO", "REJEITADO"]:
            solicitacoes.append(usr)
    return solicitacoes


@app.post("/api/admin/tai-solicitacoes/{matricula}/aprovar")
def aprovar_tai(matricula: str):
    if matricula not in user_profiles_db:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    usr = user_profiles_db[matricula]
    usr["tai_status"] = "APROVADO"
    save_user_profiles(user_profiles_db)
    return {"message": f"Status TAI do aluno {usr.get('nome')} alterado para APROVADO.", "usuario": usr}


@app.post("/api/admin/tai-solicitacoes/{matricula}/recusar")
def recusar_tai(matricula: str):
    if matricula not in user_profiles_db:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    usr = user_profiles_db[matricula]
    usr["tai_status"] = "REJEITADO"
    save_user_profiles(user_profiles_db)
    return {"message": f"Status TAI do aluno {usr.get('nome')} alterado para REJEITADO.", "usuario": usr}

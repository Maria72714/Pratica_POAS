from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

# Configurações do cliente OAuth2 do SUAP
CLIENT_ID     = os.getenv("CLIENT_ID",     "6IPsGy1xSQlxdmEydLEfygqTVwoH06vkxdCwyZQa")
CLIENT_SECRET = os.getenv("CLIENT_SECRET", "7h9WemkRNQXy0is2iCHdieq75ZR0DRHu8ONqzhqaWRmdjksAN7TeGh4yZYKNRDXxQrpGVVZkfNaBqeDG6jKpNF43epS3b4z2d6zNDr1QzTPPDmgnFUmwRHEQ9fWbMf6E")
REDIRECT_URI  = os.getenv("REDIRECT_URI",  "http://localhost:5173/callback")

SUAP_TOKEN_URL   = "https://suap.ifrn.edu.br/o/token/"
SUAP_PROFILE_URL = "https://suap.ifrn.edu.br/api/v2/minhas-informacoes/meus-dados/"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
        print(f"[SUAP] redirect_uri={REDIRECT_URI} | client_id={CLIENT_ID[:10]}...")

        token_response = await client.post(SUAP_TOKEN_URL, data=token_payload)

        print(f"[SUAP] Token status: {token_response.status_code}")
        print(f"[SUAP] Token body: {token_response.text[:500]}")

        if token_response.status_code != 200:
            raise HTTPException(
                status_code=400,
                detail=f"Falha ao obter token do SUAP: {token_response.text}",
            )

        access_token = token_response.json().get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="access_token não retornado pelo SUAP.")

        print(f"[SUAP] access_token obtido: {access_token[:20]}...")

        # Buscamos os dados de perfil testando endpoints e formatos de cabeçalhos alternativos
        print(f"[SUAP] Buscando perfil em {SUAP_PROFILE_URL}")
        
        profile_response = None
        SUAP_RH_EU = "https://suap.ifrn.edu.br/api/rh/eu/"
        
        # Testamos combinações de URLs e esquemas (Bearer/JWT) pois variam entre as versões do SUAP
        tentativas = [
            {"url": SUAP_PROFILE_URL, "auth": f"Bearer {access_token}"},
            {"url": SUAP_PROFILE_URL, "auth": f"JWT {access_token}"},
            {"url": SUAP_PROFILE_URL.rstrip("/"), "auth": f"Bearer {access_token}"},
            {"url": SUAP_PROFILE_URL.rstrip("/"), "auth": f"JWT {access_token}"},
            {"url": SUAP_RH_EU, "auth": f"Bearer {access_token}"},
            {"url": SUAP_RH_EU, "auth": f"JWT {access_token}"},
            {"url": SUAP_RH_EU.rstrip("/"), "auth": f"Bearer {access_token}"},
            {"url": SUAP_RH_EU.rstrip("/"), "auth": f"JWT {access_token}"},
        ]
        
        for i, tent in enumerate(tentativas):
            try:
                print(f"[SUAP] Tentativa {i+1}: URL={tent['url']} | Auth={tent['auth'][:15]}...")
                response = await client.get(
                    tent["url"],
                    headers={"Authorization": tent["auth"]},
                )
                print(f"[SUAP] Resposta status: {response.status_code}")
                if response.status_code == 200:
                    profile_response = response
                    break
            except Exception as e:
                print(f"[SUAP] Erro na tentativa {i+1}: {e}")

        if not profile_response:
            # Fallback final se tudo falhar para capturar e expor o erro real
            profile_response = await client.get(
                SUAP_PROFILE_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )

        print(f"[SUAP] Perfil status final: {profile_response.status_code}")
        print(f"[SUAP] Perfil content-type: {profile_response.headers.get('content-type', 'N/A')}")
        print(f"[SUAP] Perfil body (300 chars): {profile_response.text[:300]}")

        if profile_response.status_code != 200:
            raise HTTPException(
                status_code=400,
                detail=f"Falha ao buscar perfil do SUAP: {profile_response.text[:500]}",
            )

        perfil = profile_response.json()
        print(f"[SUAP] Chaves do perfil: {perfil.keys()}")
        print(f"[SUAP] Objeto perfil completo: {perfil}")

    # Retornamos apenas as chaves necessárias estruturadas de forma consistente
    return {
        "nome":          perfil.get("nome_usual") or perfil.get("nome"),
        "nome_completo": perfil.get("nome"),
        "matricula":     perfil.get("matricula"),
        "email":         perfil.get("email"),
        "tipo_vinculo":  perfil.get("tipo_vinculo"),
        "foto":          perfil.get("foto"),
    }

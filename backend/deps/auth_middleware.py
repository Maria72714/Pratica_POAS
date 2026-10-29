from fastapi import HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from sqlmodel import Session
import time
import logging

from database import engine
from deps.auth import auth_user_from_token

logger = logging.getLogger(__name__)

# Cache simples em memória para tokens validados
_auth_cache = {}
_CACHE_TTL = 300  # 5 minutos


def _get_cached_auth(token: str):
    if token in _auth_cache:
        entry = _auth_cache[token]
        if time.time() - entry["time"] < _CACHE_TTL:
            return entry["user"]
    return None


def _set_cached_auth(token: str, user):
    _auth_cache[token] = {"user": user, "time": time.time()}
    # Limpar cache antigo se crescer demais
    if len(_auth_cache) > 1000:
        oldest_key = min(_auth_cache, key=lambda k: _auth_cache[k]["time"])
        del _auth_cache[oldest_key]


def _is_public_request(method: str, path: str) -> bool:
    if not path.startswith("/api"):
        return True

    if (method, path) in {
        ("POST", "/api/login"),
        ("POST", "/api/auth/suap"),
        ("POST", "/api/usuarios/mediador/solicitar"),
    }:
        return True

    if method == "GET":
        if path == "/api/cursos":
            return True
        if path.startswith("/api/cursos/") and path.endswith("/disciplinas"):
            return True
        if path.startswith("/api/turmas"):
            return True
        if path == "/api/disciplinas":
            return True
        if path.startswith("/api/uploads/laudos"):
            return True

    return False


class JWTAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        method = request.method.upper()
        path = request.url.path

        # Sempre permitir OPTIONS (CORS preflight)
        if method == "OPTIONS":
            return await call_next(request)

        if _is_public_request(method, path):
            return await call_next(request)

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.lower().startswith("bearer "):
            return JSONResponse(status_code=401, content={"detail": "Autenticação necessária."})

        token = auth_header.split(" ", 1)[1].strip()
        
        # Verificar cache primeiro
        cached_user = _get_cached_auth(token)
        if cached_user:
            request.state.user = cached_user
            return await call_next(request)
        
        session = None
        try:
            session = Session(engine)
            user = auth_user_from_token(session, token, check_mediador=False)
            request.state.user = user
            _set_cached_auth(token, user)
        except HTTPException as exc:
            return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
        except Exception as exc:
            logger.error(f"Erro na autenticação: {exc}")
            return JSONResponse(status_code=500, content={"detail": "Erro na autenticação"})
        finally:
            if session:
                session.close()

        return await call_next(request)

from fastapi import HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from sqlmodel import Session

from database import engine
from deps.auth import auth_user_from_token


def _is_public_request(method: str, path: str) -> bool:
    if method == "OPTIONS":
        return True
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
        if path.startswith("/api/uploads/laudos"):
            return True

    return False


class JWTAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        method = request.method.upper()
        path = request.url.path

        if _is_public_request(method, path):
            return await call_next(request)

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.lower().startswith("bearer "):
            return JSONResponse(status_code=401, content={"detail": "Autenticação necessária."})

        token = auth_header.split(" ", 1)[1].strip()
        session = None
        try:
            session = Session(engine)
            request.state.user = auth_user_from_token(session, token)
        except HTTPException as exc:
            return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
        except Exception as exc:
            import logging
            logging.error(f"Erro na autenticação: {exc}")
            return JSONResponse(status_code=500, content={"detail": "Erro na autenticação"})
        finally:
            if session:
                session.close()

        return await call_next(request)

import os
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session, select

from database import get_session
from models.users.aluno import Aluno
from models.users.mediador import Mediador
from models.users.professor import Professor
from models.users.user import Usuario
from repositories.usuario_repository import UsuarioRepository
from config.security import SecurityConfig

logger = logging.getLogger(__name__)

JWT_SECRET = SecurityConfig.get_jwt_secret()
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "24"))

_bearer = HTTPBearer(auto_error=False)


@dataclass
class AuthUser:
    id: int
    matricula: str
    role: str
    email: str | None = None


def resolve_role(session: Session, user_id: int) -> str:
    return UsuarioRepository(session).get_tipo_usuario(user_id)


def create_access_token(user: Usuario, role: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)
    payload = {
        "sub": str(user.id),
        "matricula": user.matricula,
        "role": role,
        "exp": exp,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado.") from exc


def auth_user_from_token(session: Session, token: str, check_mediador: bool = True) -> AuthUser:
    payload = decode_access_token(token)
    user_id = int(payload.get("sub", 0))
    role = payload.get("role", "")
    matricula = payload.get("matricula", "")
    
    # Se o JWT já tem role e matricula, não precisa query (otimizado)
    if role and matricula:
        if check_mediador and role == "mediador":
            user = session.get(Usuario, user_id)
            if not user:
                raise HTTPException(status_code=401, detail="Usuário não encontrado.")
            mediador = session.exec(select(Mediador).where(Mediador.id == user.id)).first()
            if mediador and not mediador.aprovado:
                raise HTTPException(
                    status_code=403,
                    detail="Cadastro de mediador aguardando aprovação do administrador.",
                )
        return AuthUser(
            id=user_id,
            matricula=matricula,
            role=role,
            email=payload.get("email", None),
        )
    
    # Fallback: fazer query se informações estão incompletas
    user = session.get(Usuario, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado.")

    role = role or resolve_role(session, user.id)
    if role == "mediador" and check_mediador:
        mediador = session.exec(select(Mediador).where(Mediador.id == user.id)).first()
        if mediador and not mediador.aprovado:
            raise HTTPException(
                status_code=403,
                detail="Cadastro de mediador aguardando aprovação do administrador.",
            )

    return AuthUser(
        id=user.id,
        matricula=user.matricula or "",
        role=role,
        email=user.email,
    )


def get_current_user(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    session: Annotated[Session, Depends(get_session)],
) -> AuthUser:
    if getattr(request.state, "user", None):
        return request.state.user

    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Autenticação necessária.")

    user = auth_user_from_token(session, credentials.credentials)
    request.state.user = user
    return user


def require_roles(*roles: str):
    def _checker(current: Annotated[AuthUser, Depends(get_current_user)]) -> AuthUser:
        if current.role not in roles:
            raise HTTPException(status_code=403, detail="Permissão insuficiente.")
        return current

    return _checker


def assert_self_or_roles(
    current: AuthUser,
    matricula_ou_id: str | int | None,
    *roles: str,
) -> None:
    if current.role in roles:
        return
    if matricula_ou_id is None:
        raise HTTPException(status_code=403, detail="Acesso negado.")
    ident = str(matricula_ou_id).strip()
    if ident.isdigit() and int(ident) == current.id:
        return
    if ident == current.matricula:
        return
    raise HTTPException(status_code=403, detail="Acesso negado a dados de outro usuário.")

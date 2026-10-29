"""
Armazenamento dos tokens do SUAP obtidos no login OAuth.

O token do SUAP é necessário para reconsultar dados oficiais do usuário
(ex.: disciplinas do boletim/diários) sem exigir que o frontend manipule ou
guarde esse token. Segue o mesmo padrão de cache em memória usado em
``deps/auth_middleware.py``.
"""
import time
import logging

logger = logging.getLogger(__name__)

_store: dict[int, dict] = {}
_DEFAULT_TTL = 3600  # 1 hora, usada quando o SUAP não informa expires_in


def salvar_token(
    user_id: int,
    access_token: str,
    refresh_token: str | None = None,
    expires_in: int | None = None,
) -> None:
    """Guarda o token de acesso do SUAP para o usuário logado."""
    if not user_id or not access_token:
        return
    ttl = expires_in if isinstance(expires_in, int) and expires_in > 0 else _DEFAULT_TTL
    _store[user_id] = {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_at": time.time() + ttl,
    }
    logger.debug(f"Token SUAP armazenado para usuário {user_id} (ttl={ttl}s)")


def obter_token(user_id: int) -> str | None:
    """Retorna o token do SUAP válido do usuário, ou ``None`` se ausente/expirado."""
    entry = _store.get(user_id)
    if not entry:
        return None
    if time.time() >= entry["expires_at"]:
        _store.pop(user_id, None)
        return None
    return entry["access_token"]


def remover_token(user_id: int) -> None:
    """Remove o token do SUAP do usuário (usado no logout)."""
    _store.pop(user_id, None)

"""Cache em memória com TTL para as rotas de leitura.

O banco de dados (Neon) fica em outra região (us-east), então cada query custa
~150ms de ida-e-volta. Como a maioria das telas faz várias consultas seguidas,
a latência percebida fica alta. Este cache guarda a resposta das rotas de
leitura por um curto período, tornando os recarregamentos praticamente
instantâneos.

Regras de segurança:
  - A chave inclui a identidade do usuário (id + papel), então um usuário nunca
    recebe a resposta cacheada de outro.
  - Qualquer escrita (POST/PUT/PATCH/DELETE) limpa o cache inteiro, garantindo
    que a resposta fique desatualizada no máximo pelo TTL.
"""
from __future__ import annotations

import functools
import inspect
import threading
import time
from typing import Any, Callable

# Evita crescimento indefinido do cache em execuções longas.
_MAX_ENTRIES = 2000

_lock = threading.Lock()
_store: dict[str, tuple[float, Any]] = {}


def _get(key: str) -> Any | None:
    entry = _store.get(key)
    if entry is None:
        return None
    expires_at, value = entry
    if time.time() > expires_at:
        _store.pop(key, None)
        return None
    return value


def _set(key: str, value: Any, ttl: float) -> None:
    with _lock:
        _store[key] = (time.time() + ttl, value)
        if len(_store) > _MAX_ENTRIES:
            # Descarta as entradas cuja expiração é mais próxima.
            excedente = len(_store) - _MAX_ENTRIES
            for chave_antiga in sorted(_store, key=lambda k: _store[k][0])[:excedente]:
                _store.pop(chave_antiga, None)


def invalidate_all() -> None:
    """Limpa todo o cache. Chamado após qualquer escrita na API."""
    with _lock:
        _store.clear()


def _key_repr(value: Any) -> str:
    if value is None:
        return "-"
    if isinstance(value, (str, int, float, bool)):
        return str(value)
    # AuthUser (e afins): usa id + papel para não vazar dados entre usuários.
    ident = getattr(value, "id", None)
    role = getattr(value, "role", None)
    if ident is not None and role is not None:
        return f"u{ident}:{role}"
    return repr(value)


def cache_read(ttl: float = 30.0) -> Callable:
    """Decora uma rota de leitura com cache de resposta.

    A chave combina o nome da função com todos os seus parâmetros, exceto a
    sessão do banco (injetada pelo FastAPI). Funções que aceitam ``**kwargs``
    fora do esperado não são cacheadas, para evitar resultados incorretos.
    """

    def decorator(func: Callable) -> Callable:
        signature = inspect.signature(func)

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            try:
                bound = signature.bind(*args, **kwargs)
            except TypeError:
                return func(*args, **kwargs)

            partes = [func.__module__, func.__qualname__]
            for nome, valor in bound.arguments.items():
                if nome == "session":
                    continue
                partes.append(f"{nome}={_key_repr(valor)}")
            key = "|".join(partes)

            resultado = _get(key)
            if resultado is not None:
                return resultado

            resultado = func(*args, **kwargs)
            _set(key, resultado, ttl)
            return resultado

        return wrapper

    return decorator

"""
Proxy para a API do SUAP - busca dados reais do usuário logado.
Usa o token JWT do pratiCA para autenticar, e repassa ao SUAP com o token SUAP salvo.
"""
import httpx
import logging
from datetime import date
from typing import Annotated

from fastapi import APIRouter, HTTPException, Header, Depends
from deps.auth import AuthUser, get_current_user
from deps.deps import SessionDep
from services.suap_token_store import obter_token

router = APIRouter(prefix="/suap", tags=["SUAP"])
logger = logging.getLogger(__name__)

SUAP_BASE = "https://suap.ifrn.edu.br/api"


def _extrair_itens(dados: dict | list | None) -> list:
    """Normaliza respostas do SUAP: lista direta ou paginada ({"results": [...]})."""
    if isinstance(dados, list):
        return dados
    if isinstance(dados, dict):
        itens = dados.get("results")
        if isinstance(itens, list):
            return itens
        return [dados]
    return []


async def _fetch_suap(url: str, suap_token: str) -> dict | list | None:
    """Faz uma requisição à API do SUAP com o token do aluno/professor."""
    async with httpx.AsyncClient() as client:
        for auth_type in ["Bearer", "JWT"]:
            try:
                r = await client.get(
                    url,
                    headers={"Authorization": f"{auth_type} {suap_token}"},
                    timeout=8.0,
                    follow_redirects=True,
                )
                if r.status_code == 200:
                    return r.json()
            except Exception as e:
                logger.warning(f"SUAP fetch failed ({auth_type}): {e}")
    return None


@router.get("/minhas-disciplinas")
async def buscar_disciplinas_suap(
    session: SessionDep,
    current_user: Annotated[AuthUser, Depends(get_current_user)],
    x_suap_token: str = Header(default=None, alias="X-Suap-Token"),
):
    """
    Busca as disciplinas reais do aluno/professor no SUAP.

    Usa o token do SUAP guardado no servidor durante o login (OAuth). O header
    X-Suap-Token é opcional e serve apenas como override.

    Para alunos: busca o boletim do ano atual.
    Para professores: busca os diários do ano atual.

    Retorna lista de nomes de disciplinas.
    """
    # Prefere o header (override), mas normalmente usa o token guardado no login.
    token_suap = x_suap_token or obter_token(current_user.id)
    if not token_suap:
        raise HTTPException(
            status_code=401,
            detail="Sessão do SUAP expirada. Faça login novamente pelo SUAP para atualizar as disciplinas."
        )

    ano_atual = date.today().year
    disciplinas = set()

    role = current_user.role

    if role == "aluno":
        # Boletim oficial do aluno (API v2: /ensino/meu-boletim/{ano}/{periodo}/).
        # Além das disciplinas, resolve os professores de cada diário a partir do
        # próprio SUAP, para não depender do sync do professor.
        from services.suap_disciplinas_service import sincronizar_disciplinas_aluno

        for nome in await sincronizar_disciplinas_aluno(session, token_suap, ano_atual):
            disciplinas.add(nome)

    elif role in ("professor", "servidor"):
        # Diários oficiais do professor (API v2: /ensino/meus-diarios/{ano}/{periodo}/).
        for sem in [1, 2]:
            url = f"{SUAP_BASE}/ensino/meus-diarios/{ano_atual}/{sem}/"
            dados = await _fetch_suap(url, token_suap)
            for item in _extrair_itens(dados):
                nome = (
                    item.get("componente_curricular")
                    or item.get("disciplina")
                    or item.get("descricao")
                )
                if nome:
                    disciplinas.add(str(nome).strip())

    disciplinas_lista = sorted(list(disciplinas))

    if not disciplinas_lista:
        logger.warning(
            f"SUAP não retornou disciplinas para usuário {current_user.id} (role={role}). "
            "Verifique se o token SUAP ainda é válido."
        )
        raise HTTPException(
            status_code=404,
            detail="Nenhuma disciplina encontrada no SUAP para o ano atual. "
                   "Verifique se você está matriculado/com diários no período atual."
        )

    logger.info(f"SUAP: {len(disciplinas_lista)} disciplinas encontradas para {current_user.id}")
    return {"disciplinas": disciplinas_lista, "ano": ano_atual}

"""
Definição estática das turmas do IFRN - Campus Natal-Central.

Formato do código de turma no SUAP (ex: 2023.1 2M):
  - ano_ingresso: ano em que a turma ingressou (extraído dos 4 primeiros dígitos da matrícula)
  - semestre: sempre 1 (cursos anuais integrados)
  - serie: posição da turma no mesmo turno/curso (1 ou 2)
  - turno_codigo: M (Matutino) ou V (Vespertino)

Regra de negócio para Informática para Internet:
  - Tem 2 turmas por turno: 1M, 2M, 1V, 2V
  - Outros cursos: somente 1M e 1V

Formato de ID interno: "<curso>_<ano_ingresso>_<serie><turno>"
  ex: "informatica_2023_2M", "eletrotecnica_2023_1M"
"""

from datetime import date

ANOS_LETIVOS = ["1º Ano", "2º Ano", "3º Ano", "4º Ano"]

# Mapeamento dos cursos que possuem turmas
CURSOS_TURMAS = {
    "informatica_internet": {
        "nome": "Informática para Internet",
        "turnos": ["M", "V"],
        "series_por_turno": 2,   # 1M, 2M, 1V, 2V
    },
    "eletrotecnica": {
        "nome": "Eletrotécnica",
        "turnos": ["M", "V"],
        "series_por_turno": 1,   # 1M, 1V
    },
    "vestuario": {
        "nome": "Vestuário",
        "turnos": ["M", "V"],
        "series_por_turno": 1,
    },
    "textil": {
        "nome": "Têxtil",
        "turnos": ["M", "V"],
        "series_por_turno": 1,
    },
}

TURNO_LABEL = {"M": "Matutino", "V": "Vespertino"}


def _make_turma(curso_id: str, curso_info: dict, ano_ingresso: int, serie: int, turno: str) -> dict:
    """Constrói o dicionário de uma turma."""
    turma_id = f"{curso_id}_{ano_ingresso}_{serie}{turno}"
    codigo_display = f"{serie}{turno}"
    nome_display = (
        f"{curso_info['nome']} {ano_ingresso}.1 {codigo_display}"
    )
    return {
        "id": turma_id,
        "curso_id": curso_id,
        "curso_nome": curso_info["nome"],
        "ano_ingresso": ano_ingresso,
        "semestre": 1,
        "serie": serie,
        "turno": turno,
        "turno_label": TURNO_LABEL[turno],
        "codigo": codigo_display,
        "nome": nome_display,
    }


def get_turmas(ano_ingresso: int | None = None) -> list[dict]:
    """
    Retorna todas as turmas ativas.
    Se ano_ingresso for informado, filtra apenas as turmas daquele ano.
    Considera os últimos 4 anos de ingresso (cursos de 4 anos).
    """
    ano_atual = date.today().year
    anos = (
        [ano_ingresso]
        if ano_ingresso
        else list(range(ano_atual - 3, ano_atual + 1))
    )

    turmas = []
    for curso_id, info in CURSOS_TURMAS.items():
        for ano in anos:
            for turno in info["turnos"]:
                for serie in range(1, info["series_por_turno"] + 1):
                    turmas.append(_make_turma(curso_id, info, ano, serie, turno))
    return turmas


def get_turma(turma_id: str) -> dict | None:
    """
    Busca uma turma pelo ID.
    O ID tem formato: "<curso_id>_<ano_ingresso>_<serie><turno>"
    Reconstrói o objeto sem depender do range de anos de get_turmas().
    """
    if not turma_id:
        return None
    # Tenta parsear o ID diretamente: split no último '_' para separar código, e penúltimo para ano
    # Formato esperado: "informatica_internet_2023_2M"
    parts = turma_id.rsplit("_", 2)  # ["informatica_internet", "2023", "2M"]
    if len(parts) != 3:
        return None
    curso_id, ano_str, codigo = parts
    try:
        ano_ingresso = int(ano_str)
    except ValueError:
        return None
    if len(codigo) < 2:
        return None
    try:
        serie = int(codigo[:-1])
    except ValueError:
        return None
    turno = codigo[-1].upper()
    info = CURSOS_TURMAS.get(curso_id)
    if not info:
        return None
    if turno not in info["turnos"]:
        return None
    if serie < 1 or serie > info["series_por_turno"]:
        return None
    return _make_turma(curso_id, info, ano_ingresso, serie, turno)


def inferir_turma_sugerida(matricula: str, turno: str | None = None) -> dict | None:
    # nao ta funcionao isso nao
    if not matricula or len(matricula) < 4:
        return None

    try:
        ano_ingresso = int(matricula[:4])
    except ValueError:
        return None

    if not turno:
        return None

    turno_upper = turno.upper()
    if turno_upper not in ("M", "V"):
        return None

    turmas_filtradas = [
        t for t in get_turmas(ano_ingresso)
        if t["turno"] == turno_upper
    ]
    return turmas_filtradas[0] if turmas_filtradas else None


def get_turmas_por_curso_e_turno(curso_id: str, turno: str) -> list[dict]:
    """Retorna todas as turmas de um curso num determinado turno."""
    turno_upper = turno.upper()
    return [
        t for t in get_turmas()
        if t["curso_id"] == curso_id and t["turno"] == turno_upper
    ]


def ano_letivo_da_turma(turma_id: str, ano_referencia: int | None = None) -> str | None:
    """
    Deriva o ano letivo atual ("1º Ano", "2º Ano", etc.) com base no
    ano de ingresso embutido no turma_id e no ano de referência (padrão: ano corrente).

    Ex: turma_id="informatica_internet_2023_2M", ano_referencia=2026
        → 2026 - 2023 + 1 = 4 → "4º Ano"
    """
    turma = get_turma(turma_id)
    if not turma:
        return None
    ano_ref = ano_referencia or date.today().year
    posicao = ano_ref - turma["ano_ingresso"] + 1
    if 1 <= posicao <= len(ANOS_LETIVOS):
        return ANOS_LETIVOS[posicao - 1]
    # Fora do range — retorna o último ano se ultrapassou
    if posicao > len(ANOS_LETIVOS):
        return ANOS_LETIVOS[-1]
    return None

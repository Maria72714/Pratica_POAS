from datetime import datetime, timedelta
from typing import Optional, Dict, List


def calcular_pascoa(ano: int) -> datetime:
    """Algoritmo de Meeus/Jones/Butcher para calcular a Páscoa em qualquer ano."""
    a = ano % 19
    b = ano // 100
    c = ano % 100
    d = b // 4
    e = b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i = c // 4
    k = c % 4
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    mes = (h + l - 7 * m + 114) // 31
    dia = ((h + l - 7 * m + 114) % 31) + 1
    return datetime(ano, mes, dia)


def adicionar_dias(data: datetime, dias: int) -> datetime:
    """Adiciona dias a uma data."""
    return data + timedelta(days=dias)


def formatar_iso(data: datetime) -> str:
    """Formata data para ISO 'YYYY-MM-DD'."""
    return data.strftime("%Y-%m-%d")


def get_feriados_do_ano(ano: int) -> List[Dict[str, str]]:
    """Gera todos os feriados e recessos letivos para o ano."""
    pascoa = calcular_pascoa(ano)
    carnaval_seg = adicionar_dias(pascoa, -48)
    carnaval_terc = adicionar_dias(pascoa, -47)
    cinzas = adicionar_dias(pascoa, -46)
    sexta_santa = adicionar_dias(pascoa, -2)
    corpus_christi = adicionar_dias(pascoa, 60)

    return [
        {"data": f"{ano}-01-01", "descricao": "Confraternização Universal", "tipo": "feriado"},
        {"data": formatar_iso(carnaval_seg), "descricao": "Carnaval (Recesso)", "tipo": "recesso"},
        {"data": formatar_iso(carnaval_terc), "descricao": "Carnaval", "tipo": "feriado"},
        {"data": formatar_iso(cinzas), "descricao": "Quarta-feira de Cinzas", "tipo": "recesso"},
        {"data": formatar_iso(sexta_santa), "descricao": "Sexta-feira Santa", "tipo": "feriado"},
        {"data": f"{ano}-04-21", "descricao": "Tiradentes", "tipo": "feriado"},
        {"data": f"{ano}-05-01", "descricao": "Dia do Trabalho", "tipo": "feriado"},
        {"data": formatar_iso(corpus_christi), "descricao": "Corpus Christi", "tipo": "feriado"},
        {"data": f"{ano}-06-24", "descricao": "São João (Feriado Regional)", "tipo": "feriado"},
        {"data": f"{ano}-07-26", "descricao": "Festa de Sant'Ana (Feriado Municipal Caicó)", "tipo": "feriado"},
        {"data": f"{ano}-09-07", "descricao": "Independência do Brasil", "tipo": "feriado"},
        {"data": f"{ano}-10-12", "descricao": "Nossa Senhora Aparecida", "tipo": "feriado"},
        {"data": f"{ano}-10-28", "descricao": "Dia do Servidor Público", "tipo": "recesso"},
        {"data": f"{ano}-11-02", "descricao": "Finados", "tipo": "feriado"},
        {"data": f"{ano}-11-15", "descricao": "Proclamação da República", "tipo": "feriado"},
        {"data": f"{ano}-11-20", "descricao": "Dia da Consciência Negra", "tipo": "feriado"},
        {"data": f"{ano}-12-25", "descricao": "Natal", "tipo": "feriado"},
    ]


def get_evento_do_dia(data_iso: Optional[str]) -> Optional[Dict[str, str]]:
    """Retorna evento (feriado/recesso) se houver nesta data."""
    if not data_iso:
        return None
    
    try:
        ano = int(data_iso.split("-")[0])
    except (IndexError, ValueError):
        return None
    
    feriados = get_feriados_do_ano(ano)
    return next((f for f in feriados if f["data"] == data_iso), None)


def is_feriado_ou_recesso(data_iso: str) -> bool:
    """Verifica se a data é feriado ou recesso."""
    return get_evento_do_dia(data_iso) is not None

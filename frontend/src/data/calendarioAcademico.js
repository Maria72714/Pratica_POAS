// Módulo dinâmico de Calendário Acadêmico e Feriados para QUALQUER ano
// Suporta cálculo automático de Páscoa, Carnaval, Corpus Christi e feriados fixos + períodos letivos SUAP

// Algoritmo de Meeus/Jones/Butcher para calcular a Páscoa em qualquer ano
function calcularPascoa(ano) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31); // 3 = Março, 4 = Abril
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

function formatarISO(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function adicionarDias(dataObj, dias) {
  const d = new Date(dataObj);
  d.setDate(d.getDate() + dias);
  return d;
}

// Gera todos os feriados e recessos letivos automaticamente para o ano solicitado
export function getFeriadosDoAno(ano) {
  const pascoa = calcularPascoa(ano);
  const carnavalSeg = adicionarDias(pascoa, -48);
  const carnavalTerc = adicionarDias(pascoa, -47);
  const cinzas = adicionarDias(pascoa, -46);
  const sextaSanta = adicionarDias(pascoa, -2);
  const corpusChristi = adicionarDias(pascoa, 60);

  return [
    { data: `${ano}-01-01`, descricao: 'Confraternização Universal', tipo: 'feriado' },
    { data: formatarISO(carnavalSeg), descricao: 'Carnaval (Recesso)', tipo: 'recesso' },
    { data: formatarISO(carnavalTerc), descricao: 'Carnaval', tipo: 'feriado' },
    { data: formatarISO(cinzas), descricao: 'Quarta-feira de Cinzas', tipo: 'recesso' },
    { data: formatarISO(sextaSanta), descricao: 'Sexta-feira Santa', tipo: 'feriado' },
    { data: `${ano}-04-21`, descricao: 'Tiradentes', tipo: 'feriado' },
    { data: `${ano}-05-01`, descricao: 'Dia do Trabalho', tipo: 'feriado' },
    { data: formatarISO(corpusChristi), descricao: 'Corpus Christi', tipo: 'feriado' },
    { data: `${ano}-06-24`, descricao: 'São João (Feriado Regional)', tipo: 'feriado' },
    { data: `${ano}-07-26`, descricao: "Festa de Sant'Ana (Feriado Municipal Caicó)", tipo: 'feriado' },
    { data: `${ano}-09-07`, descricao: 'Independência do Brasil', tipo: 'feriado' },
    { data: `${ano}-10-12`, descricao: 'Nossa Senhora Aparecida', tipo: 'feriado' },
    { data: `${ano}-10-28`, descricao: 'Dia do Servidor Público', tipo: 'recesso' },
    { data: `${ano}-11-02`, descricao: 'Finados', tipo: 'feriado' },
    { data: `${ano}-11-15`, descricao: 'Proclamação da República', tipo: 'feriado' },
    { data: `${ano}-11-20`, descricao: 'Dia da Consciência Negra', tipo: 'feriado' },
    { data: `${ano}-12-25`, descricao: 'Natal', tipo: 'feriado' },
  ];
}


export function getEventoDoDia(dataISO) {
  if (!dataISO) return null;
  const ano = parseInt(dataISO.split('-')[0], 10);
  if (isNaN(ano)) return null;
  const feriados = getFeriadosDoAno(ano);
  return feriados.find((f) => f.data === dataISO);
}

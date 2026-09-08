const MESES = {
  Jan: 0, Fev: 1, Mar: 2, Abr: 3, Mai: 4, Jun: 5,
  Jul: 6, Ago: 7, Set: 8, Out: 9, Nov: 10, Dez: 11,
};

function parseAgendamentoDateTime(dataStr, horarioStr) {
  const [, dia, mesAbrev, ano] = dataStr.match(/(\d+)\s+(\w+)\s+(\d+)/) || [];
  const mes = MESES[mesAbrev];
  if (mes === undefined) return null;

  const [inicio, fim] = horarioStr.split(' - ').map((h) => h.trim());
  const [hInicio, mInicio] = inicio.split(':').map(Number);
  const [hFim, mFim] = fim.split(':').map(Number);

  const start = new Date(Number(ano), mes, Number(dia), hInicio, mInicio);
  const end = new Date(Number(ano), mes, Number(dia), hFim, mFim);

  return { start, end };
}

function formatGoogleDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

export function buildGoogleCalendarUrl(agendamento) {
  const parsed = parseAgendamentoDateTime(agendamento.data, agendamento.horario);
  if (!parsed) return null;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Atendimento TAL - ${agendamento.disciplina}`,
    dates: `${formatGoogleDate(parsed.start)}/${formatGoogleDate(parsed.end)}`,
    details: [
      `Professor: ${agendamento.professor}`,
      `Assunto: ${agendamento.assunto}`,
      `Status: ${agendamento.status}`,
    ].join('\n'),
    location: agendamento.local,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function abrirNoGoogleCalendar(agendamento) {
  const url = buildGoogleCalendarUrl(agendamento);
  if (!url) {
    window.alert('Não foi possível gerar o link do calendário para este agendamento.');
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

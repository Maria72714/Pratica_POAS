import React, { useState } from 'react';
import { getEventoDoDia } from '../data/calendarioAcademico';
import { abrirNoGoogleCalendar } from '../utils/googleCalendar';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Converte formatos variados de data para ISO 'YYYY-MM-DD'
function normalizarDataParaISO(dataStr) {
  if (!dataStr) return '';
  if (dataStr.includes('-')) {
    const partes = dataStr.split('T')[0].split('-');
    if (partes.length === 3) return `${partes[0]}-${partes[1].padStart(2, '0')}-${partes[2].padStart(2, '0')}`;
  }
  // Se estiver em '28 Abr 2026' ou '28/04/2026'
  if (dataStr.includes('/')) {
    const [d, m, y] = dataStr.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const mesesMap = {
    jan: '01', fev: '02', mar: '03', abr: '04', mai: '05', jun: '06',
    jul: '07', ago: '08', set: '09', out: '10', nov: '11', dez: '12'
  };
  const parts = dataStr.toLowerCase().split(' ');
  if (parts.length >= 3) {
    const dia = parts[0].padStart(2, '0');
    const mes = mesesMap[parts[1].slice(0, 3)] || '01';
    const ano = parts[2];
    return `${ano}-${mes}-${dia}`;
  }
  return '';
}

export default function CalendarioAtendimentos({
  agendamentos = [],
  onCancelarAgendamento,
  onAbrirChat,
  diaSelecionado: diaSelecionadoProp,
  onSelectDia
}) {
  const hoje = new Date();
  const [mesAtual, setMesAtual] = useState(hoje.getMonth());
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear());
  const [diaInterno, setDiaInterno] = useState(null);

  const diaSelecionado = diaSelecionadoProp !== undefined ? diaSelecionadoProp : diaInterno;
  const setDiaSelecionado = (dia) => {
    if (onSelectDia) onSelectDia(dia);
    setDiaInterno(dia);
  };

  // Mapeia os agendamentos por data ISO
  const agendamentosPorData = {};
  agendamentos.forEach((ag) => {
    const iso = normalizarDataParaISO(ag.data || ag.data_atendimento);
    if (iso) {
      if (!agendamentosPorData[iso]) agendamentosPorData[iso] = [];
      agendamentosPorData[iso].push(ag);
    }
  });

  // Dias do mês
  const primeiroDiaDoMes = new Date(anoAtual, mesAtual, 1).getDay();
  const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();

  const handleMesAnterior = () => {
    if (mesAtual === 0) {
      setMesAtual(11);
      setAnoAtual((prev) => prev - 1);
    } else {
      setMesAtual((prev) => prev - 1);
    }
    setDiaSelecionado(null);
  };

  const handleProximoMes = () => {
    if (mesAtual === 11) {
      setMesAtual(0);
      setAnoAtual((prev) => prev + 1);
    } else {
      setMesAtual((prev) => prev + 1);
    }
    setDiaSelecionado(null);
  };

  const agendamentosDoDia = diaSelecionado ? (agendamentosPorData[diaSelecionado] || []) : [];
  const eventoDoDia = diaSelecionado ? getEventoDoDia(diaSelecionado) : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      
      {/* Cabeçalho do Calendário */}
      <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/60">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">
              {MESES[mesAtual]} de {anoAtual}
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Calendário com feriados IFRN integrado aos seus agendamentos
          </p>
        </div>

        {/* Controles de Navegação */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleMesAnterior}
            className="p-2 border border-gray-200 rounded-xl hover:bg-white text-gray-600 transition-colors"
            title="Mês anterior"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => {
              setMesAtual(hoje.getMonth());
              setAnoAtual(hoje.getFullYear());
            }}
            className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-xl hover:bg-white text-gray-700 transition-colors"
          >
            Hoje
          </button>
          <button
            onClick={handleProximoMes}
            className="p-2 border border-gray-200 rounded-xl hover:bg-white text-gray-600 transition-colors"
            title="Próximo mês"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
        
        {/* Grade do Mês */}
        <div className="lg:col-span-2 p-4 sm:p-6">
          {/* Dias da semana */}
          <div className="grid grid-cols-7 mb-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
            {DIAS_SEMANA.map((dia, idx) => (
              <div key={dia} className={idx === 0 || idx === 6 ? 'text-gray-400' : ''}>
                {dia}
              </div>
            ))}
          </div>

          {/* Células dos dias */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Espaços vazios do início */}
            {Array.from({ length: primeiroDiaDoMes }).map((_, i) => (
              <div key={`empty-${i}`} className="h-14 sm:h-20 rounded-xl bg-gray-50/40" />
            ))}

            {/* Dias do mês */}
            {Array.from({ length: diasNoMes }).map((_, i) => {
              const diaNum = i + 1;
              const dataISO = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-${String(diaNum).padStart(2, '0')}`;
              const agsDoDia = agendamentosPorData[dataISO] || [];
              const evento = getEventoDoDia(dataISO);
              const isSelecionado = diaSelecionado === dataISO;
              const isHoje =
                hoje.getDate() === diaNum &&
                hoje.getMonth() === mesAtual &&
                hoje.getFullYear() === anoAtual;

              return (
                <div
                  key={dataISO}
                  onClick={() => setDiaSelecionado(dataISO)}
                  className={`h-14 sm:h-20 p-1 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelecionado
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-sm'
                      : isHoje
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : evento
                      ? 'border-amber-200 bg-amber-50/30'
                      : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                        isHoje
                          ? 'bg-emerald-600 text-white'
                          : isSelecionado
                          ? 'text-emerald-800'
                          : 'text-gray-700'
                      }`}
                    >
                      {diaNum}
                    </span>

                    {evento && (
                      <span
                        title={evento.descricao}
                        className="w-2 h-2 rounded-full bg-amber-500 shrink-0"
                      />
                    )}
                  </div>

                  {/* Indicadores de Agendamentos */}
                  <div className="space-y-0.5">
                    {agsDoDia.slice(0, 2).map((ag, idx) => (
                      <div
                        key={idx}
                        className={`text-[9px] sm:text-[10px] font-semibold px-1 py-0.5 rounded truncate ${
                          ag.status === 'Confirmado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ag.status === 'Pendente'
                            ? 'bg-amber-100 text-amber-800'
                            : ag.status === 'Concluído'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {ag.disciplina || 'Atendimento'}
                      </div>
                    ))}
                    {agsDoDia.length > 2 && (
                      <p className="text-[9px] text-gray-400 font-medium">
                        +{agsDoDia.length - 2} mais
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legenda do Calendário */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Confirmado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Pendente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Concluído</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Feriado / Recesso IFRN</span>
            </div>
          </div>
        </div>

        {/* Detalhes do Dia Selecionado */}
        <div className="p-4 sm:p-6 bg-gray-50/40">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center justify-between">
            <span>
              {diaSelecionado
                ? `Detalhes de ${diaSelecionado.split('-')[2]}/${diaSelecionado.split('-')[1]}/${diaSelecionado.split('-')[0]}`
                : 'Selecione um dia'}
            </span>
          </h3>

          {/* Feriado ou Recesso */}
          {eventoDoDia && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              <span className="font-bold block uppercase text-[10px] text-amber-700 tracking-wider">
                {eventoDoDia.tipo === 'feriado' ? 'Feriado' : 'Recesso Acadêmico'}
              </span>
              <p className="font-semibold mt-0.5">{eventoDoDia.descricao}</p>
              <p className="text-[11px] text-amber-800/80 mt-1">
                Sem aulas ou atendimentos letivos no IFRN nesta data.
              </p>
            </div>
          )}

          {/* Lista de Atendimentos no dia */}
          {agendamentosDoDia.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {diaSelecionado
                ? 'Nenhum atendimento agendado para este dia.'
                : 'Clique em um dia do calendário para ver os horários e disciplinas.'}
            </div>
          ) : (
            <div className="space-y-3">
              {agendamentosDoDia.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{item.disciplina}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        item.status === 'Confirmado'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'Pendente'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="text-gray-600 space-y-1 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400">🕒</span>
                      <span>{item.horario || 'Horário a definir'}</span>
                    </div>
                    {item.modalidade && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400">{item.modalidade === 'Remoto' ? '💻' : '🏫'}</span>
                        <span className={`font-medium ${item.modalidade === 'Remoto' ? 'text-blue-600' : 'text-gray-600'}`}>
                          {item.modalidade}
                        </span>
                      </div>
                    )}
                    {item.professor && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400">👤</span>
                        <span>{item.professor}</span>
                      </div>
                    )}
                    {item.local && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400">📍</span>
                        <span>{item.local}</span>
                      </div>
                    )}
                    {item.link_ca_online && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400">🌐</span>
                        <a 
                          href={item.link_ca_online} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:text-emerald-800 underline truncate"
                        >
                          CA Online
                        </a>
                      </div>
                    )}
                    {item.assunto && (
                      <p className="bg-gray-50 p-2 rounded text-gray-500 mt-1 italic">
                        "{item.assunto}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-gray-100 flex-wrap">
                    <button
                      onClick={() => abrirNoGoogleCalendar(item)}
                      className="flex-1 py-1 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-semibold rounded transition-colors text-center"
                    >
                      Google Calendar
                    </button>
                    {onAbrirChat && (
                      <button
                        onClick={() => onAbrirChat(item)}
                        className="py-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-semibold rounded transition-colors flex items-center gap-1 border border-emerald-200"
                        title="Conversar sobre este atendimento"
                      >
                        <svg className="w-3 h-3 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Chat
                      </button>
                    )}
                    {onCancelarAgendamento && item.status !== 'Cancelado' && item.podeCancelar !== false && (
                      <button
                        onClick={() => onCancelarAgendamento(item.id)}
                        className="py-1 px-2 text-red-600 hover:bg-red-50 text-[10px] font-semibold rounded transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

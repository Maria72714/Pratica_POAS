import React, { useEffect, useState, useMemo } from 'react';
import { buscarAtendimentosProfessor } from '../../services/professor/agendamento';
import PageShell from '../../components/ui/PageShell';
import PageHeader from '../../components/ui/PageHeader';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function exportarCSV(atendimentos) {
  const cabecalho = ['Data', 'Horario', 'Aluno', 'Matricula Aluno', 'Disciplina', 'Tipo', 'Modalidade', 'Assunto', 'Relatório', 'Status'];
  const linhas = atendimentos.map(a => {
    const dataFmt = a.data_atendimento ? new Date(a.data_atendimento + (a.data_atendimento.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('pt-BR') : '—';
    const tipo = a.tipo_atendimento?.toUpperCase() === 'TAI' || Boolean(a.id_solicitacao) ? 'TAI' : 'Regular';
    return [
      dataFmt,
      a.data_atendimento ? new Date(a.data_atendimento + (a.data_atendimento.includes('T') ? '' : 'T00:00:00')).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—',
      a.aluno_nome || '—',
      a.aluno_matricula || '—',
      a.disciplina_nome || '—',
      tipo,
      a.modalidade || '—',
      (a.assunto || '').replace(/,/g, ';'),
      (a.relatorio || '').replace(/,/g, ';'),
      a.status || '—',
    ].map(v => `"${v}"`).join(',');
  });
  const csv = [cabecalho.join(','), ...linhas].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `relatorio_atendimentos_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatarData(dataStr) {
  if (!dataStr) return '—';
  try {
    const d = new Date(dataStr + (dataStr.includes('T') ? '' : 'T00:00:00'));
    return d.toLocaleDateString('pt-BR');
  } catch {
    return dataStr;
  }
}

function formatarHora(dataStr) {
  if (!dataStr || !dataStr.includes('T')) return '—';
  try {
    const d = new Date(dataStr);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

const STATUS_CORES = {
  realizado: 'bg-emerald-100 text-emerald-800',
  agendado: 'bg-blue-100 text-blue-800',
  cancelado: 'bg-red-100 text-red-800',
};

export default function ProfessorRelatorios() {
  const [atendimentos, setAtendimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  // Filtros
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [filtroDisciplina, setFiltroDisciplina] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  const usuarioSalvo = localStorage.getItem('usuario');
  const suapSalvo = localStorage.getItem('suap_user');
  const usuario = usuarioSalvo
    ? JSON.parse(usuarioSalvo)
    : suapSalvo
      ? JSON.parse(suapSalvo)
      : null;

  const matricula = usuario?.matricula || '';

  useEffect(() => {
    async function carregar() {
      if (!matricula) {
        setErro('Matrícula do professor não identificada.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setErro('');
        const data = await buscarAtendimentosProfessor(matricula);
        setAtendimentos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setErro('Não foi possível carregar os atendimentos para o relatório.');
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [matricula]);

  // Lista de disciplinas disponíveis
  const disciplinas = useMemo(() => {
    const set = new Set();
    atendimentos.forEach(a => { if (a.disciplina_nome) set.add(a.disciplina_nome); });
    return Array.from(set).sort();
  }, [atendimentos]);

  // Atendimentos filtrados
  const atendimentosFiltrados = useMemo(() => {
    return atendimentos.filter(a => {
      const dataAtend = a.data_atendimento ? a.data_atendimento.split('T')[0] : null;
      if (filtroDataInicio && dataAtend && dataAtend < filtroDataInicio) return false;
      if (filtroDataFim && dataAtend && dataAtend > filtroDataFim) return false;
      if (filtroDisciplina && a.disciplina_nome !== filtroDisciplina) return false;
      if (filtroStatus) {
        const statusLower = (a.status || '').toLowerCase();
        if (!statusLower.includes(filtroStatus.toLowerCase())) return false;
      }
      if (filtroTipo === 'TAI') {
        const eTAI = a.tipo_atendimento?.toUpperCase() === 'TAI' || Boolean(a.id_solicitacao);
        if (!eTAI) return false;
      }
      if (filtroTipo === 'Regular') {
        const eTAI = a.tipo_atendimento?.toUpperCase() === 'TAI' || Boolean(a.id_solicitacao);
        if (eTAI) return false;
      }
      return true;
    });
  }, [atendimentos, filtroDataInicio, filtroDataFim, filtroDisciplina, filtroStatus, filtroTipo]);

  const limparFiltros = () => {
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setFiltroDisciplina('');
    setFiltroStatus('');
    setFiltroTipo('');
  };

  const temFiltros = filtroDataInicio || filtroDataFim || filtroDisciplina || filtroStatus || filtroTipo;

  // Métricas resumidas do filtro atual
  const realizados = atendimentosFiltrados.filter(a => (a.status || '').toLowerCase() === 'realizado').length;
  const agendados = atendimentosFiltrados.filter(a => (a.status || '').toLowerCase() === 'agendado').length;
  const cancelados = atendimentosFiltrados.filter(a => (a.status || '').toLowerCase() === 'cancelado').length;
  const taiCount = atendimentosFiltrados.filter(a => a.tipo_atendimento?.toUpperCase() === 'TAI' || Boolean(a.id_solicitacao)).length;

  const nomeProfessor = usuario?.nome || 'Professor';
  const dataGeracao = new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });

  const acoesRelatorio = (
    <div className="flex flex-wrap items-center gap-2 no-print">
      <button
        type="button"
        onClick={() => exportarCSV(atendimentosFiltrados)}
        disabled={atendimentosFiltrados.length === 0}
        className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-medium px-4 py-2.5 rounded-lg text-sm disabled:opacity-50"
      >
        Exportar CSV
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        disabled={atendimentosFiltrados.length === 0}
        className="inline-flex items-center gap-2 bg-white text-emerald-800 font-medium px-4 py-2.5 rounded-lg text-sm disabled:opacity-50"
      >
        Imprimir / PDF
      </button>
    </div>
  );

  return (
    <PageShell>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-header { display: block !important; }
        }
        .print-header { display: none; }
      `}</style>

      <div className="no-print">
      <PageHeader
        role="professor"
        title="Relatórios de Atendimento"
        subtitle="Histórico com filtros, exportação CSV e impressão institucional."
        actions={acoesRelatorio}
      />
      </div>

      <div className="pb-8" id="print-area">
        {/* Cabeçalho Institucional (apenas na impressão) */}
        <div className="print-header border-b-2 border-emerald-900 pb-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-lg text-gray-900">IFRN — Instituto Federal do Rio Grande do Norte</p>
              <p className="text-gray-600 text-sm">Sistema POAS — Plataforma de Orientação e Atendimento ao Estudante</p>
            </div>
            <div className="text-right text-xs text-gray-500">
              <p>Relatório gerado em: {dataGeracao}</p>
              <p>Professor: {nomeProfessor}</p>
              <p>Matrícula: {matricula}</p>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mt-3">Relatório de Atendimentos ao Estudante</h2>
          {temFiltros && (
            <p className="text-xs text-gray-500 mt-1">
              Filtros aplicados: {filtroDataInicio && `De ${formatarData(filtroDataInicio)}`} {filtroDataFim && `Até ${formatarData(filtroDataFim)}`} {filtroDisciplina && `Disciplina: ${filtroDisciplina}`} {filtroStatus && `Status: ${filtroStatus}`} {filtroTipo && `Tipo: ${filtroTipo}`}
            </p>
          )}
        </div>

        {/* Alertas */}
        {erro && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg text-red-700 no-print">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{erro}</span>
            </div>
          </div>
        )}

        {/* Painel de Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 no-print">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtros Avançados
            </h2>
            {temFiltros && (
              <button
                onClick={limparFiltros}
                className="text-sm text-red-600 hover:text-red-800 font-medium hover:underline cursor-pointer flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpar filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Data Início</label>
              <input
                type="date"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Data Fim</label>
              <input
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Disciplina</label>
              <select
                value={filtroDisciplina}
                onChange={(e) => setFiltroDisciplina(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
              >
                <option value="">Todas</option>
                {disciplinas.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Status</label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
              >
                <option value="">Todos</option>
                <option value="Agendado">Agendado</option>
                <option value="Realizado">Realizado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Tipo</label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
              >
                <option value="">Todos</option>
                <option value="Regular">Regular (Plantão)</option>
                <option value="TAI">TAI (Apoio Inclusivo)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Resumo de Métricas do Filtro */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Filtrado', valor: atendimentosFiltrados.length, cor: 'text-gray-800', fundo: 'bg-white' },
            { label: 'Realizados', valor: realizados, cor: 'text-emerald-700', fundo: 'bg-emerald-50' },
            { label: 'Agendados', valor: agendados, cor: 'text-blue-700', fundo: 'bg-blue-50' },
            { label: 'Atend. TAI', valor: taiCount, cor: 'text-amber-700', fundo: 'bg-amber-50' },
          ].map(({ label, valor, cor, fundo }) => (
            <div key={label} className={`${fundo} rounded-xl border border-gray-100 shadow-sm p-4 text-center`}>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{label}</p>
              <p className={`text-2xl font-bold ${cor}`}>{valor}</p>
            </div>
          ))}
        </div>

        {/* Tabela Principal */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-800">Registro Detalhado</h2>
              <p className="text-xs text-gray-400 mt-0.5">{atendimentosFiltrados.length} registro(s) encontrado(s)</p>
            </div>
          </div>

          {loading ? (
            <div className="p-16 text-center text-gray-500">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              Carregando registros de atendimento...
            </div>
          ) : atendimentosFiltrados.length === 0 ? (
            <div className="p-16 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 font-medium">Nenhum atendimento encontrado</p>
              <p className="text-sm text-gray-400 mt-1">Tente ajustar ou remover os filtros aplicados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    {['Data', 'Horário', 'Aluno', 'Disciplina', 'Tipo', 'Modalidade', 'Assunto / Relatório', 'Status'].map(col => (
                      <th key={col} className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {atendimentosFiltrados.map((a) => {
                    const tipo = a.tipo_atendimento?.toUpperCase() === 'TAI' || Boolean(a.id_solicitacao) ? 'TAI' : 'Regular';
                    const statusLower = (a.status || '').toLowerCase();
                    const statusCorClass = STATUS_CORES[statusLower] || 'bg-gray-100 text-gray-700';

                    return (
                      <tr key={a.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap font-medium">{formatarData(a.data_atendimento)}</td>
                        <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{formatarHora(a.data_atendimento)}</td>
                        <td className="px-5 py-3.5">
                          <div className="text-gray-800 font-medium">{a.aluno_nome || '—'}</div>
                          {a.aluno_matricula && a.aluno_matricula !== '—' && (
                            <div className="text-xs text-gray-400">{a.aluno_matricula}</div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap">{a.disciplina_nome || '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${tipo === 'TAI' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'}`}>
                            {tipo === 'TAI' && (
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                            )}
                            {tipo}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{a.modalidade || '—'}</td>
                        <td className="px-5 py-3.5 max-w-xs">
                          <p className="text-gray-700 truncate" title={a.assunto || undefined}>
                            {a.assunto || <span className="text-gray-400 italic">Sem assunto</span>}
                          </p>
                          {a.relatorio && (
                            <p className="text-xs text-gray-400 truncate mt-0.5" title={a.relatorio}>
                              {a.relatorio}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCorClass}`}>
                            {a.status || '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Rodapé para impressão */}
          {atendimentosFiltrados.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 print-header bg-gray-50">
              <div className="flex justify-between text-xs text-gray-400">
                <span>IFRN — Sistema POAS | Relatório de Atendimentos ao Estudante</span>
                <span>{dataGeracao} | Prof. {nomeProfessor}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

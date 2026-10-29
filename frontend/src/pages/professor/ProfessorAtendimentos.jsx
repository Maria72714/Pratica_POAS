import React, { useEffect, useState } from 'react';
import { buscarAtendimentosProfessor, editarAtendimentoProfessor } from '../../services/professor/agendamento';
import { buscarSolicitacoesPendentes, decidirSolicitacao } from '../../services/aluno/solicitacao';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CalendarioAtendimentos from '../../components/CalendarioAtendimentos';
import ChatAtendimento from '../../components/ChatAtendimento';
import PageShell from '../../components/ui/PageShell';
import PageHeader from '../../components/ui/PageHeader';

const ProfessorAtendimentos = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [solicitacoesPendentes, setSolicitacoesPendentes] = useState([]);
  const [modalLinkCA, setModalLinkCA] = useState(null); // { id, link_atual }
  const [linkCAInput, setLinkCAInput] = useState('');
  const [salvandoLink, setSalvandoLink] = useState(false);
  const [loading, setLoading] = useState(true);
  const [carregandoSolicitacoes, setCarregandoSolicitacoes] = useState(false);
  const [processandoId, setProcessandoId] = useState(null);
  const [erro, setErro] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const abaInicial = searchParams.get('tab');
  const [modoVisualizacao, setModoVisualizacao] = useState(
    abaInicial === 'solicitacoes' || abaInicial === 'lista' ? abaInicial : 'calendario'
  ); // 'calendario' | 'lista' | 'solicitacoes'
  const [chatAtendimentoId, setChatAtendimentoId] = useState(null);
  const [chatTitulo, setChatTitulo] = useState('Chat do Atendimento');

  const mudarModo = (modo) => {
    setModoVisualizacao(modo);
    if (modo === 'calendario') setSearchParams({}, { replace: true });
    else setSearchParams({ tab: modo }, { replace: true });
  };

  const usuarioSalvo = localStorage.getItem('usuario');
  const suapSalvo = localStorage.getItem('suap_user');

  const usuario = usuarioSalvo
    ? JSON.parse(usuarioSalvo)
    : suapSalvo
      ? JSON.parse(suapSalvo)
      : null;

  const carregarDados = async () => {
    try {
      setErro('');
      if (!usuario?.matricula) {
        setErro('Matrícula do professor não encontrada.');
        return;
      }

      setLoading(true);
      const [dadosAgendamentos, dadosSolicitacoes] = await Promise.all([
        buscarAtendimentosProfessor(usuario.matricula).catch(() => []),
        buscarSolicitacoesPendentes().catch(() => []),
      ]);

      setAppointments(Array.isArray(dadosAgendamentos) ? dadosAgendamentos : []);
      setSolicitacoesPendentes(Array.isArray(dadosSolicitacoes) ? dadosSolicitacoes : []);
    } catch (error) {
      console.error('Erro ao buscar dados do professor:', error);
      setErro('Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  function formatarData(data) {
    if (!data) return 'Data não informada';
    const [ano, mes, dia] = data.split('T')[0].split('-');
    if (ano && mes && dia) {
      return `${dia}/${mes}/${ano}`;
    }
    return data;
  }

  function formatarTexto(texto) {
    if (!texto) return 'Não informado';
    return texto
      .toString()
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, letra => letra.toUpperCase());
  }

  const handleAbrirChat = (item) => {
    if (!item) return;
    let numId = null;
    if (typeof item.id === 'number') numId = item.id;
    else if (typeof item.id === 'string') {
      const clean = item.id.replace('atend-', '').replace('sol-', '');
      if (clean && !isNaN(clean)) numId = parseInt(clean, 10);
    }
    if (numId) {
      setChatAtendimentoId(numId);
      setChatTitulo(item.assunto || item.disciplina || 'Atendimento TAI');
    }
  };

  const handleDecidirSolicitacao = async (solicitacaoId, novoStatus) => {
    setProcessandoId(solicitacaoId);
    try {
      const profId = usuario?.id || usuario?.matricula || null;
      await decidirSolicitacao(solicitacaoId, novoStatus, profId);
      await carregarDados();
      alert(
        novoStatus === 'Aprovado'
          ? `Solicitação #${solicitacaoId} aprovada com sucesso! O agendamento foi criado.`
          : `Solicitação #${solicitacaoId} recusada.`
      );
    } catch (err) {
      alert(err.message || 'Erro ao processar solicitação.');
    } finally {
      setProcessandoId(null);
    }
  };

  const handleAbrirModalLinkCA = (atendimento) => {
    setLinkCAInput(atendimento.link_ca_online || '');
    setModalLinkCA({ id: atendimento.id, link_atual: atendimento.link_ca_online });
  };

  const handleSalvarLinkCA = async () => {
    if (!linkCAInput.trim()) return;
    // Validação básica de URL
    try { new URL(linkCAInput.trim()); } catch {
      alert('Por favor, insira uma URL válida (ex.: https://zoom.us/j/...)');
      return;
    }
    setSalvandoLink(true);
    try {
      await editarAtendimentoProfessor(modalLinkCA.id, { link_ca_online: linkCAInput.trim() });
      setAppointments(prev =>
        prev.map(a => a.id === modalLinkCA.id ? { ...a, link_ca_online: linkCAInput.trim() } : a)
      );
      setModalLinkCA(null);
    } catch (err) {
      alert(err.message || 'Erro ao salvar o link.');
    } finally {
      setSalvandoLink(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        role="professor"
        title="Meus Atendimentos"
        subtitle="Consulte sua agenda, gerencie atendimentos e avalie as solicitações TAI recebidas."
      />

      <div className="space-y-4">

        {/* Barra de Seleção de Visualização */}
        <div className="flex items-center justify-start">
          <div className="flex items-center bg-gray-100 p-1 rounded-xl flex-wrap gap-1">
            <button
              onClick={() => mudarModo('calendario')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                modoVisualizacao === 'calendario'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendário
            </button>

            <button
              onClick={() => mudarModo('lista')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                modoVisualizacao === 'lista'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Meus Atendimentos ({appointments.length})
            </button>

            <button
              onClick={() => mudarModo('solicitacoes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                modoVisualizacao === 'solicitacoes'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Solicitações TAI
              {solicitacoesPendentes.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                  {solicitacoesPendentes.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── ABA 1: Calendário ── */}
        {modoVisualizacao === 'calendario' && (
          <CalendarioAtendimentos
            agendamentos={appointments}
            onAbrirChat={handleAbrirChat}
          />
        )}

        {/* ── ABA 2: Lista de Atendimentos ── */}
        {modoVisualizacao === 'lista' && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-3 sm:p-4">
              {loading ? (
                <p className="text-gray-500 text-sm py-4 text-center">Carregando agendamentos...</p>
              ) : erro ? (
                <p className="text-red-600 bg-red-50 rounded-lg p-4 text-sm">{erro}</p>
              ) : appointments.length === 0 ? (
                <p className="text-gray-500 text-sm py-6 text-center">Você ainda não possui atendimentos agendados.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {appointments.map((atendimento) => (
                    <div
                      key={atendimento.id}
                      className="py-4 first:pt-2 last:pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-800 text-sm sm:text-base break-words">
                          {atendimento.assunto || 'Atendimento sem assunto'}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          Atendimento #{atendimento.id}
                        </p>

                        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-xs sm:text-sm text-gray-600">
                          <span className="inline-flex items-center gap-1">
                            📅 {formatarData(atendimento.data_atendimento)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            📍 {formatarTexto(atendimento.modalidade)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            🏷️ {formatarTexto(atendimento.tipo_atendimento)}
                          </span>
                        </div>
                      </div>

                      <div className="sm:text-right shrink-0 flex flex-col items-end gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          atendimento.status?.toUpperCase() === 'CANCELADO'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {formatarTexto(atendimento.status)}
                        </span>

                        {atendimento.id_mediador && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Selo do Mediador
                          </span>
                        )}

                        <button
                          onClick={() => {
                            setChatAtendimentoId(atendimento.id);
                            setChatTitulo(atendimento.assunto || 'Atendimento TAI');
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            chatAtendimentoId === atendimento.id
                              ? 'bg-emerald-600 text-white'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          Chat
                        </button>

                        {/* Botão CA Online — só aparece para atendimentos remotos */}
                        {atendimento.modalidade === 'Remoto' && !atendimento.link_ca_online && (
                          <button
                            onClick={() => handleAbrirModalLinkCA(atendimento)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4.243 4.243a4 4 0 105.656 5.656l4.243-4.243" />
                            </svg>
                            + Link CA Online
                          </button>
                        )}
                        {atendimento.modalidade === 'Remoto' && atendimento.link_ca_online && (
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            <a
                              href={atendimento.link_ca_online}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                            >
                              🌐 CA Online
                            </a>
                            <button
                              onClick={() => handleAbrirModalLinkCA(atendimento)}
                              className="text-[10px] text-gray-400 hover:text-gray-600 underline"
                            >
                              alterar link
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ABA 3: Solicitações TAI Pendentes (O Professor é quem de fato aprova) ── */}
        {modoVisualizacao === 'solicitacoes' && (
          <div className="space-y-4">
            {/* Box explicativo do fluxo */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-emerald-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-xs text-emerald-900 leading-relaxed">
                <p className="font-bold mb-0.5">Aprovação Definitiva de Atendimento TAI</p>
                <p>
                  Como professor, <strong>você é quem de fato aprova ou recusa a realização do atendimento</strong>. 
                  O mediador pode dar um selo indicando a necessidade do aluno, mas <strong>você pode aprovar com ou sem esse selo</strong>.
                  Ao aprovar, o atendimento será gerado e entrará automaticamente em sua agenda.
                </p>
              </div>
            </div>

            {loading ? (
              <p className="text-gray-500 text-sm py-8 text-center">Carregando solicitações...</p>
            ) : solicitacoesPendentes.length === 0 ? (
              <div className="bg-white rounded-lg sm:rounded-xl border border-gray-100 p-8 text-center text-gray-500">
                <p className="font-semibold text-gray-800 text-base mb-1">Nenhuma solicitação TAI pendente no momento.</p>
                <p className="text-xs text-gray-400">Todas as solicitações foram avaliadas.</p>
              </div>
            ) : (
              solicitacoesPendentes.map((sol) => (
                <div key={sol.id} className="bg-white rounded-lg sm:rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Solicitação #{sol.id} • {sol.disciplina_nome}
                      </span>
                      <h3 className="text-base font-bold text-gray-900 mt-0.5">
                        {sol.tipo_suporte || 'Suporte TAI'}
                      </h3>
                    </div>

                    {/* Selo do Mediador */}
                    {sol.tem_selo ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-300">
                        <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Validado pelo Mediador {sol.mediador_nome ? `(${sol.mediador_nome})` : ''}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">
                        Sem selo do mediador (aprovação direta permitida)
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-gray-50 p-3.5 rounded-lg border border-gray-100">
                    <div>
                      <p className="text-gray-500 font-medium">Aluno:</p>
                      <p className="font-semibold text-gray-800">{sol.aluno?.nome || 'Não identificado'}</p>
                      <p className="text-gray-500">Matrícula: {sol.aluno?.matricula || '—'}</p>
                      {sol.aluno?.email && <p className="text-gray-500">E-mail: {sol.aluno.email}</p>}
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Data Preferencial:</p>
                      <p className="font-semibold text-emerald-800">
                        {sol.data_preferencial ? formatarData(sol.data_preferencial) : 'A definir'}
                      </p>
                      {sol.descricao && (
                        <div className="mt-1">
                          <p className="text-gray-500 font-medium">Descrição / Justificativa:</p>
                          <p className="text-gray-700 italic">"{sol.descricao}"</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ações do Professor */}
                  <div className="flex items-center justify-end gap-2.5 pt-1">
                    <button
                      type="button"
                      disabled={processandoId === sol.id}
                      onClick={() => handleDecidirSolicitacao(sol.id, 'Recusado')}
                      className="px-4 py-2 text-xs font-semibold rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                    >
                      {processandoId === sol.id ? 'Processando...' : '✕ Recusar'}
                    </button>

                    <button
                      type="button"
                      disabled={processandoId === sol.id}
                      onClick={() => handleDecidirSolicitacao(sol.id, 'Aprovado')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-50 transition-colors shadow-xs"
                    >
                      {processandoId === sol.id ? (
                        'Processando...'
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Aprovar Atendimento TAI
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* Chat flutuante do atendimento */}
      {chatAtendimentoId && (
        <ChatAtendimento
          atendimentoId={chatAtendimentoId}
          titulo={chatTitulo}
          abertoInicial={true}
          onFechar={() => setChatAtendimentoId(null)}
        />
      )}

      {/* Modal: Adicionar/Editar Link CA Online */}
      {modalLinkCA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {modalLinkCA.link_atual ? 'Alterar Link CA Online' : 'Adicionar Link CA Online'}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Cole o link da reunião remota (Zoom, Google Meet, Microsoft Teams, etc).
                O aluno poderá acessar pelo calendário.
              </p>
            </div>

            <input
              type="url"
              value={linkCAInput}
              onChange={(e) => setLinkCAInput(e.target.value)}
              placeholder="https://zoom.us/j/123456789"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              autoFocus
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setModalLinkCA(null)}
                className="px-4 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarLinkCA}
                disabled={!linkCAInput.trim() || salvandoLink}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-semibold"
              >
                {salvandoLink ? 'Salvando...' : 'Salvar Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default ProfessorAtendimentos;

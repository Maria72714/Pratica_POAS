import React, { useState, useEffect } from 'react';
import { abrirNoGoogleCalendar } from '../../utils/googleCalendar';
import CalendarioAtendimentos from '../../components/CalendarioAtendimentos';
import { buscarAtendimentos, editarAtendimento } from '../../services/aluno/agendamento';
import { buscarSolicitacoes, editarSolicitacao } from '../../services/aluno/solicitacao';
import ChatAtendimento from '../../components/ChatAtendimento';
import PageShell from '../../components/ui/PageShell';
import PageHeader from '../../components/ui/PageHeader';

const Agendamentos = () => {
  const [agendamentos, setAgendamentos] = useState([]);

  const [abaAtiva, setAbaAtiva] = useState('proximos');
  const [modoVisualizacao, setModoVisualizacao] = useState('calendario'); // 'calendario' ou 'lista'
  const [chatAtendimentoId, setChatAtendimentoId] = useState(null);
  const [chatTitulo, setChatTitulo] = useState('Chat do Atendimento');

  useEffect(() => {
    const dadosUsuario = localStorage.getItem('usuario') || localStorage.getItem('suap_user');
    if (!dadosUsuario) return;
    try {
      const usuario = JSON.parse(dadosUsuario);
      if (!usuario?.matricula) return;

      Promise.allSettled([
        buscarAtendimentos(usuario.matricula),
        buscarSolicitacoes(usuario.matricula)
      ]).then(([resAtend, resSol]) => {
        const listaAtend = resAtend.status === 'fulfilled' && Array.isArray(resAtend.value) ? resAtend.value : [];
        const listaSol = resSol.status === 'fulfilled' && Array.isArray(resSol.value) ? resSol.value : [];

        const formatados = [];

        listaAtend.forEach((item) => {
          formatados.push({
            id: `atend-${item.id}`,
            disciplina: item.disciplina_nome || item.assunto?.split('|')?.[0]?.replace('Disciplina:', '')?.replace('TAI -', '')?.trim() || item.disciplina || 'Atendimento',
            tipo: item.tipo_atendimento || 'TAI',
            status: item.status === 'Agendado' || item.status === 'AGENDADO' ? 'Confirmado' : (item.status === 'CONCLUIDO' || item.status === 'Concluído' ? 'Concluído' : item.status),
            data: item.data_atendimento ? String(item.data_atendimento).split('T')[0] : '',
            horario: item.horario || 'Horário agendado',
            local: item.sala || item.local || 'Campus IFRN',
            assunto: item.assunto || item.relatorio || '',
            professor: item.professor_nome || '',
            modalidade: item.modalidade || '',
            link_ca_online: item.link_ca_online || '',
            aberto: !!item.aberto,
            podeCancelar: item.pode_cancelar !== false,
          });
        });

        listaSol.forEach((item) => {
          const dataSol = item.data_preferencial || item.data || item.data_atendimento;
          if (dataSol) {
            const dataIso = String(dataSol).split('T')[0];
            const statusNorm = (item.status === 'Aprovado' || item.status === 'APROVADA')
              ? 'Confirmado'
              : (item.status === 'Pendente' || item.status === 'PENDENTE' ? 'Pendente' : item.status);

            const jaExiste = formatados.some((f) => f.data === dataIso && f.disciplina.toLowerCase().includes((item.disciplina || item.disciplina_nome || '').toLowerCase()));
            if (!jaExiste) {
              formatados.push({
                id: `sol-${item.id}`,
                disciplina: item.disciplina || item.disciplina_nome || 'Atendimento TAI',
                tipo: 'TAI',
                status: statusNorm,
                data: dataIso,
                horario: 'Horário preferencial',
                local: 'Apoio TAI',
                assunto: item.descricao || item.tipo_suporte || 'Solicitação TAI'
              });
            }
          }
        });

        setAgendamentos(formatados);
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleCancelarAgendamento = async (id) => {
    if (!window.confirm('Tem certeza que deseja cancelar este agendamento?')) return;

    try {
      const idStr = String(id);
      if (idStr.startsWith('atend-')) {
        const atendimentoId = idStr.replace('atend-', '');
        await editarAtendimento(atendimentoId, { status: 'Cancelado' });
      } else if (idStr.startsWith('sol-')) {
        const solicitacaoId = idStr.replace('sol-', '');
        await editarSolicitacao(solicitacaoId, { status: 'Cancelado' });
      }
      setAgendamentos((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: 'Cancelado' } : item))
      );
    } catch (e) {
      console.error(e);
      alert('Não foi possível cancelar. Tente novamente.');
    }
  };

  // Filtros baseados nas abas
  const proximos = agendamentos.filter(
    (a) => a.status === 'Confirmado' || a.status === 'Pendente'
  );
  
  const historico = agendamentos.filter(
    (a) => a.status === 'Concluído' || a.status === 'Cancelado'
  );

  const listaExibida = abaAtiva === 'proximos' ? proximos : historico;

  // Cálculos dinâmicos
  const concluidosCount = agendamentos.filter((a) => a.status === 'Concluído').length;
  const totalAgendamentos = agendamentos.length;
  const taxaComparecimento = totalAgendamentos > 0 
    ? Math.round((concluidosCount / totalAgendamentos) * 100) 
    : 0;

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
      setChatTitulo(item.disciplina || item.assunto || 'Atendimento TAI');
    }
  };

  const toggleModo = (
    <div className="flex items-center bg-white/15 p-1 rounded-xl">
      <button
        type="button"
        onClick={() => setModoVisualizacao('calendario')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          modoVisualizacao === 'calendario'
            ? 'bg-white text-emerald-800 shadow-xs'
            : 'text-white/90 hover:text-white'
        }`}
      >
        Calendário
      </button>
      <button
        type="button"
        onClick={() => setModoVisualizacao('lista')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          modoVisualizacao === 'lista'
            ? 'bg-white text-emerald-800 shadow-xs'
            : 'text-white/90 hover:text-white'
        }`}
      >
        Lista
      </button>
    </div>
  );

  return (
    <PageShell>
      <PageHeader
        role="aluno"
        title="Meus Agendamentos"
        subtitle="Acompanhe seus horários integrados ao calendário acadêmico do IFRN."
        actions={toggleModo}
      />

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-medium text-gray-500 mb-1">Próximos Atendimentos</p>
            <p className="text-3xl font-bold text-emerald-600">{proximos.length}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-medium text-gray-500 mb-1">Atendimentos Concluídos</p>
            <p className="text-3xl font-bold text-gray-800">{concluidosCount}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-medium text-gray-500 mb-1">Taxa de Comparecimento</p>
            <p className="text-3xl font-bold text-gray-800">{taxaComparecimento}%</p>
          </div>
        </div>

        {/* Visualização de Calendário vs Lista */}
        {modoVisualizacao === 'calendario' ? (
          <CalendarioAtendimentos
            agendamentos={agendamentos}
            onCancelarAgendamento={handleCancelarAgendamento}
            onAbrirChat={handleAbrirChat}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            
            {/* Navegação entre Abas */}
            <div className="flex border-b border-gray-100 text-sm font-medium">
              <button
                onClick={() => setAbaAtiva('proximos')}
                className={`flex-1 py-4 text-center border-b-2 transition-colors ${
                  abaAtiva === 'proximos'
                    ? 'border-emerald-600 text-emerald-600 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Próximos Agendamentos ({proximos.length})
              </button>
              <button
                onClick={() => setAbaAtiva('historico')}
                className={`flex-1 py-4 text-center border-b-2 transition-colors ${
                  abaAtiva === 'historico'
                    ? 'border-emerald-600 text-emerald-600 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Histórico ({historico.length})
              </button>
            </div>

            {/* Conteúdo da Lista */}
            <div className="p-6 space-y-4">
              {listaExibida.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">
                  Nenhum agendamento encontrado nesta seção.
                </p>
              ) : (
              listaExibida.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-xl p-5 space-y-4 bg-white">
                  
                  {/* Cabeçalho do Card */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-gray-900">{item.disciplina}</h3>
                    {item.tipo && (
                      <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {item.tipo}
                      </span>
                    )}
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      item.status === 'Confirmado' ? 'bg-emerald-100 text-emerald-800' :
                      item.status === 'Pendente' ? 'bg-amber-100 text-amber-800' :
                      item.status === 'Cancelado' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  {/* Informações detalhadas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{item.professor || 'Professor(a) responsável'}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{item.data}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{item.horario}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{item.local}</span>
                    </div>
                  </div>

                  {/* Assunto */}
                  <div className="bg-gray-50 rounded-lg p-3 text-xs">
                    <p className="font-semibold text-gray-700 mb-0.5">Assunto:</p>
                    <p className="text-gray-600">{item.assunto}</p>
                  </div>

                  {/* Botões de Ação */}
                  {abaAtiva === 'proximos' && (
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={() => abrirNoGoogleCalendar(item)}
                        className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.5 3h-3V1.5h-1.5V3h-9V1.5H4.5V3h-3A1.5 1.5 0 000 4.5v15A1.5 1.5 0 001.5 21h18a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3zm0 16.5h-18v-11h18v11zM6 12h3v3H6v-3zm4.5 0h3v3h-3v-3zm4.5 0h3v3h-3v-3zM6 8.25h3V11H6V8.25zm4.5 0h3V11h-3V8.25zm4.5 0h3V11h-3V8.25z" />
                        </svg>
                        Adicionar ao Google Calendar
                      </button>
                      {/* CA Online: disponível quando o professor informa o link */}
                      {item.link_ca_online && (
                        <a
                          href={item.link_ca_online}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700"
                          title="Abrir o CA Online"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M13.828 10.172a4 4 0 010 5.656l-4 4a4 4 0 01-5.656-5.656l1.5-1.5m5.5-5.5l1.5-1.5a4 4 0 015.656 5.656l-4 4a4 4 0 01-5.656 0" />
                          </svg>
                          CA Online
                        </a>
                      )}
                      {/* Botão de Chat: só para atendimentos reais (prefixo "atend-") */}
                      {item.id?.toString().startsWith('atend-') && (
                        <button
                          onClick={() => {
                            const numId = parseInt(item.id.replace('atend-', ''), 10);
                            setChatAtendimentoId(numId);
                            setChatTitulo(item.disciplina || 'Atendimento TAI');
                          }}
                          className={`py-2 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                            chatAtendimentoId === parseInt(item.id.replace('atend-', ''), 10)
                              ? 'bg-emerald-600 text-white'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                          title="Abrir chat deste atendimento"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          Chat
                        </button>
                      )}
                      {item.podeCancelar !== false && (
                        <button 
                          onClick={() => handleCancelarAgendamento(item.id)}
                          className="py-2 px-4 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  )}

                </div>
              ))
            )}
          </div>

        </div>
        )}

      {chatAtendimentoId && (
        <ChatAtendimento
          atendimentoId={chatAtendimentoId}
          titulo={chatTitulo}
          abertoInicial={true}
          onFechar={() => setChatAtendimentoId(null)}
        />
      )}
    </PageShell>
  );
};

export default Agendamentos;
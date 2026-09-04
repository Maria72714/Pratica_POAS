import React, { useState } from 'react';

const Agendamentos = () => {
  // Dados iniciais simulando o retorno do banco de dados
  const [agendamentos, setAgendamentos] = useState([
    {
      id: 1,
      disciplina: 'Programação Orientada a Objeto',
      tipo: 'TAL',
      status: 'Confirmado',
      professor: 'Prof. Roberto Santos',
      data: '28 Abr 2026',
      horario: '14:00 - 15:00',
      local: 'Sala CA-01',
      assunto: 'Dúvidas sobre herança e polimorfismo'
    },
    {
      id: 2,
      disciplina: 'Banco de Dados',
      tipo: 'TAL',
      status: 'Pendente',
      professor: 'Profa. Carla Oliveira',
      data: '29 Abr 2026',
      horario: '10:00 - 11:00',
      local: 'Laboratório de Informática 2',
      assunto: 'Normalização de banco de dados'
    },
    {
      id: 3,
      disciplina: 'Estrutura de Dados',
      tipo: 'TAL',
      status: 'Concluído',
      professor: 'Prof. Roberto Santos',
      data: '15 Mar 2026',
      horario: '08:00 - 09:00',
      local: 'Sala CA-02',
      assunto: 'Arvores binárias e recursão'
    },
    {
      id: 4,
      disciplina: 'Redes de Computadores',
      tipo: 'TAL',
      status: 'Concluído',
      professor: 'Prof. Marcos Lima',
      data: '10 Fev 2026',
      horario: '16:00 - 17:00',
      local: 'Laboratório de Redes',
      assunto: 'Configuração de sub-redes IPv4'
    }
  ]);

  const [abaAtiva, setAbaAtiva] = useState('proximos');

  // Cancela o agendamento localmente sem precisar de backend
  const handleCancelarAgendamento = (id) => {
    if (window.confirm('Tem certeza que deseja cancelar este agendamento?')) {
      setAgendamentos((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: 'Cancelado' } : item
        )
      );
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

  return (
    <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Título */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Meus Agendamentos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gerencie seus atendimentos agendados no Centro de Aprendizagem
          </p>
        </div>

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

        {/* Quadro Principal */}
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
                      <span>{item.professor}</span>
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
                      <button className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors">
                        Adicionar ao Calendário
                      </button>
                      <button 
                        onClick={() => handleCancelarAgendamento(item.id)}
                        className="py-2 px-4 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg transition-colors"
                      >
                        Cancelar Agendamento
                      </button>
                    </div>
                  )}

                </div>
              ))
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default Agendamentos;
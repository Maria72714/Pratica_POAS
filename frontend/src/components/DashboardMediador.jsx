import React, { useState, useEffect } from 'react';

const DashboardMediador = () => {
  const [usuario, setUsuario] = useState(null);
  const [solicitacoesPendentes, setSolicitacoesPendentes] = useState([]);

  useEffect(() => {
    const dados = localStorage.getItem('usuario') || localStorage.getItem('suap_user');
    if (dados) {
      setUsuario(JSON.parse(dados));
    }
  }, []);

  const nomeMediador = usuario?.nome ? usuario.nome.split(' ')[0] : 'Mediador';

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto p-8">
      {/* Banner da Área do Mediador */}
      <div className="bg-gradient-to-r from-[#4a1575] via-[#5b1f86] to-[#6b259d] text-white px-8 py-8 rounded-2xl mb-8 shadow-md">
        <h1 className="text-3xl font-bold mb-2">Área do Mediador — {nomeMediador}</h1>
        <p className="text-purple-100 text-base">
          Gerencie as solicitações de atendimento inclusivo (TAI) pendentes.
        </p>
      </div>

      {/* Card de Estatísticas (Solicitações Pendentes) */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 mb-6 max-w-full">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <span className="text-2xl font-bold text-amber-600 block leading-tight">{solicitacoesPendentes.length}</span>
          <span className="text-sm text-gray-500 font-medium">solicitações pendentes</span>
        </div>
      </div>

      {/* Conteúdo Principal / Lista de Solicitações */}
      <div className="bg-white rounded-2xl p-16 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
        {solicitacoesPendentes.length === 0 ? (
          <>
            <div className="w-14 h-14 rounded-full border-2 border-gray-200 text-gray-300 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-700 mb-1">Nenhuma solicitação pendente.</h3>
            <p className="text-sm text-gray-400">Todas as solicitações foram processadas.</p>
          </>
        ) : (
          <div className="w-full text-left">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Solicitações TAI para Atendimento</h3>
            {/* Lista renderizada quando houver dados */}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardMediador;

import React, { useEffect, useState } from 'react';

export default function AdminAprovacoesTAI() {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  const carregarSolicitacoes = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/admin/tai-solicitacoes');
      if (!res.ok) throw new Error('Erro ao carregar solicitações.');
      const data = await res.json();
      setSolicitacoes(data);
    } catch (err) {
      console.error(err);
      setMensagem({ tipo: 'erro', texto: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarSolicitacoes();
  }, []);

  const handleAprovar = async (matricula) => {
    try {
      const res = await fetch(`http://localhost:8000/api/admin/tai-solicitacoes/${matricula}/aprovar`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Erro ao aprovar TAI.');
      setMensagem({ tipo: 'sucesso', texto: 'Status TAI APROVADO com sucesso!' });
      carregarSolicitacoes();
    } catch (err) {
      console.error(err);
      setMensagem({ tipo: 'erro', texto: err.message });
    }
  };

  const handleRecusar = async (matricula) => {
    try {
      const res = await fetch(`http://localhost:8000/api/admin/tai-solicitacoes/${matricula}/recusar`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Erro ao recusar TAI.');
      setMensagem({ tipo: 'sucesso', texto: 'Status TAI REJEITADO.' });
      carregarSolicitacoes();
    } catch (err) {
      console.error(err);
      setMensagem({ tipo: 'erro', texto: err.message });
    }
  };

  return (
    <div className="p-6 sm:p-8 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Cabeçalho da Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Aprovações de Alunos TAI
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gerencie as solicitações de acompanhamento TAI e analise os laudos comprovatórios anexados.
            </p>
          </div>
          <button
            onClick={carregarSolicitacoes}
            className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <span>🔄</span>
            <span>Atualizar Lista</span>
          </button>
        </div>

        {/* Mensagens de feedback */}
        {mensagem.texto && (
          <div
            className={`p-4 rounded-xl text-sm font-medium border ${
              mensagem.tipo === 'sucesso'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {mensagem.texto}
          </div>
        )}

        {/* Tabela / Card de Conteúdo */}
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500 text-sm shadow-sm">
            Carregando solicitações...
          </div>
        ) : solicitacoes.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500 shadow-sm">
            <p className="text-base font-semibold text-gray-800">Nenhuma solicitação encontrada</p>
            <p className="text-xs text-gray-400 mt-1">Atualmente não há alunos aguardando validação de laudo TAI.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-50/80 text-gray-500 uppercase text-[11px] font-bold tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3.5 px-6">Aluno</th>
                    <th className="py-3.5 px-6">Matrícula</th>
                    <th className="py-3.5 px-6">Curso / Ano</th>
                    <th className="py-3.5 px-6">Laudo Anexado</th>
                    <th className="py-3.5 px-6">Status TAI</th>
                    <th className="py-3.5 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {solicitacoes.map((item) => {
                    const statusBadgeClass =
                      item.tai_status === 'APROVADO'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold'
                        : item.tai_status === 'REJEITADO'
                        ? 'bg-red-50 border-red-200 text-red-700 font-semibold'
                        : 'bg-amber-50 border-amber-200 text-amber-800 font-bold animate-pulse';

                    return (
                      <tr key={item.matricula} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-4 px-6 font-semibold text-gray-900">
                          <div>{item.nome}</div>
                          <div className="text-xs font-normal text-gray-500">{item.email_escolar || item.email}</div>
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-gray-500">
                          {item.matricula}
                        </td>
                        <td className="py-4 px-6 text-gray-800">
                          <div className="font-medium text-xs">{item.curso || 'Não informado'}</div>
                          <div className="text-[11px] text-gray-500">{item.ano_letivo}</div>
                        </td>
                        <td className="py-4 px-6">
                          {item.laudo_url ? (
                            <a
                              href={`http://localhost:8000${item.laudo_url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-emerald-50 border border-gray-300 hover:border-emerald-300 text-gray-700 hover:text-emerald-700 font-medium text-xs rounded-lg transition-colors"
                            >
                              <span>📄</span>
                              <span>Visualizar Laudo</span>
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs italic">Nenhum laudo enviado</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-block px-2.5 py-1 text-xs rounded-full border ${statusBadgeClass}`}>
                            {item.tai_status || 'PENDENTE'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => handleAprovar(item.matricula)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
                          >
                            ✓ Aprovar
                          </button>
                          <button
                            onClick={() => handleRecusar(item.matricula)}
                            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
                          >
                            ✕ Recusar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

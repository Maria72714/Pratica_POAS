import React, { useEffect, useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import PageHeader from '../../components/ui/PageHeader';
import { buscarSolicitacoesPendentes, buscarSolicitacoesRecusadas } from '../../services/aluno/solicitacao';

const SolicitacoesPNEE = () => {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('todos'); // 'todos', 'pendentes', 'seladas', 'recusadas'

  useEffect(() => {
    carregarSolicitacoes();
  }, []);

  const carregarSolicitacoes = async () => {
    try {
      setLoading(true);
      const [pendentes, recusadas] = await Promise.all([
        buscarSolicitacoesPendentes(),
        buscarSolicitacoesRecusadas(),
      ]);
      setSolicitacoes([
        ...(Array.isArray(pendentes) ? pendentes : []),
        ...(Array.isArray(recusadas) ? recusadas : []),
      ]);
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error);
      setSolicitacoes([]);
    } finally {
      setLoading(false);
    }
  };

  const solicitacoesFiltradas = solicitacoes.filter((sol) => {
    const status = (sol.status || '').toLowerCase();
    if (filtroStatus === 'recusadas') return status === 'recusado';
    if (filtroStatus === 'pendentes') return status !== 'recusado' && !sol.tem_selo;
    if (filtroStatus === 'seladas') return status !== 'recusado' && sol.tem_selo;
    return true;
  });

  const formatarData = (data) => {
    if (!data) return 'Data não informada';
    const [ano, mes, dia] = data.split('T')[0].split('-');
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <PageShell>
      <PageHeader
        role="mediador"
        title="Solicitações TAI - Alunos PNEE"
        subtitle="Gerencie as solicitações de apoio pedagógico (TAI) dos alunos com necessidades especiais."
      />

      <div className="space-y-6">
        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          {['todos', 'pendentes', 'seladas', 'recusadas'].map((status) => (
            <button
              key={status}
              onClick={() => setFiltroStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filtroStatus === status
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {status === 'todos' && 'Todas'}
              {status === 'pendentes' && 'Aguardando Validação'}
              {status === 'seladas' && 'Validadas'}
              {status === 'recusadas' && 'Recusadas'}
            </button>
          ))}
        </div>

        {/* Lista de Solicitações */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">Carregando solicitações...</p>
          </div>
        ) : solicitacoesFiltradas.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-500">
            <p className="font-semibold text-gray-800 mb-1">Nenhuma solicitação encontrada</p>
            <p className="text-sm">Não há solicitações TAI {filtroStatus === 'pendentes' ? 'aguardando validação' : filtroStatus === 'seladas' ? 'validadas' : filtroStatus === 'recusadas' ? 'recusadas' : ''}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {solicitacoesFiltradas.map((sol) => (
              <div key={sol.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Solicitação #{sol.id}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          (sol.status || '').toLowerCase() === 'recusado'
                            ? 'bg-red-100 text-red-800'
                            : sol.tem_selo
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {(sol.status || '').toLowerCase() === 'recusado'
                          ? '✕ Recusada'
                          : sol.tem_selo
                          ? '✓ Validada'
                          : 'Aguardando'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {sol.tipo_suporte || 'Suporte TAI'}
                    </h3>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium text-gray-700">Aluno:</span> {sol.aluno?.nome || 'Não identificado'}{' '}
                        ({sol.aluno?.matricula || '—'})
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Disciplina:</span> {sol.disciplina_nome}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Data Preferencial:</span>{' '}
                        {formatarData(sol.data_preferencial)}
                      </div>
                      {sol.descricao && (
                        <div>
                          <span className="font-medium text-gray-700">Descrição:</span>
                          <p className="text-gray-600 italic mt-1">"{sol.descricao}"</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col gap-2 md:w-auto">
                    {(sol.status || '').toLowerCase() !== 'recusado' && (
                      <>
                        {!sol.tem_selo && (
                          <button className="px-4 py-2 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition-colors">
                            Validar (Selar)
                          </button>
                        )}
                        <button className="px-4 py-2 bg-red-100 text-red-700 text-sm font-semibold rounded-lg hover:bg-red-200 transition-colors">
                          Recusar
                        </button>
                      </>
                    )}
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default SolicitacoesPNEE;

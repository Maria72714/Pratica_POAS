import React, { useState, useEffect } from 'react';
import { buscarSolicitacoesPendentes, decidirSolicitacao } from '../services/aluno/solicitacao';

const DashboardMediador = () => {
  const [usuario, setUsuario] = useState(null);
  const [solicitacoesPendentes, setSolicitacoesPendentes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [processandoId, setProcessandoId] = useState(null);

  const carregarSolicitacoes = async () => {
    try {
      const dados = await buscarSolicitacoesPendentes();
      setSolicitacoesPendentes(dados || []);
    } catch {
      setSolicitacoesPendentes([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const dados = localStorage.getItem('usuario') || localStorage.getItem('suap_user');
    if (dados) {
      setUsuario(JSON.parse(dados));
    }

    carregarSolicitacoes();
  }, []);

  const nomeMediador = usuario?.nome ? usuario.nome.split(' ')[0] : 'Mediador';

  const handleDecisao = async (solicitacaoId, status) => {
    if (!usuario?.id) return;

    setProcessandoId(solicitacaoId);
    try {
      await decidirSolicitacao(solicitacaoId, status, usuario.id);
      await carregarSolicitacoes();
    } catch (error) {
      alert(error.message || 'Erro ao atualizar solicitação');
    } finally {
      setProcessandoId(null);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto p-8">
      <div className="bg-gradient-to-r from-[#4a1575] via-[#5b1f86] to-[#6b259d] text-white px-8 py-8 rounded-2xl mb-8 shadow-md">
        <h1 className="text-3xl font-bold mb-2">Área do Mediador — {nomeMediador}</h1>
        <p className="text-purple-100 text-base">
          Revise as solicitações de atendimento TAI e aprove ou recuse conforme a necessidade do aluno.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 mb-6 max-w-full">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <span className="text-2xl font-bold text-amber-600 block leading-tight">{solicitacoesPendentes.length}</span>
          <span className="text-sm text-gray-500 font-medium">solicitações pendentes</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        {carregando ? (
          <div className="flex items-center justify-center py-12 text-gray-500">Carregando solicitações...</div>
        ) : solicitacoesPendentes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12">
            <div className="w-14 h-14 rounded-full border-2 border-gray-200 text-gray-300 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Nenhuma solicitação pendente.</h3>
            <p className="text-sm text-gray-500">Todas as solicitações foram processadas.</p>
          </div>
        ) : (
          <div className="w-full space-y-5">
            <h3 className="text-xl font-bold text-gray-800">Solicitações TAI — Alunos PNEE</h3>
            <div className="space-y-4">
              {solicitacoesPendentes.map((solicitacao) => (
                <div key={solicitacao.id} className="border border-gray-200 rounded-2xl bg-gray-50 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
                    <div>
                      <div className="text-xs uppercase tracking-[0.12em] text-purple-700 font-semibold">Solicitação #{solicitacao.id}</div>
                      <div className="text-sm text-gray-500 mt-1">{solicitacao.tipo_suporte}</div>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      {solicitacao.status || 'Pendente'}
                    </span>
                  </div>

                  <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="space-y-3">
                      <div className="rounded-xl bg-white p-3 border border-gray-200">
                        <p className="text-[11px] uppercase tracking-[0.12em] text-gray-500 mb-2">Aluno</p>
                        <p className="font-semibold text-gray-800">{solicitacao.aluno?.nome || 'Aluno não identificado'}</p>
                        <p className="text-sm text-gray-600">{solicitacao.aluno?.email || 'E-mail não informado'}</p>
                        <p className="text-sm text-gray-600">Matrícula: {solicitacao.aluno?.matricula || '—'}</p>
                      </div>

                      <div className="rounded-xl bg-white p-3 border border-gray-200">
                        <p className="text-[11px] uppercase tracking-[0.12em] text-gray-500 mb-2">Solicitação</p>
                        <p className="font-semibold text-gray-800">{solicitacao.disciplina_nome || 'Disciplina não localizada'}</p>
                        <p className="text-sm text-gray-600">Tipo de suporte: {solicitacao.tipo_suporte}</p>
                        {solicitacao.descricao ? (
                          <p className="text-sm text-gray-600 mt-2">{solicitacao.descricao}</p>
                        ) : (
                          <p className="text-sm text-gray-400 mt-2">Sem descrição adicional.</p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl bg-white p-3 border border-gray-200">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-gray-500 mb-3">Professores vinculados à disciplina</p>
                      {solicitacao.professores?.length ? (
                        <div className="space-y-3">
                          {solicitacao.professores.map((professor) => (
                            <div key={professor.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                              <p className="font-semibold text-gray-800">{professor.nome}</p>
                              <p className="text-sm text-gray-600">{professor.email || 'E-mail não informado'}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Nenhum professor vinculado identificado para esta disciplina.</p>
                      )}
                    </div>
                  </div>

                  <div className="px-5 py-4 bg-white border-t border-gray-200 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => handleDecisao(solicitacao.id, 'Recusado')}
                      disabled={processandoId === solicitacao.id}
                      className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                    >
                      {processandoId === solicitacao.id ? 'Processando...' : 'Recusar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecisao(solicitacao.id, 'Aprovado')}
                      disabled={processandoId === solicitacao.id}
                      className="inline-flex items-center justify-center rounded-xl bg-[#4a1575] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5b1f86] disabled:opacity-60"
                    >
                      {processandoId === solicitacao.id ? 'Processando...' : 'Aprovar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardMediador;

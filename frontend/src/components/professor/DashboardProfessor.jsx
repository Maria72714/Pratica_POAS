import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { buscarAtendimentosProfessor } from '../../services/professor/agendamento';
import { buscarSolicitacoesPendentes } from '../../services/aluno/solicitacao';
import CardEstatisticas from '../CardEstatisticas';
import PageShell from '../ui/PageShell';
import PageHeader from '../ui/PageHeader';

const DashboardProfessor = () => {
  const [atendimentos, setAtendimentos] = useState([]);
  const [solicitacoesPendentes, setSolicitacoesPendentes] = useState([]);
  const [loading, setLoading] = useState(true);

  const usuario = (() => {
    try {
      return JSON.parse(
        localStorage.getItem('usuario') || localStorage.getItem('suap_user') || '{}'
      );
    } catch {
      return {};
    }
  })();

  const nomeCompleto = usuario?.nome || 'Professor';
  const primeiroNome = nomeCompleto.split(' ')[0];
  const matricula = usuario?.matricula;

  useEffect(() => {
    if (!matricula) {
      setLoading(false);
      return;
    }
    Promise.all([
      buscarAtendimentosProfessor(matricula).catch(() => []),
      buscarSolicitacoesPendentes().catch(() => []),
    ])
      .then(([a, s]) => {
        setAtendimentos(Array.isArray(a) ? a : []);
        setSolicitacoesPendentes(Array.isArray(s) ? s : []);
      })
      .finally(() => setLoading(false));
  }, [matricula]);

  const taiCount = atendimentos.filter(
    (a) => a.tipo_atendimento?.toUpperCase() === 'TAI' || Boolean(a.id_solicitacao)
  ).length;
  const concluidosCount = atendimentos.filter((a) =>
    ['concluido', 'concluído', 'realizado'].includes((a.status || '').toLowerCase())
  ).length;

  const stats = [
    { label: 'Meus atendimentos', value: loading ? '—' : atendimentos.length },
    { label: 'Atendimentos TAI', value: loading ? '—' : taiCount },
    { label: 'Solicitações pendentes', value: loading ? '—' : solicitacoesPendentes.length },
    { label: 'Atendimentos concluídos', value: loading ? '—' : concluidosCount },
  ];

  const acoes = [
    {
      to: '/professor/atendimentos/novo',
      titulo: 'Novo Atendimento',
      descricao: 'Criar um atendimento para um aluno',
      destaque: true,
      badge: null,
      icone: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
      ),
    },
    {
      to: '/professor/atendimentos',
      titulo: 'Meus Atendimentos',
      descricao: 'Calendário, lista e histórico',
      badge: null,
      icone: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      ),
    },
    {
      to: '/professor/atendimentos?tab=solicitacoes',
      titulo: 'Solicitações TAI',
      descricao: 'Avaliar pedidos de atendimento',
      badge: solicitacoesPendentes.length,
      icone: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      ),
    },
    {
      to: '/professor/horarios',
      titulo: 'Horários Disponíveis',
      descricao: 'Configurar sua disponibilidade semanal',
      badge: null,
      icone: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    },
    {
      to: '/professor/completar-perfil',
      titulo: 'Minhas Disciplinas',
      descricao: 'Vincular disciplinas e turmas que leciona',
      badge: null,
      icone: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      ),
    },
    {
      to: '/professor/relatorios',
      titulo: 'Relatórios',
      descricao: 'Histórico, exportação CSV e impressão',
      badge: null,
      icone: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      ),
    },
  ];

  const badgeMatricula = matricula ? (
    <span className="inline-flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded text-xs font-medium">
      Mat. {matricula}
    </span>
  ) : null;

  return (
    <PageShell>
      <PageHeader
        role="professor"
        title={`Bem-vindo, ${primeiroNome}!`}
        subtitle="Gerencie seus atendimentos TAI, configure sua disponibilidade e acompanhe seus relatórios."
        actions={badgeMatricula}
      />

      <div className="space-y-6">
        {/* Cards de Estatísticas padrão do site */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat, index) => (
            <CardEstatisticas key={index} stat={stat} index={index} />
          ))}
        </div>

        {/* Ações Rápidas Padronizadas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {acoes.map((acao) => (
            <Link
              key={acao.to}
              to={acao.to}
              className={`flex items-center gap-3 border rounded-lg sm:rounded-xl p-4 shadow-sm hover:shadow-xs transition-all group ${
                acao.destaque
                  ? 'bg-emerald-700 border-emerald-700 text-white hover:bg-emerald-800'
                  : 'bg-white border-gray-200 hover:border-emerald-500'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  acao.destaque
                    ? 'bg-white/15 text-white'
                    : 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {acao.icone}
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold ${acao.destaque ? 'text-white' : 'text-gray-800'}`}>
                    {acao.titulo}
                  </p>
                  {acao.badge > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                      {acao.badge}
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${acao.destaque ? 'text-emerald-100' : 'text-gray-500'}`}>
                  {acao.descricao}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Informações Úteis */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-base font-bold text-gray-800">Como usar a área do professor</h2>
          </div>

          <ul className="space-y-3">
            {[
              'Crie atendimentos presenciais ou remotos para os alunos',
              'Configure seus horários disponíveis para plantão e CA',
              'Avalie as solicitações TAI enviadas por alunos e mediadores',
              'Acompanhe e exporte relatórios de atendimentos realizados',
            ].map((texto) => (
              <li key={texto} className="flex items-start gap-2.5 text-sm text-gray-600">
                <svg
                  className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>{texto}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PageShell>
  );
};

export default DashboardProfessor;

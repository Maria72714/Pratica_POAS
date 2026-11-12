import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faCalendarDays,
  faClipboardList,
  faClock,
  faBook,
  faChartColumn,
  faCircleInfo,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { buscarAtendimentosProfessor } from "../../services/professor/agendamento";
import { buscarSolicitacoesPendentes } from "../../services/aluno/solicitacao";
import CardEstatisticas from "../CardEstatisticas";
import PageShell from "../ui/PageShell";
import PageHeader from "../ui/PageHeader";

const DashboardProfessor = () => {
  const [atendimentos, setAtendimentos] = useState([]);
  const [solicitacoesPendentes, setSolicitacoesPendentes] = useState([]);
  const [loading, setLoading] = useState(true);

  const usuario = (() => {
    try {
      return JSON.parse(
        localStorage.getItem("usuario") ||
          localStorage.getItem("suap_user") ||
          "{}",
      );
    } catch {
      return {};
    }
  })();

  const nomeCompleto = usuario?.nome || "Professor";
  const primeiroNome = nomeCompleto.split(" ")[0];
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
    (a) =>
      a.tipo_atendimento?.toUpperCase() === "TAI" || Boolean(a.id_solicitacao),
  ).length;
  const concluidosCount = atendimentos.filter((a) =>
    ["concluido", "concluído", "realizado"].includes(
      (a.status || "").toLowerCase(),
    ),
  ).length;

  const stats = [
    { label: "Meus atendimentos", value: loading ? "—" : atendimentos.length },
    { label: "Atendimentos TAI", value: loading ? "—" : taiCount },
    {
      label: "Solicitações pendentes",
      value: loading ? "—" : solicitacoesPendentes.length,
    },
    {
      label: "Atendimentos concluídos",
      value: loading ? "—" : concluidosCount,
    },
  ];

  const acoes = [
    {
      to: "/professor/atendimentos/novo",
      titulo: "Novo Atendimento",
      descricao: "Criar um atendimento para um aluno",
      destaque: true,
      badge: null,
      icone: faPlus,
    },
    {
      to: "/professor/atendimentos",
      titulo: "Meus Atendimentos",
      descricao: "Calendário, lista e histórico",
      badge: null,
      icone: faCalendarDays,
    },
    {
      to: "/professor/atendimentos?tab=solicitacoes",
      titulo: "Solicitações TAI",
      descricao: "Avaliar pedidos de atendimento",
      badge: solicitacoesPendentes.length,
      icone: faClipboardList,
    },
    {
      to: "/professor/horarios",
      titulo: "Horários Disponíveis",
      descricao: "Configurar sua disponibilidade semanal",
      badge: null,
      icone: faClock,
    },
    {
      to: "/professor/completar-perfil",
      titulo: "Minhas Disciplinas",
      descricao: "Vincular disciplinas e turmas que leciona",
      badge: null,
      icone: faBook,
    },
    {
      to: "/professor/relatorios",
      titulo: "Relatórios",
      descricao: "Histórico, exportação CSV e impressão",
      badge: null,
      icone: faChartColumn,
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
                  ? "bg-emerald-700 border-emerald-700 text-white hover:bg-emerald-800"
                  : "bg-white border-gray-200 hover:border-emerald-500"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  acao.destaque
                    ? "bg-white/15 text-white"
                    : "bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white"
                }`}
              >
                <FontAwesomeIcon icon={acao.icone} className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-sm font-semibold ${acao.destaque ? "text-white" : "text-gray-800"}`}
                  >
                    {acao.titulo}
                  </p>
                  {acao.badge > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                      {acao.badge}
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs mt-0.5 ${acao.destaque ? "text-emerald-100" : "text-gray-500"}`}
                >
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
              <FontAwesomeIcon icon={faCircleInfo} className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-gray-800">
              Como usar a área do professor
            </h2>
          </div>

          <ul className="space-y-3">
            {[
              "Crie atendimentos presenciais ou remotos para os alunos",
              "Configure seus horários disponíveis para plantão e CA",
              "Avalie as solicitações TAI enviadas por alunos e mediadores",
              "Acompanhe e exporte relatórios de atendimentos realizados",
            ].map((texto) => (
              <li
                key={texto}
                className="flex items-start gap-2.5 text-sm text-gray-600"
              >
                <FontAwesomeIcon
                  icon={faCheck}
                  className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
                />
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

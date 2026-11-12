import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faClock,
  faCommentDots,
  faFileLines,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { buscarAtendimentos } from "../../services/aluno/agendamento";
import { buscarSolicitacoes } from "../../services/aluno/solicitacao";
import CardEstatisticas from "../CardEstatisticas";
import CardAgendamento from "../CardAgendamento";
import ChatAtendimento from "../ChatAtendimento";
import PageShell from "../ui/PageShell";
import PageHeader from "../ui/PageHeader";

function formatarData(iso) {
  if (!iso) return "—";
  const [ano, mes, dia] = iso.split("T")[0].split("-");
  if (ano && mes && dia) {
    return `${dia}/${mes}/${ano}`;
  }
  return iso;
}

const Dashboard = () => {
  const [atendimentos, setAtendimentos] = useState([]);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatAtendimentoId, setChatAtendimentoId] = useState(null);
  const [chatTitulo, setChatTitulo] = useState("Chat do Atendimento");

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

  const nomeCompleto = usuario?.nome || "Aluno";
  const primeiroNome = nomeCompleto.split(" ")[0];
  const matricula = usuario?.matricula;

  useEffect(() => {
    if (!matricula) {
      setLoading(false);
      return;
    }
    Promise.all([
      buscarAtendimentos(matricula).catch(() => []),
      buscarSolicitacoes(matricula).catch(() => []),
    ])
      .then(([a, s]) => {
        setAtendimentos(Array.isArray(a) ? a : []);
        setSolicitacoes(Array.isArray(s) ? s : []);
      })
      .finally(() => setLoading(false));
  }, [matricula]);

  // Estatísticas no formato padrão
  const pendentesCount = solicitacoes.filter(
    (s) => s.status === "Pendente",
  ).length;
  const aprovadasCount = solicitacoes.filter(
    (s) => s.status === "Aprovado",
  ).length;

  const stats = [
    { label: "Meus agendamentos", value: loading ? "—" : atendimentos.length },
    { label: "Solicitações pendentes", value: loading ? "—" : pendentesCount },
    { label: "Solicitações aprovadas", value: loading ? "—" : aprovadasCount },
    {
      label: "Total de solicitações",
      value: loading ? "—" : solicitacoes.length,
    },
  ];

  const proximosAtendimentos = atendimentos
    .filter((a) => {
      if (!a.data_atendimento) return true;
      const d = new Date(a.data_atendimento + "T23:59:59");
      return d >= new Date();
    })
    .slice(0, 3);

  const solicitacoesRecentes = [...solicitacoes]
    .sort((a, b) => (b.id || 0) - (a.id || 0))
    .slice(0, 4);

  const handleAbrirChat = (atendId, titulo) => {
    setChatAtendimentoId(atendId);
    setChatTitulo(titulo || "Chat do Atendimento");
  };

  const badgeMatricula = matricula ? (
    <span className="inline-flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded text-xs font-medium">
      Mat. {matricula}
    </span>
  ) : null;

  return (
    <PageShell>
      <PageHeader
        role="aluno"
        title={`Bem-vindo, ${primeiroNome}!`}
        subtitle="Acompanhe seus horários de atendimento, consulte suas solicitações e converse com a equipe."
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/solicitar-atendimento"
            className="flex items-center gap-3 bg-white border border-gray-200 hover:border-emerald-500 rounded-lg sm:rounded-xl p-4 shadow-sm hover:shadow-xs transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Nova Solicitação
              </p>
              <p className="text-xs text-gray-500">
                Solicitar atendimento inclusivo
              </p>
            </div>
          </Link>

          <Link
            to="/Agendamentos"
            className="flex items-center gap-3 bg-white border border-gray-200 hover:border-emerald-500 rounded-lg sm:rounded-xl p-4 shadow-sm hover:shadow-xs transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FontAwesomeIcon icon={faCalendarDays} className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Meus Agendamentos
              </p>
              <p className="text-xs text-gray-500">Ver calendário completo</p>
            </div>
          </Link>

          <Link
            to="/historico"
            className="flex items-center gap-3 bg-white border border-gray-200 hover:border-emerald-500 rounded-lg sm:rounded-xl p-4 shadow-sm hover:shadow-xs transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FontAwesomeIcon icon={faFileLines} className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Histórico</p>
              <p className="text-xs text-gray-500">Atendimentos anteriores</p>
            </div>
          </Link>
        </div>

        {/* Grade de 2 Colunas: Próximos Atendimentos & Solicitações Recentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna 1: Próximos Atendimentos */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h2 className="text-base font-bold text-gray-800">
                Próximos Atendimentos
              </h2>
              <Link
                to="/Agendamentos"
                className="text-xs text-emerald-700 hover:text-emerald-800 font-medium"
              >
                Ver todos
              </Link>
            </div>

            {loading ? (
              <p className="text-xs text-gray-500 text-center py-6">
                Carregando...
              </p>
            ) : proximosAtendimentos.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-xs">
                  Nenhum atendimento agendado no momento.
                </p>
                <Link
                  to="/solicitar-atendimento"
                  className="mt-2 inline-block text-xs text-emerald-700 font-semibold hover:underline"
                >
                  Fazer uma solicitação
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {proximosAtendimentos.map((agendamento, idx) => (
                  <div
                    key={agendamento.id || idx}
                    className="border border-gray-200 rounded-lg p-3 bg-white hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-800 text-xs sm:text-sm">
                          {agendamento.assunto ||
                            agendamento.tipo_atendimento ||
                            "Atendimento TAI"}
                        </h3>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {agendamento.disciplina || "Disciplina vinculada"}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                          <span className="inline-flex items-center gap-1">
                            <FontAwesomeIcon
                              icon={faCalendarDays}
                              className="w-3.5 h-3.5 text-gray-400"
                            />
                            {formatarData(agendamento.data_atendimento)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <FontAwesomeIcon
                              icon={faClock}
                              className="w-3.5 h-3.5 text-gray-400"
                            />
                            {agendamento.horario || "Horário a definir"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          {agendamento.status || "Agendado"}
                        </span>

                        {agendamento.id && (
                          <button
                            type="button"
                            onClick={() =>
                              handleAbrirChat(
                                agendamento.id,
                                agendamento.assunto || agendamento.disciplina,
                              )
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded transition-colors"
                            title="Abrir chat do atendimento"
                          >
                            <FontAwesomeIcon
                              icon={faCommentDots}
                              className="w-3 h-3 text-emerald-600"
                            />
                            Chat
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Coluna 2: Minhas Solicitações Recentes */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h2 className="text-base font-bold text-gray-800">
                Minhas Solicitações
              </h2>
              <Link
                to="/historico"
                className="text-xs text-emerald-700 hover:text-emerald-800 font-medium"
              >
                Ver histórico →
              </Link>
            </div>

            {loading ? (
              <p className="text-xs text-gray-500 text-center py-6">
                Carregando...
              </p>
            ) : solicitacoesRecentes.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-xs">Nenhuma solicitação registrada.</p>
                <Link
                  to="/solicitar-atendimento"
                  className="mt-2 inline-block text-xs text-emerald-700 font-semibold hover:underline"
                >
                  Criar solicitação
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {solicitacoesRecentes.map((sol) => (
                  <div
                    key={sol.id}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 text-xs sm:text-sm truncate">
                        {sol.disciplina_nome ||
                          sol.disciplina ||
                          "Atendimento TAI"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {sol.tipo_suporte || "Suporte"} •{" "}
                        {formatarData(sol.data_preferencial || sol.data)}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded text-xs font-semibold ${
                          sol.status === "Aprovado"
                            ? "bg-emerald-100 text-emerald-800"
                            : sol.status === "Recusado"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {sol.status || "Pendente"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat flutuante se acionado */}
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

export default Dashboard;

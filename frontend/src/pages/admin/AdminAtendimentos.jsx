import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCommentDots,
  faUsers,
  faVideo,
  faArrowUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import { apiFetch } from "../../services/httpClient";
import ChatAtendimento from "../../components/ChatAtendimento";
import PageShell from "../../components/ui/PageShell";
import PageHeader from "../../components/ui/PageHeader";
import Loading from "../../components/ui/Loading";

function formatarData(iso) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function buscarAtendimentosAdmin() {
  try {
    const res = await apiFetch("/atendimentos/admin/todos");
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default function AdminAtendimentos() {
  const navigate = useNavigate();
  const [atendimentos, setAtendimentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [chatAtendimentoId, setChatAtendimentoId] = useState(null);
  const [chatTitulo, setChatTitulo] = useState("Chat do Atendimento");

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        setErro("");
        const dados = await buscarAtendimentosAdmin();
        if (ativo) setAtendimentos(Array.isArray(dados) ? dados : []);
      } catch (e) {
        if (ativo)
          setErro(e.message || "Não foi possível carregar os atendimentos.");
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  const abrirChat = (atendimento) => {
    setChatAtendimentoId(atendimento.id);
    setChatTitulo(
      atendimento.assunto || atendimento.disciplina_nome || "Atendimento",
    );
  };

  return (
    <PageShell>
      <PageHeader
        role="admin"
        badge="Administração"
        title="Atendimentos"
        subtitle="Acompanhe todos os atendimentos da plataforma, acesse o chat e os links de CA Online."
      />

      <div className="space-y-4">
        {erro && (
          <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
            {erro}
          </div>
        )}

        {carregando ? (
          <Loading texto="Carregando atendimentos..." minHeight="min-h-[200px]" />
        ) : atendimentos.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500 shadow-sm">
            <p className="font-semibold text-gray-800">
              Nenhum atendimento registrado.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Os atendimentos criados por professores aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {atendimentos.map((atend) => (
              <div
                key={atend.id}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Atendimento #{atend.id} • {atend.disciplina_nome}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        atend.status?.toUpperCase() === "CANCELADO"
                          ? "bg-red-100 text-red-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {atend.status}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-gray-100 text-gray-600">
                      {atend.tipo_atendimento}
                    </span>
                    {atend.tem_selo && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-50 text-slate-700 border border-slate-200">
                        Selo do Mediador
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-gray-800 break-words">
                    {atend.assunto}
                  </h3>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 pt-1">
                    <span>
                      Aluno:{" "}
                      <strong className="text-gray-700">
                        {atend.aluno_nome || "Não identificado"}
                      </strong>
                      {atend.aluno_matricula
                        ? ` (${atend.aluno_matricula})`
                        : ""}
                    </span>
                    <span>
                      Professor:{" "}
                      <strong className="text-gray-700">
                        {atend.professor_nome || "A definir"}
                      </strong>
                    </span>
                    <span>
                      Data:{" "}
                      <strong className="text-gray-700">
                        {formatarData(atend.data_atendimento)}
                      </strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faUsers} className="w-3.5 h-3.5 text-slate-500" />
                      <strong className="text-gray-700">
                        {atend.total_alunos ?? 0}
                      </strong>{" "}
                      aluno(s) inscrito(s)
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-end gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => navigate(`/ca/${atend.id}`)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors"
                  >
                    <FontAwesomeIcon
                      icon={faArrowUpRightFromSquare}
                      className="w-3.5 h-3.5"
                    />
                    Ver CA
                  </button>
                  {atend.link_ca_online && (
                    <a
                      href={atend.link_ca_online}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      <FontAwesomeIcon icon={faVideo} className="w-3.5 h-3.5" />
                      CA Online
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => abrirChat(atend)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                      chatAtendimentoId === atend.id
                        ? "bg-slate-600 text-white"
                        : "bg-slate-800 hover:bg-slate-900 text-white"
                    }`}
                  >
                    <FontAwesomeIcon icon={faCommentDots} className="w-4 h-4" />
                    {chatAtendimentoId === atend.id
                      ? "Chat Aberto"
                      : "Abrir Chat"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
}

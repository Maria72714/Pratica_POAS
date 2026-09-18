import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { buscarAtendimentos } from "../services/agendamento";

const STATUS_LABELS = {
  AGENDADO: "Agendado",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
  FALTA: "Falta",
};

function formatarData(data) {
  if (!data) return "Data não informada";

  return new Date(`${data}T00:00:00`)
    .toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(".", "");
}

function formatarHora(hora) {
  return hora ? String(hora).slice(0, 5) : null;
}

function extrairAssunto(atendimento) {
  const assunto =
    atendimento.assunto || atendimento.disciplina || "Atendimento";
  return assunto.match(/Disciplina:\s*([^|]+)/i)?.[1]?.trim() || assunto;
}

function extrairObservacoes(atendimento) {
  if (atendimento.observacoes || atendimento.relatorio) {
    return atendimento.observacoes || atendimento.relatorio;
  }

  return atendimento.assunto?.match(/Obs:\s*([^|]+)/i)?.[1]?.trim();
}

function normalizarStatus(status) {
  return String(status || "AGENDADO")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function Icone({ tipo }) {
  const caminhos = {
    pessoa: "M15 19a4 4 0 00-8 0m4-8a3 3 0 100-6 3 3 0 000 6z",
    calendario:
      "M8 7V3m8 4V3m-9 4h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    relogio: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    local:
      "M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
  };

  return (
    <svg
      className="h-4 w-4 shrink-0 text-slate-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d={caminhos[tipo]}
      />
    </svg>
  );
}

export default function Historico() {
  const navigate = useNavigate();

  const [status, setStatus] = useState("");
  const [tipo, setTipo] = useState("");
  const [modalidade, setModalidade] = useState("");
  const [atendimentos, setAtendimentos] = useState([]);
  const [loading, setLoading] = useState(true);

  function backDashboard() {
    navigate("/");
  }

  useEffect(() => {
    async function carregarHistorico() {
      try {
        const usuario = JSON.parse(localStorage.getItem("usuario"));

        if (!usuario?.matricula) return;

        const dados = await buscarAtendimentos(usuario.matricula);

        setAtendimentos(dados);
      } catch (erro) {
        console.error(erro);
      } finally {
        setLoading(false);
      }
    }

    carregarHistorico();
  }, []);

  const infoCA = {
    Total: atendimentos.length,
    Concluídos: atendimentos.filter((a) => a.status === "Concluido").length,
    Agendados: atendimentos.filter((a) => a.status === "Agendado").length,
  };
  const caData = {
    status: ["Agendado", "Concluído", "Cancelado"],
    tipos: ["TAL", "TAI"],
    modalidades: ["Pesencial", "Remoto", "Híbrido"],
  };

  return (
    <div>
      <div className="bg-emerald-900 text-white font-sans rounded-xl m-[20px_20px_0_20px] px-5 py-8">
        <h1 className="text-3xl font-bold pb-1">Histórico de Atendimentos</h1>
        <p className="font-normal text-sm text-emerald-100">
          Todos os CA's em que você está ou esteve inscrito.
        </p>
      </div>

      <div className="m-[20px_20px_0_20px] grid grid-cols-3">
        {Object.entries(infoCA).map(([nome, valor]) => (
          <div className="bg-white py-5 mx-2 border rounded-2xl flex flex-col items-center font-sans shadow-sm">
            <p
              className={`font-bold text-2xl ${nome === "Total" ? "text-gray-800" : nome === "Concluídos" ? "text-green-600" : "text-yellow-600"}`}
            >
              {valor}
            </p>
            <p className="opacity-50 text-[12px]">{nome}</p>
          </div>
        ))}
      </div>

      <div className="mx-7 my-5 py-4 px-3 grid grid-cols-3 border rounded-xl bg-white text-sm">
        {Object.entries(caData).map(([nome, valor]) => (
          <select
            onChange={
              nome == "status"
                ? (e) => setStatus(e.target.value)
                : nome == "tipos"
                  ? (e) => setTipo(e.target.value)
                  : (e) => setModalidade(e.target.value)
            }
            className="flex flex-col py-2 mx-2 border bg-white rounded-md p-2 shadow-sm focus:outline-none focus:border-green-600 focus:ring-[1px] focus:ring-green-600"
          >
            <option value="">
              {nome === "modalidades"
                ? "Todas as modalidades"
                : `Todos os ${nome}`}
            </option>
            {valor.map((data) => (
              <option value={data}>{data}</option>
            ))}
          </select>
        ))}
      </div>

      <section className="mx-7 my-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800">
            Registro de Atendimentos
          </h2>
          
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-slate-500">
            Carregando atendimentos...
          </div>
        ) : atendimentos.length === 0 ? (
          <div className="py-10 text-center text-sm font-semibold text-slate-500">
            Nenhum atendimento encontrado.
          </div>
        ) : (
          <div className="space-y-3">
            {atendimentos.map((atendimento) => {
              const statusAtual = normalizarStatus(atendimento.status);
              const statusLabel =
                STATUS_LABELS[statusAtual] || atendimento.status || "Agendado";
              const horaInicio = formatarHora(
                atendimento.horario_inicio || atendimento.hora_inicio,
              );
              const horaFim = formatarHora(
                atendimento.horario_termino || atendimento.hora_fim,
              );
              const professor =
                atendimento.professor_nome ||
                atendimento.professor ||
                "Professor não informado";
              const sala =
                atendimento.sala_nome ||
                atendimento.sala ||
                atendimento.local ||
                "Sala não informada";
              const observacoes = extrairObservacoes(atendimento);

              return (
                <article
                  key={atendimento.id}
                  className="rounded-xl border border-slate-200 px-4 py-4 transition-shadow hover:shadow-sm sm:px-5"
                >
                  <div className="flex flex-col gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">
                        {extrairAssunto(atendimento)}
                      </h3>
                      <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-bold">
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-blue-700">
                          {atendimento.tipo_atendimento ||
                            atendimento.tipo ||
                            "TAL"}
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 ${statusAtual === "CONCLUIDO" ? "bg-emerald-100 text-emerald-700" : statusAtual === "CANCELADO" || statusAtual === "FALTA" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-sm text-slate-500 sm:grid-cols-2 xl:grid-cols-4">
                      <span className="flex items-center gap-2">
                        <Icone tipo="pessoa" />
                        {professor}
                      </span>
                      <span className="flex items-center gap-2">
                        <Icone tipo="calendario" />
                        {formatarData(
                          atendimento.data_atendimento || atendimento.data,
                        )}
                      </span>
                      <span className="flex items-center gap-2">
                        <Icone tipo="relogio" />
                        {horaInicio && horaFim
                          ? `${horaInicio} - ${horaFim}`
                          : "Horário não informado"}
                      </span>
                      <span className="flex items-center gap-2">
                        <Icone tipo="local" />
                        {sala}
                      </span>
                    </div>

                    {observacoes && (
                      <div className="border-t border-slate-100 pt-3 text-sm text-slate-500">
                        <strong className="text-slate-600">Observações:</strong>{" "}
                        {observacoes}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <button className="ml-7 text-gray-500 text-sm" onClick={backDashboard}>
        {"<"} Voltar ao dashboard
      </button>
    </div>
  );
}

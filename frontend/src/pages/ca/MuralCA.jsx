import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpRightFromSquare,
  faCalendarDays,
  faChalkboardUser,
  faClock,
  faCommentDots,
  faLocationDot,
  faMagnifyingGlass,
  faShieldHalved,
  faStar,
  faTag,
  faUserCheck,
  faUsers,
  faVideo,
} from "@fortawesome/free-solid-svg-icons";
import PageShell from "../../components/ui/PageShell";
import PageHeader from "../../components/ui/PageHeader";
import Loading from "../../components/ui/Loading";
import ChatAtendimento from "../../components/ChatAtendimento";
import { resolveRoleFromUser } from "../../theme/roles";
import { buscarMuralCA } from "../../services/ca";

function formatarData(iso) {
  if (!iso) return "Data a definir";
  return new Date(`${String(iso).split("T")[0]}T00:00:00`).toLocaleDateString(
    "pt-BR",
    { day: "2-digit", month: "short", year: "numeric" },
  );
}

function formatarHorario(inicio, termino) {
  const corta = (v) => (v ? String(v).slice(0, 5) : "");
  if (inicio && termino) return `${corta(inicio)} às ${corta(termino)}`;
  return corta(inicio || termino) || null;
}

// O backend devolve o status com acento ("Concluído"/"Agendado"), então a
// comparação precisa ignorar acentos para reconhecer o estado corretamente.
function normalizarStatus(status) {
  return String(status || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

const FILTROS = [
  { id: "agendados", label: "Agendados" },
  { id: "concluidos", label: "Concluídos" },
  { id: "todos", label: "Todos" },
];

export default function MuralCA() {
  const navigate = useNavigate();
  const [usuario] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("usuario") ||
          localStorage.getItem("suap_user") ||
          "{}",
      );
    } catch {
      return {};
    }
  });
  const role = resolveRoleFromUser(usuario);

  const [cas, setCas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useState("agendados");
  const [busca, setBusca] = useState("");
  const [chat, setChat] = useState(null);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    buscarMuralCA()
      .then((dados) => {
        if (!ativo) return;
        setCas(Array.isArray(dados) ? dados : []);
        setErro("");
      })
      .catch((e) => {
        if (!ativo) return;
        setErro(e.message || "Não foi possível carregar os Centros de Aprendizagem.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  const listaFiltrada = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return cas.filter((c) => {
      const status = normalizarStatus(c.status);
      if (filtro === "agendados" && status !== "AGENDADO") return false;
      if (filtro === "concluidos" && status !== "CONCLUIDO") return false;
      if (!termo) return true;
      return [c.disciplina_nome, c.assunto, c.professor_nome]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(termo));
    });
  }, [cas, filtro, busca]);

  return (
    <PageShell>
      <PageHeader
        role={role}
        badge="Centros de Aprendizagem"
        title="Mural de CAs"
        subtitle="Encontros de atendimento especial disponíveis para você."
        actions={
          <div className="relative">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="w-3.5 h-3.5 text-white/70 absolute left-3 top-1/2 -translate-y-1/2"
            />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar disciplina, professor..."
              className="pl-8 pr-3 py-2 rounded-xl bg-white/15 placeholder-white/70 text-white text-sm focus:outline-none focus:bg-white/25 w-56"
            />
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltro(f.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
              filtro === f.id
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {carregando ? (
        <Loading texto="Carregando Centros de Aprendizagem..." />
      ) : erro ? (
        <div className="bg-white border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-600 font-semibold">{erro}</p>
        </div>
      ) : listaFiltrada.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
          <p className="text-gray-500 text-sm">
            Nenhum Centro de Aprendizagem encontrado.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {listaFiltrada.map((c) => {
            const concluido = normalizarStatus(c.status) === "CONCLUIDO";
            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      concluido
                        ? "bg-blue-100 text-blue-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {c.status}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-gray-100 text-gray-700">
                    <FontAwesomeIcon icon={faTag} className="w-3 h-3" />
                    {c.tipo_atendimento}
                  </span>
                  {c.tem_selo && (
                    <span
                      className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-300"
                      title="Validado por mediador"
                    >
                      <FontAwesomeIcon icon={faShieldHalved} className="w-3 h-3" />
                      Selo
                    </span>
                  )}
                  {c.inscrito && (
                    <span
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-700"
                      title="Você confirmou presença neste CA"
                    >
                      <FontAwesomeIcon icon={faUserCheck} className="w-3 h-3" />
                      Presença confirmada
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="text-base font-bold text-gray-800 truncate">
                    {c.disciplina_nome || "Geral"}
                  </h3>
                  {c.assunto && (
                    <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">
                      {c.assunto}
                    </p>
                  )}
                </div>

                <div className="text-sm text-gray-600 space-y-1.5">
                  <span className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faChalkboardUser}
                      className="w-3.5 h-3.5 text-gray-400"
                    />
                    <span className="truncate">
                      {c.professor_nome || "Professor a definir"}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faCalendarDays}
                      className="w-3.5 h-3.5 text-gray-400"
                    />
                    {formatarData(c.data_atendimento)}
                  </span>
                  {formatarHorario(c.horario_inicio, c.horario_termino) && (
                    <span className="flex items-center gap-2">
                      <FontAwesomeIcon
                        icon={faClock}
                        className="w-3.5 h-3.5 text-gray-400"
                      />
                      {formatarHorario(c.horario_inicio, c.horario_termino)}
                    </span>
                  )}
                  {c.sala_nome && (
                    <span className="flex items-center gap-2">
                      <FontAwesomeIcon
                        icon={faLocationDot}
                        className="w-3.5 h-3.5 text-gray-400"
                      />
                      <span className="truncate">{c.sala_nome}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faUsers}
                      className="w-3.5 h-3.5 text-gray-400"
                    />
                    <strong className="text-gray-800">{c.total_alunos ?? 0}</strong>
                    {" "}
                    {c.total_alunos === 1 ? "aluno inscrito" : "alunos inscritos"}
                  </span>
                  {c.total_avaliacoes > 0 && (
                    <span className="flex items-center gap-2">
                      <FontAwesomeIcon
                        icon={faStar}
                        className="w-3.5 h-3.5 text-amber-400"
                      />
                      <strong className="text-gray-800">
                        {c.avaliacao_media?.toFixed(1)}
                      </strong>
                      <span className="text-xs text-gray-400">
                        ({c.total_avaliacoes}{" "}
                        {c.total_avaliacoes === 1 ? "avaliação" : "avaliações"})
                      </span>
                    </span>
                  )}
                </div>

                <div className="mt-auto flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => navigate(`/ca/${c.id}`)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  >
                    <FontAwesomeIcon
                      icon={faArrowUpRightFromSquare}
                      className="w-3.5 h-3.5"
                    />
                    Ver CA
                  </button>
                  {!concluido && c.link_ca_online && (
                    <a
                      href={c.link_ca_online}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      <FontAwesomeIcon icon={faVideo} className="w-3.5 h-3.5" />
                      Entrar
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setChat({
                        id: c.id,
                        titulo: c.assunto || c.disciplina_nome || "Atendimento",
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  >
                    <FontAwesomeIcon icon={faCommentDots} className="w-3.5 h-3.5" />
                    Chat
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {chat && (
        <ChatAtendimento
          atendimentoId={chat.id}
          titulo={chat.titulo}
          abertoInicial={true}
          onFechar={() => setChat(null)}
        />
      )}
    </PageShell>
  );
}

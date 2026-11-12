import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowUpRightFromSquare,
  faCalendarDays,
  faChalkboardUser,
  faCommentDots,
  faPaperPlane,
  faShieldHalved,
  faSpinner,
  faStar,
  faTag,
  faTrash,
  faUser,
  faUsers,
  faVideo,
} from "@fortawesome/free-solid-svg-icons";
import PageShell from "../../components/ui/PageShell";
import PageHeader from "../../components/ui/PageHeader";
import Loading from "../../components/ui/Loading";
import { resolveRoleFromUser } from "../../theme/roles";
import {
  avaliarCA,
  buscarAvaliacoesCA,
  buscarComentariosCA,
  buscarDetalhesCA,
  criarComentarioCA,
  excluirComentarioCA,
} from "../../services/ca";

const ROLE_LABEL = {
  aluno: "Aluno",
  professor: "Professor",
  mediador: "Mediador",
  admin: "Admin",
};

const ROLE_BADGE = {
  professor: "bg-emerald-100 text-emerald-700",
  mediador: "bg-violet-100 text-violet-700",
  admin: "bg-slate-200 text-slate-700",
  aluno: "bg-blue-100 text-blue-700",
};

function formatarData(iso) {
  if (!iso) return "Data a definir";
  return new Date(`${String(iso).split("T")[0]}T00:00:00`).toLocaleDateString(
    "pt-BR",
    { day: "2-digit", month: "long", year: "numeric" },
  );
}

function formatarDataHora(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Estrelas({ valor = 0, interativo = false, onChange = null }) {
  const [hover, setHover] = useState(0);
  const atual = interativo ? hover || valor : valor;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interativo}
          onMouseEnter={() => interativo && setHover(n)}
          onMouseLeave={() => interativo && setHover(0)}
          onClick={() => interativo && onChange && onChange(n)}
          className={interativo ? "cursor-pointer" : "cursor-default"}
          title={interativo ? `Dar nota ${n}` : undefined}
        >
          <FontAwesomeIcon
            icon={faStar}
            className={`w-6 h-6 transition-colors ${
              n <= atual ? "text-amber-400" : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function DetalhesCA() {
  const { id } = useParams();
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

  const [dados, setDados] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [novoComentario, setNovoComentario] = useState("");
  const [enviandoComentario, setEnviandoComentario] = useState(false);

  const [nota, setNota] = useState(0);
  const [comentarioAvaliacao, setComentarioAvaliacao] = useState("");
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);
  const [avaliacaoEnviada, setAvaliacaoEnviada] = useState(false);

  const carregar = async () => {
    setCarregando(true);
    setErro("");
    try {
      const [det, com] = await Promise.all([
        buscarDetalhesCA(id),
        buscarComentariosCA(id).catch(() => []),
      ]);
      setDados(det);
      setComentarios(Array.isArray(com) ? com : []);
    } catch (e) {
      setErro(e.message || "Não foi possível carregar este CA.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const enviarComentario = async (e) => {
    e.preventDefault();
    if (!novoComentario.trim()) return;
    setEnviandoComentario(true);
    try {
      const criado = await criarComentarioCA(id, novoComentario.trim());
      setComentarios((prev) => [...prev, criado]);
      setNovoComentario("");
      setDados((prev) =>
        prev ? { ...prev, total_comentarios: (prev.total_comentarios || 0) + 1 } : prev,
      );
    } catch (err) {
      alert(err.message || "Não foi possível enviar o comentário.");
    } finally {
      setEnviandoComentario(false);
    }
  };

  const removerComentario = async (comentarioId) => {
    if (!window.confirm("Excluir este comentário?")) return;
    try {
      await excluirComentarioCA(id, comentarioId);
      setComentarios((prev) => prev.filter((c) => c.id !== comentarioId));
      setDados((prev) =>
        prev
          ? {
              ...prev,
              total_comentarios: Math.max(0, (prev.total_comentarios || 1) - 1),
            }
          : prev,
      );
    } catch (err) {
      alert(err.message || "Não foi possível excluir o comentário.");
    }
  };

  const enviarAvaliacao = async (e) => {
    e.preventDefault();
    if (!nota) {
      alert("Selecione uma nota de 1 a 5 estrelas.");
      return;
    }
    setEnviandoAvaliacao(true);
    try {
      const res = await avaliarCA(id, nota, comentarioAvaliacao.trim() || null);
      setDados((prev) =>
        prev
          ? {
              ...prev,
              pode_avaliar: false,
              avaliacao: { media: res.media, total: res.total },
              minha_avaliacao: res.avaliacao,
            }
          : prev,
      );
      setAvaliacaoEnviada(true);
      setNota(0);
      setComentarioAvaliacao("");
    } catch (err) {
      alert(err.message || "Não foi possível registrar a avaliação.");
    } finally {
      setEnviandoAvaliacao(false);
    }
  };

  if (carregando) {
    return (
      <PageShell>
        <Loading texto="Carregando CA..." telaInteira />
      </PageShell>
    );
  }

  if (erro || !dados) {
    return (
      <PageShell>
        <div className="bg-white border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-600 font-semibold">
            {erro || "CA não encontrado."}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-3.5 h-3.5" />
            Voltar
          </button>
        </div>
      </PageShell>
    );
  }

  const concluido = String(dados.status || "").toUpperCase() === "CONCLUIDO";
  const statusCancelado = String(dados.status || "").toUpperCase() === "CANCELADO";
  const minhaAvaliacao = dados.minha_avaliacao;

  return (
    <PageShell>
      <PageHeader
        role={role}
        badge={`Atendimento #${dados.id}`}
        title={dados.disciplina_nome || dados.assunto || "Centro de Aprendizagem"}
        subtitle={dados.assunto || "Detalhes do encontro de CA"}
        actions={
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-semibold transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-3.5 h-3.5" />
            Voltar
          </button>
        }
      />

      {/* Informações principais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                statusCancelado
                  ? "bg-red-100 text-red-700"
                  : concluido
                    ? "bg-blue-100 text-blue-700"
                    : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {dados.status}
            </span>
            {dados.tipo_atendimento && (
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-gray-100 text-gray-700">
                <FontAwesomeIcon icon={faTag} className="w-3 h-3" />
                {dados.tipo_atendimento}
              </span>
            )}
            {dados.tem_selo && (
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                <FontAwesomeIcon icon={faShieldHalved} className="w-3 h-3" />
                Selo do Mediador
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faChalkboardUser} className="w-4 h-4 text-gray-400" />
              <span>
                Professor:{" "}
                <strong className="text-gray-800">
                  {dados.professor?.nome || "A definir"}
                </strong>
              </span>
            </span>
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendarDays} className="w-4 h-4 text-gray-400" />
              <span>{formatarData(dados.data_atendimento)}</span>
            </span>
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faVideo} className="w-4 h-4 text-gray-400" />
              <span>{dados.modalidade || "Modalidade não informada"}</span>
            </span>
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faUsers} className="w-4 h-4 text-gray-400" />
              <span>
                <strong className="text-gray-800">{dados.total_alunos}</strong>{" "}
                {dados.total_alunos === 1 ? "aluno inscrito" : "alunos inscritos"}
              </span>
            </span>
          </div>

          {dados.mediador_nome && (
            <p className="text-sm text-gray-500">
              Mediador responsável:{" "}
              <strong className="text-gray-700">{dados.mediador_nome}</strong>
            </p>
          )}

          {dados.relatorio && (
            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
              <p className="font-semibold text-gray-700 mb-0.5">Relatório</p>
              {dados.relatorio}
            </div>
          )}

          {dados.link_ca_online && (
            <a
              href={dados.link_ca_online}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors"
            >
              <FontAwesomeIcon icon={faVideo} className="w-4 h-4" />
              Entrar na videochamada
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Alunos inscritos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
            <FontAwesomeIcon icon={faUsers} className="w-4 h-4 text-emerald-600" />
            Alunos inscritos ({dados.total_alunos})
          </h3>
          {dados.alunos?.length ? (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {dados.alunos.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2"
                >
                  <FontAwesomeIcon icon={faUser} className="w-3.5 h-3.5 text-gray-400" />
                  <span className="truncate">{a.nome}</span>
                  {a.matricula && (
                    <span className="ml-auto text-xs text-gray-400">
                      {a.matricula}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">
              Nenhum aluno individualmente vinculado (CA aberto para a turma).
            </p>
          )}
        </div>
      </div>

      {/* Avaliação do CA */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <FontAwesomeIcon icon={faStar} className="w-4 h-4 text-amber-400" />
            Avaliação do CA
          </h3>
          {dados.avaliacao?.total > 0 && (
            <div className="flex items-center gap-2">
              <Estrelas valor={Math.round(dados.avaliacao.media)} />
              <span className="text-sm font-bold text-gray-800">
                {dados.avaliacao.media?.toFixed(1)}
              </span>
              <span className="text-xs text-gray-400">
                ({dados.avaliacao.total}{" "}
                {dados.avaliacao.total === 1 ? "avaliação" : "avaliações"})
              </span>
            </div>
          )}
        </div>

        {minhaAvaliacao ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-emerald-800 mb-1">
              Sua avaliação
            </p>
            <Estrelas valor={minhaAvaliacao.nota} />
            {minhaAvaliacao.comentario && (
              <p className="text-sm text-gray-700 mt-2">
                "{minhaAvaliacao.comentario}"
              </p>
            )}
          </div>
        ) : dados.pode_avaliar ? (
          <form onSubmit={enviarAvaliacao} className="space-y-3">
            <p className="text-sm text-gray-500">
              O atendimento foi concluído. Avalie sua experiência:
            </p>
            <Estrelas valor={nota} interativo onChange={setNota} />
            <textarea
              value={comentarioAvaliacao}
              onChange={(e) => setComentarioAvaliacao(e.target.value)}
              rows={3}
              placeholder="Conte como foi o atendimento (opcional)"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent resize-none"
            />
            <button
              type="submit"
              disabled={enviandoAvaliacao}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors disabled:opacity-60"
            >
              {enviandoAvaliacao ? (
                <FontAwesomeIcon icon={faSpinner} spin className="w-4 h-4" />
              ) : (
                <FontAwesomeIcon icon={faStar} className="w-4 h-4" />
              )}
              Enviar avaliação
            </button>
          </form>
        ) : (
          <p className="text-sm text-gray-400">
            {concluido
              ? "Você não tem permissão para avaliar este CA."
              : "A avaliação estará disponível após a conclusão do atendimento."}
          </p>
        )}

        {avaliacaoEnviada && (
          <p className="mt-3 text-sm text-emerald-700 font-semibold">
            Avaliação registrada. Obrigado pelo feedback!
          </p>
        )}
      </div>

      {/* Comentários públicos */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
          <FontAwesomeIcon icon={faCommentDots} className="w-4 h-4 text-emerald-600" />
          Comentários ({dados.total_comentarios ?? comentarios.length})
        </h3>

        <div className="space-y-3 mb-5">
          {comentarios.length === 0 ? (
            <p className="text-sm text-gray-400">
              Nenhum comentário ainda. Seja o primeiro a comentar.
            </p>
          ) : (
            comentarios.map((c) => (
              <div
                key={c.id}
                className="flex gap-3 bg-gray-50 rounded-xl p-3"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {(c.autor_nome || "U").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-800">
                      {c.autor_nome}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${ROLE_BADGE[c.autor_role] || ROLE_BADGE.aluno}`}
                    >
                      {ROLE_LABEL[c.autor_role] || "Usuário"}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {formatarDataHora(c.criado_em)}
                    </span>
                    {c.proprio && (
                      <button
                        onClick={() => removerComentario(c.id)}
                        className="ml-auto text-gray-300 hover:text-red-500 transition-colors"
                        title="Excluir comentário"
                      >
                        <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-1 break-words">
                    {c.mensagem}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={enviarComentario} className="flex items-end gap-2">
          <textarea
            value={novoComentario}
            onChange={(e) => setNovoComentario(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="Escreva um comentário público sobre este CA..."
            className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent resize-none"
          />
          <button
            type="submit"
            disabled={enviandoComentario || !novoComentario.trim()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors disabled:opacity-50"
          >
            {enviandoComentario ? (
              <FontAwesomeIcon icon={faSpinner} spin className="w-4 h-4" />
            ) : (
              <FontAwesomeIcon icon={faPaperPlane} className="w-4 h-4" />
            )}
            Comentar
          </button>
        </form>
      </div>
    </PageShell>
  );
}

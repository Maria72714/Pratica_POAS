import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { buscarSolicitacaoPorId, editarSolicitacao, buscarSolicitacoes } from "../../services/aluno/solicitacao";
import { buscarAtendimentos } from "../../services/aluno/agendamento";
import { fetchDisciplinas, fetchDisciplinasLocais, fetchDisciplinasSuap } from "../../services/api";
import CalendarioAtendimentos from "../CalendarioAtendimentos";

const OPCOES_SUPORTE = [
  { id: "libras",      title: "Intérprete de Libras",          desc: "Para alunos com deficiência auditiva / surdez" },
  { id: "braille",     title: "Apoio Braille / Audiodescrição", desc: "Para alunos com deficiência visual / cegueira" },
  { id: "pedagogico",  title: "Acompanhamento Pedagógico",      desc: "Dislexia, dislalia e transtornos de aprendizagem" },
  { id: "mobilidade",  title: "Apoio à Mobilidade",             desc: "Cadeirantes e deficiência motora" },
  { id: "transtornos", title: "Suporte para Transtornos",       desc: "TDA/TDAH, autismo (TEA) e similares" },
  { id: "outro",       title: "Outro tipo de suporte",          desc: "Descreva nas observações abaixo" },
];

export default function EditarSolicitacao() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading]   = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [disciplinas, setDisciplinas] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [sucesso, setSucesso]   = useState(false);
  const [erro, setErro]         = useState("");

  const [form, setForm] = useState({
    necessidade_aluno: "",
    id_disciplina: "",
    observacoes: "",
    data_preferencial: "",
  });

  // Carrega disciplinas e agendamentos (CAs) do aluno
  useEffect(() => {
    const dados = localStorage.getItem("usuario") || localStorage.getItem("suap_user");
    if (!dados) return;
    const parsed = JSON.parse(dados);

    // Disciplinas: SUAP (real) → localStorage (salvo no login)
    fetchDisciplinasSuap()
      .then((lista) => {
        if (lista.length > 0) { setDisciplinas(lista); }
        else { setDisciplinas(parsed.disciplinas ?? []); }
      })
      .catch(() => { setDisciplinas(parsed.disciplinas ?? []); });

    if (parsed.matricula) {
      Promise.allSettled([
        buscarAtendimentos(parsed.matricula),
        buscarSolicitacoes(parsed.matricula),
      ])
        .then(([resAtend, resSol]) => {
          const listaAtend = resAtend.status === "fulfilled" && Array.isArray(resAtend.value) ? resAtend.value : [];
          const listaSol = resSol.status === "fulfilled" && Array.isArray(resSol.value) ? resSol.value : [];

          const formatados = [];

          listaAtend.forEach((item) => {
            const dataIso = item.data_atendimento ? String(item.data_atendimento).split("T")[0] : "";
            if (dataIso) {
              const statusNorm =
                item.status === "Agendado" || item.status === "AGENDADO" || item.status === "Confirmado"
                  ? "Confirmado"
                  : item.status === "CONCLUIDO" || item.status === "Concluído"
                  ? "Concluído"
                  : "Pendente";

              formatados.push({
                id: `atend-${item.id}`,
                disciplina:
                  item.assunto?.split("|")?.[0]?.replace("Disciplina:", "")?.replace("TAI -", "")?.trim() ||
                  item.disciplina ||
                  "Atendimento CA",
                tipo: item.tipo_atendimento || "CA",
                status: statusNorm,
                data: dataIso,
                horario: item.horario || "Horário agendado",
                local: item.sala || item.local || "Campus IFRN",
                assunto: item.assunto || item.relatorio || "Atendimento agendado",
              });
            }
          });

          listaSol.forEach((item) => {
            // Ignora a solicitação atual que está sendo editada para evitar duplicar seleção
            if (String(item.id) === String(id)) return;

            const dataSol = item.data_preferencial || item.data || item.data_atendimento;
            if (dataSol) {
              const dataIso = String(dataSol).split("T")[0];
              const statusNorm =
                item.status === "Aprovado" || item.status === "APROVADA"
                  ? "Confirmado"
                  : item.status === "Pendente" || item.status === "PENDENTE"
                  ? "Pendente"
                  : item.status;

              const jaExiste = formatados.some(
                (f) =>
                  f.data === dataIso &&
                  f.disciplina.toLowerCase().includes((item.disciplina || item.disciplina_nome || "").toLowerCase())
              );

              if (!jaExiste) {
                formatados.push({
                  id: `sol-${item.id}`,
                  disciplina: item.disciplina || item.disciplina_nome || "Atendimento TAI",
                  tipo: "TAI",
                  status: statusNorm,
                  data: dataIso,
                  horario: "Horário preferencial",
                  local: "Apoio TAI",
                  assunto: item.descricao || item.tipo_suporte || "Solicitação TAI",
                });
              }
            }
          });

          setAgendamentos(formatados);
        })
        .catch(() => setAgendamentos([]));
    }
  }, []);

  // Carrega dados da solicitação existente
  useEffect(() => {
    async function carregarSolicitacao() {
      try {
        const dados = await buscarSolicitacaoPorId(id);
        setForm({
          necessidade_aluno: dados.tipo_suporte || "",
          id_disciplina:     dados.disciplina_nome || (dados.id_disciplina ? String(dados.id_disciplina) : ""),
          observacoes:       dados.descricao || "",
          data_preferencial: dados.data_preferencial ? dados.data_preferencial.split("T")[0] : "",
        });
      } catch (error) {
        console.error(error);
        setErro("Não foi possível carregar a solicitação.");
      } finally {
        setLoading(false);
      }
    }
    carregarSolicitacao();
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    try {
      setSalvando(true);
      await editarSolicitacao(id, {
        tipo_suporte:      form.necessidade_aluno,
        disciplina:        form.id_disciplina,
        descricao:         form.observacoes || undefined,
        data_preferencial: form.data_preferencial || undefined,
      });
      setSucesso(true);
      setTimeout(() => navigate("/historico"), 1500);
    } catch (error) {
      console.error(error);
      setErro("Erro ao atualizar solicitação. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-slate-500 text-sm gap-2">
        <svg className="animate-spin w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Carregando solicitação...
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 min-h-screen p-6 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Cabeçalho */}
        <div className="bg-[#004d34] text-white p-6 rounded-xl shadow-sm">
          <h1 className="text-2xl font-bold mb-1">Editar Solicitação de Atendimento TAI</h1>
          <p className="text-emerald-100 text-sm">
            Tutoria de Aprendizagem Inclusiva — atualize os dados da sua solicitação.
          </p>
        </div>

        {/* Feedback de sucesso */}
        {sucesso && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-800 text-sm">
            <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Solicitação atualizada com sucesso! Redirecionando...
          </div>
        )}

        {/* Feedback de erro */}
        {erro && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-800 text-sm">
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {erro}
          </div>
        )}

        {/* Formulário */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Tipo de Suporte */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-4">
                Tipo de Suporte <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {OPCOES_SUPORTE.map((opcao) => (
                  <label
                    key={opcao.id}
                    className={`cursor-pointer border rounded-xl p-4 flex items-start gap-3 transition-all ${
                      form.necessidade_aluno === opcao.id
                        ? "border-purple-500 ring-1 ring-purple-500 bg-purple-50/20"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="necessidade_aluno"
                      value={opcao.id}
                      checked={form.necessidade_aluno === opcao.id}
                      onChange={(e) => setForm((prev) => ({ ...prev, necessidade_aluno: e.target.value }))}
                      className="mt-1 w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">{opcao.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{opcao.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Disciplina */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-semibold text-gray-800">
                  Disciplina <span className="text-red-500">*</span>
                </label>
                {disciplinas.length > 0 && (
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    ✓ disciplinas do seu curso
                  </span>
                )}
              </div>

              {disciplinas.length > 0 ? (
                <select
                  value={form.id_disciplina}
                  onChange={(e) => setForm((prev) => ({ ...prev, id_disciplina: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
                >
                  <option value="">Selecione uma disciplina</option>
                  {disciplinas.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              ) : (
                /* fallback: input texto caso não haja disciplinas carregadas */
                <input
                  type="text"
                  placeholder="Digite o nome da disciplina"
                  value={form.id_disciplina}
                  onChange={(e) => setForm((prev) => ({ ...prev, id_disciplina: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              )}

              {disciplinas.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Nenhuma disciplina encontrada para seu curso/ano. Digite manualmente.
                </p>
              )}
            </div>

            {/* Data Preferencial com Calendário */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                <label className="text-sm font-semibold text-gray-800">
                  Data Preferencial (opcional)
                </label>
                {form.data_preferencial && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                      Selecionado: {form.data_preferencial.split("-")[2]}/{form.data_preferencial.split("-")[1]}/{form.data_preferencial.split("-")[0]}
                    </span>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, data_preferencial: "" }))}
                      className="text-xs text-gray-400 hover:text-red-500 underline"
                    >
                      Limpar
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Clique em um dia do calendário para definir a data preferencial. Feriados e seus agendamentos já aparecem destacados.
              </p>
              <CalendarioAtendimentos
                agendamentos={agendamentos}
                diaSelecionado={form.data_preferencial || null}
                onSelectDia={(diaIso) => setForm((prev) => ({ ...prev, data_preferencial: diaIso }))}
              />
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Observações (opcional)
              </label>
              <textarea
                value={form.observacoes}
                onChange={(e) => setForm((prev) => ({ ...prev, observacoes: e.target.value }))}
                rows={4}
                placeholder="Descreva detalhes para que o mediador possa se preparar adequadamente..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
              />
            </div>

            {/* Botões */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando || !form.necessidade_aluno || !form.id_disciplina}
                className="px-6 py-2.5 bg-[#8b3dff] text-white text-sm font-medium rounded-lg hover:bg-[#7a2eff] disabled:opacity-50 transition-colors shadow-sm"
              >
                {salvando ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
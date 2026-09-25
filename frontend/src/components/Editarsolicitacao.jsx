import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { buscarAtendimentos, editarAtendimento } from "../services/agendamento";

export default function EditarSolicitacao() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState({
    observacoes: "",
    status: "",
  });

  useEffect(() => {
    async function carregarSolicitacao() {
      try {
        const dados = await buscarSolicitacaoPorId(id);

        setForm({
          observacoes: dados.observacoes || "",
          status: dados.status || "PENDENTE",
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    carregarSolicitacao();
  }, [id]);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSalvando(true);

      await editarSolicitacao(id, form);

      alert("Solicitação atualizada com sucesso!");

      navigate("/historico-solicitacoes");
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar solicitação.");
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-3xl">

        <div className="mb-5 flex justify-center">
          <img
            src="/images/logo_branca_pratica_vetorizada.png"
            alt="pratiCA"
            className="h-16 w-auto"
          />
        </div>

        <div className="rounded-[2rem] bg-white shadow-xl border border-slate-200 overflow-hidden">

          <div className="h-2 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400" />

          <div className="px-8 py-10">

            <h1 className="text-3xl font-bold text-slate-900">
              Editar Solicitação
            </h1>

            <p className="mt-2 text-slate-500">
              Atualize as informações da solicitação.
            </p>

            <form
              onSubmit={handleSubmit}
              className="space-y-6 mt-8"
            >
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700">
                  Observações
                </label>

                <textarea
                  name="observacoes"
                  value={form.observacoes}
                  onChange={handleChange}
                  rows={5}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700">
                  Status
                </label>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                >
                  <option value="PENDENTE">Pendente</option>
                  <option value="APROVADA">Aprovada</option>
                  <option value="REJEITADA">Rejeitada</option>
                </select>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvando}
                  className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 disabled:opacity-70"
                >
                  {salvando ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>

            </form>

          </div>
        </div>
      </div>
    </div>
  );
}
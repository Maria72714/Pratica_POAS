import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiJson } from '../../services/httpClient';

/* ─── helpers ───────────────────────────────────────────────────────────────── */
function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

/* ─── Pagina principal ───────────────────────────────────────────────────────── */
export default function ComplementacaoPerfilProfessor() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sucesso, setSucesso] = useState(false);

  const [disciplinas, setDisciplinas] = useState([]);
  const [diarios, setDiarios] = useState([]);
  const [ano, setAno] = useState(new Date().getFullYear());

  const sincronizar = useCallback(async () => {
    setSaving(true);
    setError('');
    setSucesso(false);
    try {
      const data = await apiJson('/professores/sincronizar-suap', { method: 'POST' });
      setDisciplinas(data.disciplinas || []);
      setDiarios(data.diarios || []);
      setAno(data.ano || ano);
      setSucesso(true);
    } catch (err) {
      setError(err.message || 'Não foi possível sincronizar com o SUAP.');
    } finally {
      setSaving(false);
    }
  }, [ano]);

  useEffect(() => {
    const dadosLocal = localStorage.getItem('usuario') || localStorage.getItem('suap_user');
    if (!dadosLocal) {
      navigate('/login', { replace: true });
      return;
    }
    setUsuario(JSON.parse(dadosLocal));
    sincronizar().finally(() => setLoading(false));
  }, [navigate, sincronizar]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Sincronizando com o SUAP...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 flex items-start justify-center">
      <div className="w-full max-w-3xl my-6 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-800">Minhas Disciplinas</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                IFRN Caicó — dados oficiais do SUAP {ano}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sincronizado do SUAP
            </span>
          </div>
        </div>

        {/* Alertas */}
        {(error || sucesso) && (
          <div className={`mx-6 mt-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${sucesso ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-600'}`}>
            {sucesso && <CheckIcon />}
            {sucesso
              ? `${disciplinas.length} disciplina${disciplinas.length !== 1 ? 's' : ''} sincronizada${disciplinas.length !== 1 ? 's' : ''} do SUAP.`
              : error}
          </div>
        )}

        {/* Conteudo */}
        <div className="p-6">
          {disciplinas.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm font-semibold text-gray-700">Nenhuma disciplina encontrada no SUAP.</p>
              <p className="text-xs text-gray-400 mt-1">
                Você precisa ter diários no período letivo atual para que as disciplinas apareçam aqui.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {disciplinas.map((nome) => {
                const diario = diarios.find(d => d.componente_curricular === nome);
                const locais = diario?.locais_de_aula || [];
                return (
                  <li
                    key={nome}
                    className="flex items-start justify-between gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{nome}</p>
                      {locais.length > 0 && (
                        <p className="text-[11px] text-gray-400 mt-0.5">{locais.join(' • ')}</p>
                      )}
                    </div>
                    <span className="text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                      {diario ? `${diario.periodo_letivo}º período` : ''}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Rodape */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/professor')}
            className="px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold rounded-xl transition-colors"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={sincronizar}
            disabled={saving}
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all"
          >
            {saving ? 'Sincronizando...' : 'Sincronizar com o SUAP'}
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:8000/api';

/* ─── helpers ───────────────────────────────────────────────────────────────── */
function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

/* ─── Etapa 1 — escolha de turmas ───────────────────────────────────────────── */
function EtapaTurmas({ todasAsTurmas, turmasSelecionadas, onToggle, onAvancar }) {
  const [filtroCurso, setFiltroCurso] = useState('todos');
  const [busca, setBusca] = useState('');

  const cursosUnicos = [...new Map(
    todasAsTurmas.map(t => [t.curso_id, { id: t.curso_id, nome: t.curso_nome }])
  ).values()];

  // agrupa as turmas filtradas por curso
  const cursosFiltrados = cursosUnicos
    .filter(c => filtroCurso === 'todos' || c.id === filtroCurso)
    .map(c => ({
      ...c,
      turmas: todasAsTurmas.filter(t =>
        t.curso_id === c.id &&
        (!busca || t.nome.toLowerCase().includes(busca.toLowerCase()))
      )
    }))
    .filter(c => c.turmas.length > 0);

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-base font-bold text-gray-800">1. Selecione suas turmas</h2>
        <p className="text-xs text-gray-500 mt-0.5">Marque todas as turmas em que voce leciona no IFRN.</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Pesquisar turma..."
          className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        />
        <div className="flex gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFiltroCurso('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${filtroCurso === 'todos' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
          >
            Todos
          </button>
          {cursosUnicos.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFiltroCurso(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${filtroCurso === c.id ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
            >
              {c.nome.replace('Tecnico em ', '').replace('Técnico em ', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de turmas por curso */}
      <div className="space-y-5 max-h-[52vh] overflow-y-auto pr-1">
        {cursosFiltrados.map(curso => (
          <div key={curso.id}>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">{curso.nome}</p>
            <div className="flex flex-wrap gap-2">
              {curso.turmas.map(turma => {
                const sel = turmasSelecionadas.includes(turma.id);
                return (
                  <button
                    key={turma.id}
                    type="button"
                    onClick={() => onToggle(turma.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all ${
                      sel
                        ? 'bg-emerald-700 border-emerald-700 text-white font-semibold shadow-sm'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-emerald-400 hover:bg-emerald-50'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${sel ? 'bg-white border-white text-emerald-700' : 'border-gray-300 text-transparent'}`}>
                      {sel && <CheckIcon />}
                    </span>
                    <span>
                      <span className="font-bold">{turma.codigo}</span>
                      {' '}&mdash;{' '}
                      {turma.curso_nome.replace('Tecnico em ', '').replace('Técnico em ', '')} {turma.ano_ingresso}.1
                    </span>
                    <span className={`text-[10px] ${sel ? 'text-emerald-200' : 'text-gray-400'}`}>{turma.turno_label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {cursosFiltrados.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-10">Nenhuma turma encontrada.</p>
        )}
      </div>

      {/* Rodape */}
      <div className="flex items-center justify-between pt-5 mt-4 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          {turmasSelecionadas.length === 0
            ? 'Nenhuma turma selecionada'
            : `${turmasSelecionadas.length} turma${turmasSelecionadas.length > 1 ? 's' : ''} selecionada${turmasSelecionadas.length > 1 ? 's' : ''}`}
        </span>
        <button
          type="button"
          onClick={onAvancar}
          disabled={turmasSelecionadas.length === 0}
          className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2"
        >
          Proxima Etapa
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ─── Etapa 2 — disciplinas por turma ───────────────────────────────────────── */
function EtapaDisciplinas({ vinculos, todasAsTurmas, dadosPorTurma, onToggleDisciplina, onVoltar, onSubmit, saving }) {
  const [turmaAtiva, setTurmaAtiva] = useState(vinculos[0]?.turma_id || null);

  // Mapa de lookup turma_id -> turmaInfo para acesso O(1) e confiável
  const turmaMap = React.useMemo(() => {
    const m = {};
    todasAsTurmas.forEach(t => { m[t.id] = t; });
    return m;
  }, [todasAsTurmas]);

  const vinculoAtivo = vinculos.find(v => v.turma_id === turmaAtiva);
  const dadosTurma = dadosPorTurma[turmaAtiva];

  const totalDisciplinas = vinculos.reduce((acc, v) => acc + v.disciplinas.length, 0);
  const turmasSemDisc = vinculos.filter(v => v.disciplinas.length === 0).length;

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h2 className="text-base font-bold text-gray-800">2. Disciplinas por turma</h2>
        <p className="text-xs text-gray-500 mt-0.5">Para cada turma, marque as materias que voce ministra.</p>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Coluna de turmas (sidebar) */}
        <div className="w-48 flex-shrink-0 space-y-1.5 overflow-y-auto">
          {vinculos.map(v => {
            const info = turmaMap[v.turma_id];
            const ativo = v.turma_id === turmaAtiva;
            const temDisc = v.disciplinas.length > 0;
            if (!info) return null; // Turma invalida, esconde
            return (
              <button
                key={v.turma_id}
                type="button"
                onClick={() => setTurmaAtiva(v.turma_id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs transition-all ${
                  ativo
                    ? 'bg-emerald-700 border-emerald-700 text-white font-semibold shadow-sm'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50'
                }`}
              >
                <div className="font-bold text-xs leading-tight">
                  {info.nome}
                </div>
                <div className={`text-[10px] mt-0.5 ${ativo ? 'text-emerald-200' : 'text-gray-400'}`}>
                  {info.turno_label}
                </div>
                <div className={`text-[10px] mt-0.5 font-semibold ${
                  ativo ? 'text-emerald-100' : (temDisc ? 'text-emerald-600' : 'text-amber-500')
                }`}>
                  {temDisc ? `${v.disciplinas.length} disciplina${v.disciplinas.length > 1 ? 's' : ''}` : 'Nenhuma selecionada'}
                </div>
              </button>
            );
          })}
        </div>

        {/* Painel de disciplinas */}
        <div className="flex-1 min-w-0 overflow-y-auto max-h-[52vh]">
          {!dadosTurma ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-xs text-gray-400">Nenhuma disciplina encontrada para esta turma.</p>
            </div>
          ) : (
            <div>
              <p className="text-[11px] font-semibold text-gray-500 mb-3 sticky top-0 bg-white py-2 border-b border-gray-100">
                {turmaMap[turmaAtiva]?.nome || turmaAtiva} &mdash; selecione as materias:
              </p>
              <div className="space-y-4">
                {dadosTurma.disciplinas_por_ano?.filter(ag => ag.is_ano_atual).map(anoGrupo => (
                  <div key={anoGrupo.ano}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[11px] font-bold uppercase tracking-wider text-emerald-700`}>
                        {anoGrupo.ano}
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Ano Atual</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {anoGrupo.disciplinas.map(disc => {
                        const sel = vinculoAtivo?.disciplinas.includes(disc);
                        return (
                          <button
                            key={disc}
                            type="button"
                            onClick={() => onToggleDisciplina(turmaAtiva, disc)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                              sel
                                ? 'bg-emerald-700 border-emerald-700 text-white font-semibold shadow-sm'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-emerald-400 hover:bg-emerald-50'
                            }`}
                          >
                            {sel && <CheckIcon />}
                            {disc}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resumo e acoes */}
      <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onVoltar}
            className="px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold rounded-xl transition-colors"
          >
            Voltar
          </button>
          <div className="text-xs text-gray-500">
            <strong className="text-gray-700">{totalDisciplinas}</strong> disciplina{totalDisciplinas !== 1 ? 's' : ''} selecionada{totalDisciplinas !== 1 ? 's' : ''}
            {turmasSemDisc > 0 && (
              <span className="ml-2 text-amber-600 font-semibold">&bull; {turmasSemDisc} turma{turmasSemDisc > 1 ? 's' : ''} sem selecao</span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving || totalDisciplinas === 0}
          className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-md"
        >
          {saving ? 'Salvando...' : 'Salvar Vinculos'}
        </button>
      </div>
    </div>
  );
}

/* ─── Pagina principal ───────────────────────────────────────────────────────── */
export default function ComplementacaoPerfilProfessor() {
  const navigate = useNavigate();
  const { setAuthenticatedUser } = useAuth();

  const [usuario, setUsuario] = useState(null);
  const [todasAsTurmas, setTodasAsTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sucesso, setSucesso] = useState(false);

  // etapa: 1 = escolha de turmas | 2 = disciplinas por turma
  const [etapa, setEtapa] = useState(1);

  // turmas marcadas na etapa 1
  const [turmasSelecionadas, setTurmasSelecionadas] = useState([]);

  // vinculos: [{ turma_id, disciplinas[] }]
  const [vinculos, setVinculos] = useState([]);

  // cache de dados por turma (carregados ao entrar na etapa 2)
  const [dadosPorTurma, setDadosPorTurma] = useState({});

  useEffect(() => {
    const dadosLocal = localStorage.getItem('usuario') || localStorage.getItem('suap_user');
    const u = dadosLocal ? JSON.parse(dadosLocal) : { matricula: '20241001', nome: 'Prof. Teste', id: '20241001' };
    setUsuario(u);

    async function carregar() {
      try {
        const [resCat, resProf] = await Promise.all([
          fetch(`${API_BASE}/professores/dados-complementares`),
          fetch(`${API_BASE}/professores/perfil/${encodeURIComponent(u.matricula || u.id)}`)
        ]);
        if (resCat.ok) {
          const cat = await resCat.json();
          setTodasAsTurmas(cat.turmas || []);
        }
        if (resProf.ok) {
          const prof = await resProf.json();
          if (prof.vinculos?.length) {
            const vs = prof.vinculos.map(v => ({ turma_id: v.turma_id, disciplinas: v.disciplinas || [] }));
            setVinculos(vs);
            setTurmasSelecionadas(vs.map(v => v.turma_id));
          } else if (prof.turmas?.length) {
            const ids = prof.turmas;
            setTurmasSelecionadas(ids);
            setVinculos(ids.map(t => ({ turma_id: t, disciplinas: [] })));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  function toggleTurma(id) {
    setTurmasSelecionadas(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  }

  async function avancarParaEtapa2() {
    // Sincroniza vinculos com turmas selecionadas, embutindo turmaInfo
    const novosVinculos = turmasSelecionadas.map(tid => {
      const turmaInfo = todasAsTurmas.find(t => t.id === tid) || null;
      const existente = vinculos.find(v => v.turma_id === tid);
      return existente
        ? { ...existente, turmaInfo }
        : { turma_id: tid, disciplinas: [], turmaInfo };
    });
    setVinculos(novosVinculos);
    setEtapa(2);

    // Carrega disciplinas de todas as turmas em paralelo
    const faltando = turmasSelecionadas.filter(tid => !dadosPorTurma[tid]);
    if (faltando.length === 0) return;

    const resultados = await Promise.all(
      faltando.map(tid =>
        fetch(`${API_BASE}/professores/disciplinas-da-turma/${encodeURIComponent(tid)}`)
          .then(r => r.ok ? r.json() : null)
          .then(data => ({ tid, data }))
          .catch(() => ({ tid, data: null }))
      )
    );
    setDadosPorTurma(prev => {
      const novo = { ...prev };
      resultados.forEach(({ tid, data }) => { 
        novo[tid] = data || { disciplinas_por_ano: [] }; 
      });
      return novo;
    });
  }

  function toggleDisciplina(turmaId, disciplina) {
    setVinculos(prev => prev.map(v => {
      if (v.turma_id !== turmaId) return v;
      const tem = v.disciplinas.includes(disciplina);
      return { ...v, disciplinas: tem ? v.disciplinas.filter(d => d !== disciplina) : [...v.disciplinas, disciplina] };
    }));
  }

  async function handleSalvar() {
    const comDisc = vinculos.filter(v => v.disciplinas.length > 0);
    if (comDisc.length === 0) {
      setError('Selecione ao menos uma disciplina antes de salvar.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const res = await fetch(
        `${API_BASE}/professores/perfil/${encodeURIComponent(usuario.matricula || usuario.id)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vinculos: comDisc })
        }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Erro ao salvar vinculos.');
      }
      const atualizado = { ...usuario, vinculos: comDisc, perfil_completo: true };
      localStorage.setItem('usuario', JSON.stringify(atualizado));
      localStorage.setItem('suap_user', JSON.stringify(atualizado));
      if (setAuthenticatedUser) setAuthenticatedUser(atualizado);
      setSucesso(true);
      setTimeout(() => navigate('/professor', { replace: true }), 1500);
    } catch (err) {
      setError(err.message || 'Erro ao salvar perfil.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Carregando dados...</p>
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
              <h1 className="text-lg font-bold text-gray-800">Complementar Perfil</h1>
              <p className="text-xs text-gray-400 mt-0.5">IFRN Caico — Perfil Docente</p>
            </div>
            {/* Indicador de etapas */}
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${etapa === 1 ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-500'}`}>
                <span className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px] font-bold">1</span>
                Turmas
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${etapa === 2 ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-500'}`}>
                <span className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px] font-bold">2</span>
                Disciplinas
              </div>
            </div>
          </div>
        </div>

        {/* Alertas */}
        {(error || sucesso) && (
          <div className={`mx-6 mt-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${sucesso ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-600'}`}>
            {sucesso && <CheckIcon />}
            {sucesso ? 'Vinculos salvos! Redirecionando...' : error}
          </div>
        )}

        {/* Conteudo */}
        <div className="p-6">
          {etapa === 1 ? (
            <EtapaTurmas
              todasAsTurmas={todasAsTurmas}
              turmasSelecionadas={turmasSelecionadas}
              onToggle={toggleTurma}
              onAvancar={avancarParaEtapa2}
            />
          ) : (
            <EtapaDisciplinas
              vinculos={vinculos}
              todasAsTurmas={todasAsTurmas}
              dadosPorTurma={dadosPorTurma}
              onToggleDisciplina={toggleDisciplina}
              onVoltar={() => setEtapa(1)}
              onSubmit={handleSalvar}
              saving={saving}
            />
          )}
        </div>
      </div>
    </div>
  );
}

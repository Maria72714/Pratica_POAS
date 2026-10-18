import React, { useEffect, useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import PageHeader from '../../components/ui/PageHeader';
import { apiJson } from '../../services/httpClient';
import { Settings, Users, BookOpen, DoorOpen, CheckCircle, X } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('mediadores');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  // Mediadores
  const [mediadores, setMediadores] = useState([]);
  const [mediadoresAprovados, setMediadoresAprovados] = useState([]);

  // Disciplinas
  const [disciplinas, setDisciplinas] = useState([]);
  const [novaDisciplina, setNovaDisciplina] = useState('');
  const [editandoDisciplina, setEditandoDisciplina] = useState(null);

  // Turmas
  const [turmas, setTurmas] = useState([]);
  const [novasTurmas, setNovasTurmas] = useState({
    ano: new Date().getFullYear().toString(),
    turno: '',
    codigo: '',
  });

  // Salas
  const [salas, setSalas] = useState([]);
  const [novaSala, setNovaSala] = useState('');

  async function carregarDados() {
    setErro('');
    setLoading(true);
    try {
      const [med, medApr, disc, turm, sal] = await Promise.all([
        apiJson('/admin/mediadores/pendentes'),
        apiJson('/admin/mediadores'),
        apiJson('/admin/disciplinas'),
        apiJson('/admin/turmas'),
        apiJson('/admin/salas'),
      ]);
      setMediadores(Array.isArray(med) ? med : []);
      setMediadoresAprovados(Array.isArray(medApr) ? medApr : []);
      setDisciplinas(Array.isArray(disc) ? disc : []);
      setTurmas(turm.turmas || []);
      setSalas(Array.isArray(sal) ? sal : []);
    } catch (e) {
      setErro(e.message || 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  // ========== MEDIADORES ==========

  async function aprovarMediador(id) {
    try {
      await apiJson(`/admin/mediadores/${id}/aprovar`, { method: 'POST' });
      setMediadores((atual) => atual.filter((m) => m.id !== id));
      setMediadoresAprovados((atual) => [
        ...atual,
        mediadores.find((m) => m.id === id),
      ]);
    } catch (e) {
      setErro(e.message);
    }
  }

  async function rejeitarMediador(id) {
    if (!window.confirm('Rejeitar e remover este mediador?')) return;
    try {
      await apiJson(`/admin/mediadores/${id}/rejeitar`, { method: 'POST', body: JSON.stringify({}) });
      setMediadores((atual) => atual.filter((m) => m.id !== id));
    } catch (e) {
      setErro(e.message);
    }
  }

  // ========== DISCIPLINAS ==========

  async function adicionarDisciplina(e) {
    e.preventDefault();
    const nome = novaDisciplina.trim();
    if (!nome) return;
    try {
      const criada = await apiJson('/admin/disciplinas', {
        method: 'POST',
        body: JSON.stringify({ nome }),
      });
      setDisciplinas((atual) => [...atual, criada].sort((a, b) => a.nome.localeCompare(b.nome)));
      setNovaDisciplina('');
    } catch (err) {
      setErro(err.message);
    }
  }

  async function removerDisciplina(id) {
    if (!window.confirm('Remover esta disciplina?')) return;
    try {
      await apiJson(`/admin/disciplinas/${id}`, { method: 'DELETE' });
      setDisciplinas((atual) => atual.filter((d) => d.id !== id));
    } catch (err) {
      setErro(err.message);
    }
  }

  // ========== TURMAS ==========

  async function adicionarTurma(e) {
    e.preventDefault();
    if (!novasTurmas.turno || !novasTurmas.codigo) {
      setErro('Preencha todos os campos de turma.');
      return;
    }
    try {
      const criada = await apiJson('/admin/turmas', {
        method: 'POST',
        body: JSON.stringify(novasTurmas),
      });
      setTurmas((atual) => [...atual, criada]);
      setNovasTurmas({
        ano: new Date().getFullYear().toString(),
        turno: '',
        codigo: '',
      });
    } catch (err) {
      setErro(err.message);
    }
  }

  async function removerTurma(id) {
    if (!window.confirm('Remover esta turma?')) return;
    try {
      await apiJson(`/admin/turmas/${id}`, { method: 'DELETE' });
      setTurmas((atual) => atual.filter((t) => t.id !== id));
    } catch (err) {
      setErro(err.message);
    }
  }

  // ========== SALAS ==========

  async function adicionarSala(e) {
    e.preventDefault();
    const nome = novaSala.trim();
    if (!nome) return;
    try {
      const criada = await apiJson('/admin/salas', {
        method: 'POST',
        body: JSON.stringify({ nome }),
      });
      setSalas((atual) => [...atual, criada].sort((a, b) => a.nome.localeCompare(b.nome)));
      setNovaSala('');
    } catch (err) {
      setErro(err.message);
    }
  }

  async function removerSala(id) {
    if (!window.confirm('Remover esta sala?')) return;
    try {
      await apiJson(`/admin/salas/${id}`, { method: 'DELETE' });
      setSalas((atual) => atual.filter((s) => s.id !== id));
    } catch (err) {
      setErro(err.message);
    }
  }

  const tabs = [
    { id: 'mediadores', label: 'Mediadores', icon: Users },
    { id: 'disciplinas', label: 'Disciplinas', icon: BookOpen },
    { id: 'turmas', label: 'Turmas', icon: Settings },
    { id: 'salas', label: 'Salas', icon: DoorOpen },
  ];

  return (
    <PageShell>
      <PageHeader
        role="admin"
        badge="Administração"
        title="Painel Administrativo"
        subtitle="Gerencie disciplinas, turmas, salas e aprove mediadores."
      />

      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm flex items-center justify-between">
          <span>{erro}</span>
          <button
            type="button"
            onClick={() => setErro('')}
            className="text-red-500 hover:text-red-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b border-slate-200 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-slate-800 text-slate-800'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : (
        <div>
          {/* ========== MEDIADORES TAB ========== */}
          {activeTab === 'mediadores' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pendentes */}
              <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                <h3 className="text-lg font-bold text-slate-800 mb-1">Aguardando Aprovação</h3>
                <p className="text-sm text-slate-500 mb-4">{mediadores.length} solicitação(ões)</p>
                {mediadores.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">Nenhuma solicitação pendente.</p>
                ) : (
                  <ul className="space-y-3 max-h-96 overflow-y-auto">
                    {mediadores.map((m) => (
                      <li key={m.id} className="border border-slate-100 rounded-lg p-3">
                        <p className="font-semibold text-slate-800">{m.nome}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {m.email} • {m.matricula}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          <strong>Tipo:</strong> {m.tipo}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => aprovarMediador(m.id)}
                            className="flex-1 px-2 py-1.5 rounded bg-green-600 text-white text-xs font-semibold hover:bg-green-700 flex items-center justify-center gap-1"
                          >
                            <CheckCircle size={14} /> Aprovar
                          </button>
                          <button
                            onClick={() => rejeitarMediador(m.id)}
                            className="flex-1 px-2 py-1.5 rounded bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
                          >
                            Rejeitar
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Aprovados */}
              <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                <h3 className="text-lg font-bold text-slate-800 mb-1">Mediadores Aprovados</h3>
                <p className="text-sm text-slate-500 mb-4">{mediadoresAprovados.length} aprovado(s)</p>
                {mediadoresAprovados.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">Nenhum mediador aprovado.</p>
                ) : (
                  <ul className="space-y-2 max-h-96 overflow-y-auto">
                    {mediadoresAprovados.map((m) => (
                      <li key={m.id} className="border border-slate-100 rounded-lg p-3 text-sm">
                        <p className="font-semibold text-slate-800">{m.nome}</p>
                        <p className="text-xs text-slate-500">{m.email}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}

          {/* ========== DISCIPLINAS TAB ========== */}
          {activeTab === 'disciplinas' && (
            <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <h3 className="text-lg font-bold text-slate-800 mb-1">Gerenciar Disciplinas</h3>
              <p className="text-sm text-slate-500 mb-4">{disciplinas.length} cadastradas</p>

              <form onSubmit={adicionarDisciplina} className="flex gap-2 mb-6">
                <input
                  value={novaDisciplina}
                  onChange={(e) => setNovaDisciplina(e.target.value)}
                  placeholder="Nome da disciplina (ex: Matemática)"
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700"
                >
                  Adicionar
                </button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {disciplinas.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between gap-2 border border-slate-100 rounded-lg px-4 py-3"
                  >
                    <span className="font-medium text-slate-700">{d.nome}</span>
                    <button
                      type="button"
                      onClick={() => removerDisciplina(d.id)}
                      className="text-red-600 hover:text-red-700 text-xs font-semibold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ========== TURMAS TAB ========== */}
          {activeTab === 'turmas' && (
            <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <h3 className="text-lg font-bold text-slate-800 mb-1">Gerenciar Turmas</h3>
              <p className="text-sm text-slate-500 mb-4">{turmas.length} cadastradas</p>

              <form onSubmit={adicionarTurma} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
                <input
                  type="number"
                  value={novasTurmas.ano}
                  onChange={(e) => setNovasTurmas({ ...novasTurmas, ano: e.target.value })}
                  placeholder="Ano"
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
                <input
                  value={novasTurmas.turno}
                  onChange={(e) => setNovasTurmas({ ...novasTurmas, turno: e.target.value })}
                  placeholder="Turno (ex: Matutino)"
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
                <input
                  value={novasTurmas.codigo}
                  onChange={(e) => setNovasTurmas({ ...novasTurmas, codigo: e.target.value })}
                  placeholder="Código (ex: 01)"
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700"
                >
                  Adicionar
                </button>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Código</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Ano</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Turno</th>
                      <th className="text-right py-3 px-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {turmas.map((t) => (
                      <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">{t.codigo}</td>
                        <td className="py-3 px-4">{t.ano}</td>
                        <td className="py-3 px-4">{t.turno}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => removerTurma(t.id)}
                            className="text-red-600 hover:text-red-700 text-xs font-semibold"
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ========== SALAS TAB ========== */}
          {activeTab === 'salas' && (
            <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <h3 className="text-lg font-bold text-slate-800 mb-1">Gerenciar Salas</h3>
              <p className="text-sm text-slate-500 mb-4">{salas.length} cadastradas</p>

              <form onSubmit={adicionarSala} className="flex gap-2 mb-6">
                <input
                  value={novaSala}
                  onChange={(e) => setNovaSala(e.target.value)}
                  placeholder="Nome da sala (ex: Sala 101)"
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700"
                >
                  Adicionar
                </button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {salas.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-2 border border-slate-100 rounded-lg px-4 py-3"
                  >
                    <span className="font-medium text-slate-700">{s.nome}</span>
                    <button
                      type="button"
                      onClick={() => removerSala(s.id)}
                      className="text-red-600 hover:text-red-700 text-xs font-semibold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </PageShell>
  );
}

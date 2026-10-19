import React, { useEffect, useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import PageHeader from '../../components/ui/PageHeader';
import { apiJson } from '../../services/httpClient';
import { fetchLaudosPnee, avaliarLaudoPnee } from '../../services/api';
import {
  buscarSolicitacoesPendentes,
  buscarSolicitacoesRecusadas,
  decidirSolicitacao,
} from '../../services/aluno/solicitacao';
import { Settings, Users, DoorOpen, CheckCircle, X, FileText, ClipboardList, UserSearch } from 'lucide-react';

function formatarData(iso) {
  if (!iso) return '—';
  const [ano, mes, dia] = String(iso).split('T')[0].split('-');
  return `${dia}/${mes}/${ano}`;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('mediadores');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  // Mediadores
  const [mediadores, setMediadores] = useState([]);
  const [mediadoresAprovados, setMediadoresAprovados] = useState([]);

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

  // Laudos PNEE
  const [laudos, setLaudos] = useState([]);
  const [carregandoLaudos, setCarregandoLaudos] = useState(false);
  const [laudosCarregados, setLaudosCarregados] = useState(false);
  const [processandoLaudoId, setProcessandoLaudoId] = useState(null);

  // Solicitações TAI
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [carregandoSolic, setCarregandoSolic] = useState(false);
  const [solicCarregadas, setSolicCarregadas] = useState(false);
  const [processandoSolicId, setProcessandoSolicId] = useState(null);
  const [filtroSolic, setFiltroSolic] = useState('todos');

  // Usuários
  const [usuarios, setUsuarios] = useState([]);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);
  const [usuariosCarregados, setUsuariosCarregados] = useState(false);
  const [buscaUsuario, setBuscaUsuario] = useState('');
  const [filtroRole, setFiltroRole] = useState('');

  async function carregarDados() {
    setErro('');
    setLoading(true);
    try {
      const [med, medApr, turm, sal] = await Promise.all([
        apiJson('/admin/mediadores/pendentes'),
        apiJson('/admin/mediadores'),
        apiJson('/admin/turmas'),
        apiJson('/admin/salas'),
      ]);
      setMediadores(Array.isArray(med) ? med : []);
      setMediadoresAprovados(Array.isArray(medApr) ? medApr : []);
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

  // Carrega os dados das abas sob demanda (evita consultas desnecessárias).
  useEffect(() => {
    if (activeTab === 'laudos' && !laudosCarregados) carregarLaudos();
    if (activeTab === 'solicitacoes' && !solicCarregadas) carregarSolicitacoes();
    if (activeTab === 'usuarios' && !usuariosCarregados) carregarUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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

  // ========== LAUDOS PNEE ==========

  async function carregarLaudos() {
    setCarregandoLaudos(true);
    try {
      const dados = await fetchLaudosPnee();
      setLaudos(Array.isArray(dados) ? dados : []);
    } catch (err) {
      setErro(err.message || 'Erro ao carregar laudos.');
    } finally {
      setCarregandoLaudos(false);
      setLaudosCarregados(true);
    }
  }

  async function handleAvaliarLaudo(alunoId, aprovado) {
    setProcessandoLaudoId(alunoId);
    setErro('');
    try {
      await avaliarLaudoPnee(alunoId, aprovado);
      setLaudos((atual) =>
        atual.map((l) => (l.aluno_id === alunoId ? { ...l, necessidades_especiais: aprovado } : l))
      );
    } catch (err) {
      setErro(err.message || 'Erro ao avaliar laudo.');
    } finally {
      setProcessandoLaudoId(null);
    }
  }

  // ========== SOLICITAÇÕES TAI ==========

  async function carregarSolicitacoes() {
    setCarregandoSolic(true);
    try {
      const [pendentes, recusadas] = await Promise.all([
        buscarSolicitacoesPendentes(),
        buscarSolicitacoesRecusadas(),
      ]);
      const normalizar = (arr, grupo) =>
        (Array.isArray(arr) ? arr : []).map((s) => ({ ...s, _grupo: grupo }));
      setSolicitacoes([
        ...normalizar(pendentes, 'pendentes'),
        ...normalizar(recusadas, 'recusadas'),
      ]);
    } catch (err) {
      setErro(err.message || 'Erro ao carregar solicitações.');
    } finally {
      setCarregandoSolic(false);
      setSolicCarregadas(true);
    }
  }

  // O selo é atribuído a um mediador já aprovado (o admin apenas intermedia).
  function mediadorParaSelo() {
    return mediadoresAprovados[0]?.id ?? mediadores[0]?.id ?? null;
  }

  async function handleSelar(id) {
    setProcessandoSolicId(id);
    setErro('');
    try {
      await selarSolicitacao(id, mediadorParaSelo());
      await carregarSolicitacoes();
    } catch (err) {
      setErro(err.message || 'Erro ao conceder selo.');
    } finally {
      setProcessandoSolicId(null);
    }
  }

  async function handleRemoverSelo(id) {
    setProcessandoSolicId(id);
    setErro('');
    try {
      await removerSeloSolicitacao(id);
      await carregarSolicitacoes();
    } catch (err) {
      setErro(err.message || 'Erro ao remover selo.');
    } finally {
      setProcessandoSolicId(null);
    }
  }

  async function handleDecidir(id, status) {
    setProcessandoSolicId(id);
    setErro('');
    try {
      await decidirSolicitacao(id, status);
      await carregarSolicitacoes();
    } catch (err) {
      setErro(err.message || 'Erro ao avaliar solicitação.');
    } finally {
      setProcessandoSolicId(null);
    }
  }

  // ========== USUÁRIOS ==========

  async function carregarUsuarios(overrides = {}) {
    const busca = overrides.busca ?? buscaUsuario;
    const role = overrides.role ?? filtroRole;
    setCarregandoUsuarios(true);
    try {
      const params = new URLSearchParams();
      if (busca.trim()) params.set('busca', busca.trim());
      if (role) params.set('role', role);
      const qs = params.toString();
      const data = await apiJson(`/admin/usuarios${qs ? `?${qs}` : ''}`);
      setUsuarios(Array.isArray(data.usuarios) ? data.usuarios : []);
    } catch (err) {
      setErro(err.message || 'Erro ao carregar usuários.');
    } finally {
      setCarregandoUsuarios(false);
      setUsuariosCarregados(true);
    }
  }

  const tabs = [
    { id: 'mediadores', label: 'Mediadores', icon: Users },
    { id: 'laudos', label: 'Laudos PNEE', icon: FileText },
    { id: 'solicitacoes', label: 'Solicitações TAI', icon: ClipboardList },
    { id: 'usuarios', label: 'Usuários', icon: UserSearch },
    { id: 'turmas', label: 'Turmas', icon: Settings },
    { id: 'salas', label: 'Salas', icon: DoorOpen },
  ];

  return (
    <PageShell>
      <PageHeader
        role="admin"
        badge="Administração"
        title="Painel Administrativo"
        subtitle="Aprove mediadores, valide laudos PNEE, acompanhe solicitações TAI, consulte usuários e gerencie turmas e salas."
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

          {/* ========== LAUDOS PNEE TAB ========== */}
          {activeTab === 'laudos' && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Validação de Laudos PNEE</h3>
                  <p className="text-sm text-slate-500">
                    {laudos.filter((l) => !l.necessidades_especiais).length} aguardando validação de {laudos.length} laudo(s)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={carregarLaudos}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Atualizar
                </button>
              </div>

              {carregandoLaudos ? (
                <p className="text-sm text-slate-500">Carregando laudos...</p>
              ) : laudos.length === 0 ? (
                <p className="text-sm text-slate-500 italic bg-white border border-slate-200 rounded-xl p-6 text-center">
                  Nenhum laudo encaminhado para análise.
                </p>
              ) : (
                <div className="space-y-4">
                  {laudos.map((item) => (
                    <div key={item.aluno_id} className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <p className="font-bold text-slate-800">{item.nome}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Matrícula: {item.matricula} • Turma: {item.turma_nome} • Curso: {item.curso_nome}
                          </p>
                        </div>
                        <span
                          className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-semibold ${
                            item.necessidades_especiais
                              ? 'bg-slate-200 text-slate-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.necessidades_especiais ? 'PNEE Aprovado' : 'Aguardando Validação'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-4">
                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-1">
                          <span className="font-semibold text-slate-700 block">Dados de Contato</span>
                          <p className="text-slate-600">E-mail: {item.email || 'Não informado'}</p>
                          <p className="text-slate-600">
                            Aluno autodeclarou necessidade de atendimento inclusivo (TAI).
                          </p>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                          <span className="font-semibold text-slate-700 block mb-1">Comprovante / Laudo</span>
                          {item.url_laudo ? (
                            <a
                              href={item.url_laudo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-800 font-semibold underline hover:text-slate-600"
                            >
                              Visualizar laudo anexado
                            </a>
                          ) : (
                            <p className="text-slate-400 italic">Nenhum arquivo anexado pelo aluno.</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => handleAvaliarLaudo(item.aluno_id, false)}
                          disabled={processandoLaudoId === item.aluno_id}
                          className="px-4 py-2 text-xs font-semibold rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          Recusar PNEE
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAvaliarLaudo(item.aluno_id, true)}
                          disabled={processandoLaudoId === item.aluno_id}
                          className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50"
                        >
                          {processandoLaudoId === item.aluno_id
                            ? 'Processando...'
                            : item.necessidades_especiais
                              ? 'Confirmar Aprovação'
                              : 'Aprovar PNEE'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ========== SOLICITAÇÕES TAI TAB ========== */}
          {activeTab === 'solicitacoes' && (
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Solicitações TAI</h3>
                  <p className="text-sm text-slate-500">
                    Conceda o selo e aprove ou recuse as solicitações de atendimento inclusivo.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={filtroSolic}
                    onChange={(e) => setFiltroSolic(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    <option value="todos">Todas</option>
                    <option value="pendentes">Pendentes</option>
                    <option value="recusadas">Recusadas</option>
                  </select>
                  <button
                    type="button"
                    onClick={carregarSolicitacoes}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    Atualizar
                  </button>
                </div>
              </div>

              {carregandoSolic ? (
                <p className="text-sm text-slate-500">Carregando solicitações...</p>
              ) : (
                (() => {
                  const visiveis = solicitacoes.filter(
                    (s) => filtroSolic === 'todos' || s._grupo === filtroSolic
                  );
                  if (visiveis.length === 0) {
                    return (
                      <p className="text-sm text-slate-500 italic bg-white border border-slate-200 rounded-xl p-6 text-center">
                        Nenhuma solicitação encontrada para este filtro.
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-4">
                      {visiveis.map((s) => (
                        <div key={`${s._grupo}-${s.id}`} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-slate-500 font-semibold">
                                Solicitação #{s.id} • {s.status}
                              </p>
                              <p className="text-sm text-slate-700 mt-0.5">{s.tipo_suporte}</p>
                            </div>
                            {s.tem_selo ? (
                              <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
                                Validado com Selo PNEE
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                Aguardando Selo
                              </span>
                            )}
                          </div>

                          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <div className="space-y-3">
                              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500 mb-2">Aluno PNEE</p>
                                <p className="font-semibold text-slate-800">{s.aluno?.nome || 'Aluno não identificado'}</p>
                                <p className="text-sm text-slate-600">{s.aluno?.email || 'E-mail não informado'}</p>
                                <p className="text-sm text-slate-600">Matrícula: {s.aluno?.matricula || '—'}</p>
                              </div>
                              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500 mb-2">Solicitação</p>
                                <p className="font-semibold text-slate-800">{s.disciplina_nome || 'Disciplina não localizada'}</p>
                                <p className="text-sm text-slate-600">Tipo de suporte: {s.tipo_suporte}</p>
                                {s.data_preferencial && (
                                  <p className="text-sm text-slate-600 mt-1">
                                    Data solicitada: {formatarData(s.data_preferencial)}
                                  </p>
                                )}
                                {s.descricao && <p className="text-sm text-slate-600 mt-2">{s.descricao}</p>}
                              </div>
                            </div>

                            <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                              <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500 mb-3">
                                Professores vinculados à disciplina
                              </p>
                              {s.professores?.length ? (
                                <div className="space-y-2">
                                  {s.professores.map((prof) => (
                                    <div key={prof.id} className="rounded-lg border border-slate-200 bg-white p-2.5">
                                      <p className="font-semibold text-slate-800 text-xs">{prof.nome}</p>
                                      <p className="text-xs text-slate-500">{prof.email || 'E-mail não informado'}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-500">Nenhum professor vinculado identificado.</p>
                              )}
                            </div>
                          </div>

                          <div className="px-5 py-4 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
                            {s.tem_selo ? (
                              <button
                                type="button"
                                onClick={() => handleRemoverSelo(s.id)}
                                disabled={processandoSolicId === s.id}
                                className="px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 disabled:opacity-60"
                              >
                                Remover Selo
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSelar(s.id)}
                                disabled={processandoSolicId === s.id}
                                className="px-4 py-2 rounded-lg bg-slate-700 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-60"
                              >
                                Conceder Selo
                              </button>
                            )}
                            {s._grupo === 'pendentes' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleDecidir(s.id, 'Recusado')}
                                  disabled={processandoSolicId === s.id}
                                  className="px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 disabled:opacity-60"
                                >
                                  Recusar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDecidir(s.id, 'Aprovado')}
                                  disabled={processandoSolicId === s.id}
                                  className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 disabled:opacity-60"
                                >
                                  {processandoSolicId === s.id ? 'Processando...' : 'Aprovar'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}
            </section>
          )}

          {/* ========== USUÁRIOS TAB ========== */}
          {activeTab === 'usuarios' && (
            <section className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Usuários</h3>
                <p className="text-sm text-slate-500">
                  Consulte alunos, professores e mediadores sincronizados com o SUAP.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  carregarUsuarios();
                }}
                className="flex flex-col sm:flex-row gap-2"
              >
                <input
                  value={buscaUsuario}
                  onChange={(e) => setBuscaUsuario(e.target.value)}
                  placeholder="Buscar por nome, matrícula ou e-mail"
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
                <select
                  value={filtroRole}
                  onChange={(e) => {
                    setFiltroRole(e.target.value);
                    carregarUsuarios({ role: e.target.value });
                  }}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="">Todos os papéis</option>
                  <option value="aluno">Alunos</option>
                  <option value="professor">Professores</option>
                  <option value="mediador">Mediadores</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700"
                >
                  Buscar
                </button>
              </form>

              {carregandoUsuarios ? (
                <p className="text-sm text-slate-500">Carregando usuários...</p>
              ) : usuarios.length === 0 ? (
                <p className="text-sm text-slate-500 italic bg-white border border-slate-200 rounded-xl p-6 text-center">
                  Nenhum usuário encontrado.
                </p>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Nome</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Matrícula</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">E-mail</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Papel</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Detalhes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map((u) => (
                        <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 text-slate-800 font-medium">{u.nome}</td>
                          <td className="py-3 px-4 text-slate-600">{u.matricula}</td>
                          <td className="py-3 px-4 text-slate-600">{u.email}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 capitalize">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-500">
                            {u.role === 'aluno' && (
                              <>
                                {u.necessidades_especiais ? 'PNEE' : 'Sem PNEE'}
                                {' • '}
                                {u.perfil_completo ? 'Perfil completo' : 'Perfil incompleto'}
                              </>
                            )}
                            {u.role === 'mediador' && (
                              <>
                                {u.tipo}
                                {' • '}
                                {u.aprovado ? 'Aprovado' : 'Pendente'}
                              </>
                            )}
                            {(u.role !== 'aluno' && u.role !== 'mediador') && '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </PageShell>
  );
}

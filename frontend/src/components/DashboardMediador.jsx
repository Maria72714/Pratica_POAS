import React, { useState, useEffect } from 'react';
import { buscarSolicitacoesPendentes, selarSolicitacao, removerSeloSolicitacao } from '../services/aluno/solicitacao';
import { fetchLaudosPnee, avaliarLaudoPnee } from '../services/api';
import ChatAtendimento from './ChatAtendimento';
import { apiFetch, apiJson } from '../services/httpClient';
import PageShell from './ui/PageShell';
import PageHeader from './ui/PageHeader';

async function buscarAtendimentosMediadorTai() {
  try {
    const res = await apiFetch('/atendimentos/mediador/tai');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function formatarData(iso) {
  if (!iso) return '—';
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

async function buscarAlunosPnee() {
  try {
    return await apiJson('/alunos/laudos');
  } catch {
    return [];
  }
}

async function buscarDisciplinas() {
  try {
    const data = await apiJson('/professores/dados-complementares');
    // todas_disciplinas é um array de strings
    const nomes = data.todas_disciplinas || [];
    return nomes.map(nome => ({ nome }));
  } catch { return []; }
}

async function criarSolicitacaoPorMediador(payload) {
  return apiJson('/solicitacao/mediador/criar-por-aluno', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ── Componente de Selo do Mediador ───────────────────────────────────────────
function SeloMediador({ aprovado }) {
  if (!aprovado) return null;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
      Selo do Mediador
    </span>
  );
}

// ── Aba: Laudos PNEE ─────────────────────────────────────────────────────────
function AbaLaudos({ laudosPnee, carregando, processandoId, onAvaliar }) {
  return (
    <div className="p-6">
      {carregando ? (
        <div className="text-center py-12 text-gray-500 text-sm">Carregando laudos médicos...</div>
      ) : laudosPnee.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="font-semibold text-gray-700">Nenhum laudo pendente para análise.</p>
          <p className="text-xs text-gray-400 mt-1">Os alunos que anexarem laudos aparecerão aqui.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {laudosPnee.map((item) => (
            <div key={item.aluno_id} className="border border-gray-200 rounded-xl bg-gray-50/50 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
                <div>
                  <h4 className="text-base font-bold text-gray-900">{item.nome}</h4>
                  <p className="text-xs text-gray-500">
                    Matrícula: {item.matricula} • Turma: {item.turma_nome} • Curso: {item.curso_nome}
                  </p>
                </div>
                <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-semibold ${
                  item.necessidades_especiais ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {item.necessidades_especiais ? 'PNEE Aprovado' : 'Aguardando Validação'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-1">
                  <span className="font-semibold text-gray-700 block">Dados de Contato:</span>
                  <p className="text-gray-600">E-mail: {item.email || 'Não informado'}</p>
                  <p className="text-gray-600">Aluno autodeclarou necessidade de atendimento inclusivo (TAI).</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200 flex flex-col justify-between">
                  <div>
                    <span className="font-semibold text-gray-700 block mb-1">Comprovante Médico / Laudo:</span>
                    {item.url_laudo ? (
                      <a href={item.url_laudo} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-purple-700 hover:text-purple-900 font-semibold underline">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Visualizar Laudo Anexado
                      </a>
                    ) : (
                      <p className="text-gray-400 italic">Nenhum arquivo anexado pelo aluno.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button onClick={() => onAvaliar(item.aluno_id, false)}
                  disabled={processandoId === item.aluno_id}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50">
                  Recusar PNEE
                </button>
                <button onClick={() => onAvaliar(item.aluno_id, true)}
                  disabled={processandoId === item.aluno_id}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#4a1575] hover:bg-[#5b1f86] text-white transition-colors disabled:opacity-50">
                  {item.necessidades_especiais ? 'Confirmar Aprovação' : 'Aprovar PNEE'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Aba: Solicitações TAI ────────────────────────────────────────────────────
function AbaSolicitacoes({ solicitacoes, carregando, processandoId, onSelar, onRemoverSelo }) {
  return (
    <div className="p-6">
      {carregando ? (
        <div className="flex items-center justify-center py-12 text-gray-500 text-sm">Carregando solicitações...</div>
      ) : solicitacoes.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-12 text-gray-400">
          <div className="w-14 h-14 rounded-full border-2 border-gray-200 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">Nenhuma solicitação pendente.</h3>
          <p className="text-sm text-gray-500">Todas as solicitações TAI foram processadas.</p>
        </div>
      ) : (
        <div className="w-full space-y-4">
          {/* Aviso sobre o papel do mediador */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-purple-900">Papel do Mediador: Conceder Selo de Validação PNEE</p>
              <p className="text-xs text-purple-700 mt-0.5 leading-relaxed">
                Você certifica que o aluno PNEE realmente necessita deste atendimento TAI. 
                <strong> Quem de fato aprova a solicitação e cria o atendimento é o professor</strong>, mas o professor pode aprovar tendo o selo ou mesmo sem ele.
              </p>
            </div>
          </div>

          {solicitacoes.map((s) => (
            <div key={s.id} className="border border-gray-200 rounded-2xl bg-gray-50 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-white flex-wrap gap-2">
                <div>
                  <div className="text-xs uppercase tracking-[0.12em] text-purple-700 font-semibold">
                    Solicitação #{s.id}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">{s.tipo_suporte}</div>
                </div>

                <div className="flex items-center gap-2">
                  {s.tem_selo ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
                      <svg className="w-3.5 h-3.5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Validado com Selo PNEE
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      Aguardando Selo (Opcional)
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <div className="rounded-xl bg-white p-3 border border-gray-200">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-gray-500 mb-2">Aluno PNEE</p>
                    <p className="font-semibold text-gray-800">{s.aluno?.nome || 'Aluno não identificado'}</p>
                    <p className="text-sm text-gray-600">{s.aluno?.email || 'E-mail não informado'}</p>
                    <p className="text-sm text-gray-600">Matrícula: {s.aluno?.matricula || '—'}</p>
                  </div>

                  <div className="rounded-xl bg-white p-3 border border-gray-200">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-gray-500 mb-2">Solicitação</p>
                    <p className="font-semibold text-gray-800">{s.disciplina_nome || 'Disciplina não localizada'}</p>
                    <p className="text-sm text-gray-600">Tipo de suporte: {s.tipo_suporte}</p>
                    {s.data_preferencial && (
                      <div className="mt-2">
                        <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-md px-2.5 py-1 inline-flex items-center gap-1">
                          📅 Data solicitada: {formatarData(s.data_preferencial)}
                        </span>
                      </div>
                    )}
                    {s.descricao ? (
                      <p className="text-sm text-gray-600 mt-2">{s.descricao}</p>
                    ) : (
                      <p className="text-sm text-gray-400 mt-2">Sem descrição adicional.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl bg-white p-3 border border-gray-200">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-gray-500 mb-3">
                    Professores vinculados à disciplina
                  </p>
                  {s.professores?.length ? (
                    <div className="space-y-2">
                      {s.professores.map((prof) => (
                        <div key={prof.id} className="rounded-lg border border-gray-200 bg-gray-50 p-2.5">
                          <p className="font-semibold text-gray-800 text-xs">{prof.nome}</p>
                          <p className="text-xs text-gray-500">{prof.email || 'E-mail não informado'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Nenhum professor vinculado identificado.</p>
                  )}

                  <div className="mt-4 rounded-lg bg-purple-50/70 border border-purple-200 p-3 text-xs text-purple-900">
                    <p className="font-semibold mb-1">ℹ️ Fluxo do Sistema:</p>
                    <p className="text-[11px] text-purple-700">
                      Ao conceder o selo, o professor verá a solicitação com a chancela de atendimento inclusivo. O professor então poderá aprovar e agendar o horário definitivo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 bg-white border-t border-gray-200 flex gap-3 justify-end items-center">
                {s.tem_selo ? (
                  <button type="button"
                    onClick={() => onRemoverSelo(s.id)}
                    disabled={processandoId === s.id}
                    className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60 transition-colors">
                    {processandoId === s.id ? 'Processando...' : 'Remover Selo'}
                  </button>
                ) : (
                  <button type="button"
                    onClick={() => onSelar(s.id)}
                    disabled={processandoId === s.id}
                    className="inline-flex items-center gap-2 justify-center rounded-xl bg-purple-700 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-800 disabled:opacity-60 transition-colors shadow-xs">
                    {processandoId === s.id ? 'Processando...' : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Conceder Selo do Mediador
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Aba: Criar Solicitação por Aluno ─────────────────────────────────────────
function AbaCriarSolicitacao({ usuario }) {
  const [alunosPnee, setAlunosPnee] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(null);
  const [erro, setErro] = useState('');

  const [form, setForm] = useState({
    matricula_aluno: '',
    disciplina: '',
    tipo_suporte: '',
    descricao: '',
    data_preferencial: '',
  });

  useEffect(() => {
    Promise.all([buscarAlunosPnee(), buscarDisciplinas()]).then(([a, d]) => {
      setAlunosPnee(a || []);
      setDisciplinas(d || []);
    }).finally(() => setCarregando(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso(null);

    if (!form.matricula_aluno || !form.disciplina || !form.tipo_suporte) {
      setErro('Preencha os campos obrigatórios: aluno, disciplina e tipo de suporte.');
      return;
    }

    setEnviando(true);
    try {
      const mediadorId = usuario?.id || usuario?.matricula || null;
      const payload = {
        matricula_aluno: form.matricula_aluno,
        id_mediador: mediadorId,
        disciplina: form.disciplina,
        tipo_suporte: form.tipo_suporte,
        descricao: form.descricao || null,
        data_preferencial: form.data_preferencial || null,
      };
      const resultado = await criarSolicitacaoPorMediador(payload);
      setSucesso(`Solicitação #${resultado.id} criada com sucesso para ${resultado.aluno_nome}!`);
      setForm({ matricula_aluno: '', disciplina: '', tipo_suporte: '', descricao: '', data_preferencial: '' });
    } catch (err) {
      setErro(err.message || 'Erro ao criar solicitação');
    } finally {
      setEnviando(false);
    }
  };

  const alunoSelecionado = alunosPnee.find(a => a.matricula === form.matricula_aluno);

  if (carregando) {
    return <div className="p-8 text-center text-gray-500 text-sm">Carregando dados...</div>;
  }

  return (
    <div className="p-6">
      {/* Explicação */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-bold text-blue-800">Criação de Solicitação em Nome do Aluno</p>
          <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
            Use este formulário quando o aluno PNEE não tiver condições de fazer a solicitação sozinho
            (ex.: aluno cego, sem movimento nos membros superiores, etc.). A solicitação será vinculada
            ao aluno escolhido e ao seu perfil de mediador.
          </p>
        </div>
      </div>

      {sucesso && (
        <div className="mb-4 bg-emerald-50 border border-emerald-300 rounded-xl px-4 py-3 flex items-center gap-2 text-emerald-800 text-sm font-semibold">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          {sucesso}
        </div>
      )}
      {erro && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Aluno */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Aluno PNEE <span className="text-red-500">*</span>
          </label>
          {alunosPnee.length > 0 ? (
            <select name="matricula_aluno" value={form.matricula_aluno} onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent">
              <option value="">Selecione o aluno...</option>
              {alunosPnee.map(a => (
                <option key={a.aluno_id} value={a.matricula}>
                  {a.nome} — Mat. {a.matricula}
                </option>
              ))}
            </select>
          ) : (
            <input type="text" name="matricula_aluno" value={form.matricula_aluno} onChange={handleChange}
              placeholder="Digite a matrícula do aluno"
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent" />
          )}
          {alunoSelecionado && (
            <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {alunoSelecionado.nome} • {alunoSelecionado.email || 'E-mail não informado'}
            </div>
          )}
        </div>

        {/* Disciplina */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Disciplina <span className="text-red-500">*</span>
          </label>
          {disciplinas.length > 0 ? (
            <select name="disciplina" value={form.disciplina} onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent">
              <option value="">Selecione a disciplina...</option>
              {disciplinas.map(d => (
                <option key={d.id || d.nome} value={d.nome}>{d.nome}</option>
              ))}
            </select>
          ) : (
            <input type="text" name="disciplina" value={form.disciplina} onChange={handleChange}
              placeholder="Nome da disciplina"
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent" />
          )}
        </div>

        {/* Tipo de Suporte */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Tipo de Suporte <span className="text-red-500">*</span>
          </label>
          <select name="tipo_suporte" value={form.tipo_suporte} onChange={handleChange}
            className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent">
            <option value="">Selecione o tipo de suporte...</option>
            <option value="Prova Oral">Prova Oral</option>
            <option value="Tempo Adicional">Tempo Adicional</option>
            <option value="Material Adaptado">Material Adaptado</option>
            <option value="Intérprete de Libras">Intérprete de Libras</option>
            <option value="Transcritor">Transcritor</option>
            <option value="Ledor">Ledor</option>
            <option value="Sala Separada">Sala Separada</option>
            <option value="Outro">Outro</option>
          </select>
        </div>

        {/* Data Preferencial */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Data Preferencial (opcional)</label>
          <input type="date" name="data_preferencial" value={form.data_preferencial} onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent" />
        </div>

        {/* Observações */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Observações / Necessidade do Aluno (opcional)
          </label>
          <textarea name="descricao" value={form.descricao} onChange={handleChange}
            rows={3}
            placeholder="Descreva a necessidade específica do aluno PNEE..."
            className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none" />
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={enviando}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#4a1575] hover:bg-[#5b1f86] text-white text-sm font-semibold transition-colors disabled:opacity-60">
            {enviando ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Criando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Criar Solicitação em Nome do Aluno
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Aba: Atendimentos TAI & Chat ────────────────────────────────────────────
function AbaAtendimentosChat({ atendimentos, carregando, onAbrirChat, chatAtendimentoId }) {
  return (
    <div className="p-6">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-emerald-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-bold text-emerald-900">Canal de Comunicação dos Atendimentos TAI</p>
          <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
            Aqui você pode acompanhar as mensagens trocadas entre alunos e professores referentes a cada atendimento TAI e interagir diretamente pelo chat.
          </p>
        </div>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-12 text-gray-500 text-sm">Carregando atendimentos...</div>
      ) : atendimentos.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">Nenhum atendimento TAI encontrado no momento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {atendimentos.map((atend) => (
            <div key={atend.id} className="border border-gray-200 rounded-2xl bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                    Atendimento #{atend.id} • {atend.disciplina_nome}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800">
                    {atend.status}
                  </span>
                  {atend.tem_selo && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      Selo PNEE
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-gray-800">{atend.assunto}</h3>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 pt-1">
                  <span>Aluno: <strong className="text-gray-700">{atend.aluno_nome || 'Não identificado'}</strong> {atend.aluno_matricula ? `(${atend.aluno_matricula})` : ''}</span>
                  <span>Professor: <strong className="text-gray-700">{atend.professor_nome || 'A definir'}</strong></span>
                  <span>Data: <strong className="text-gray-700">{formatarData(atend.data_atendimento)}</strong></span>
                </div>
              </div>

              <div className="shrink-0 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => onAbrirChat(atend.id, atend.assunto || atend.disciplina_nome)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                    chatAtendimentoId === atend.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {chatAtendimentoId === atend.id ? 'Chat Aberto' : 'Abrir Chat'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Componente Principal ─────────────────────────────────────────────────────
const DashboardMediador = () => {
  const [usuario, setUsuario] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('laudos');

  const [solicitacoesPendentes, setSolicitacoesPendentes] = useState([]);
  const [carregandoSolicitacoes, setCarregandoSolicitacoes] = useState(true);
  const [processandoSolicitacaoId, setProcessandoSolicitacaoId] = useState(null);

  const [laudosPnee, setLaudosPnee] = useState([]);
  const [carregandoLaudos, setCarregandoLaudos] = useState(true);
  const [processandoLaudoId, setProcessandoLaudoId] = useState(null);

  const [atendimentosTai, setAtendimentosTai] = useState([]);
  const [carregandoAtendimentos, setCarregandoAtendimentos] = useState(true);
  const [chatAtendimentoId, setChatAtendimentoId] = useState(null);
  const [chatTitulo, setChatTitulo] = useState('Chat do Atendimento');

  const carregarSolicitacoes = async () => {
    try {
      const dados = await buscarSolicitacoesPendentes();
      setSolicitacoesPendentes(dados || []);
    } catch {
      setSolicitacoesPendentes([]);
    } finally {
      setCarregandoSolicitacoes(false);
    }
  };

  const carregarLaudos = async () => {
    try {
      const dados = await fetchLaudosPnee();
      setLaudosPnee(dados || []);
    } catch {
      setLaudosPnee([]);
    } finally {
      setCarregandoLaudos(false);
    }
  };

  const carregarAtendimentos = async () => {
    try {
      const dados = await buscarAtendimentosMediadorTai();
      setAtendimentosTai(dados || []);
    } catch {
      setAtendimentosTai([]);
    } finally {
      setCarregandoAtendimentos(false);
    }
  };

  useEffect(() => {
    const dados = localStorage.getItem('usuario') || localStorage.getItem('suap_user');
    if (dados) setUsuario(JSON.parse(dados));
    carregarSolicitacoes();
    carregarLaudos();
    carregarAtendimentos();
  }, []);

  const nomeMediador = usuario?.nome ? usuario.nome.split(' ')[0] : 'Mediador';

  const handleSelarSolicitacao = async (solicitacaoId) => {
    setProcessandoSolicitacaoId(solicitacaoId);
    try {
      const mediadorId = usuario?.id || usuario?.matricula || null;
      await selarSolicitacao(solicitacaoId, mediadorId);
      await carregarSolicitacoes();
      alert(`Selo de Validação PNEE concedido à solicitação #${solicitacaoId}! O professor já pode visualizar a validação.`);
    } catch (error) {
      alert(error.message || 'Erro ao conceder selo');
    } finally {
      setProcessandoSolicitacaoId(null);
    }
  };

  const handleRemoverSelo = async (solicitacaoId) => {
    setProcessandoSolicitacaoId(solicitacaoId);
    try {
      await removerSeloSolicitacao(solicitacaoId);
      await carregarSolicitacoes();
      alert(`Selo do mediador removido da solicitação #${solicitacaoId}.`);
    } catch (error) {
      alert(error.message || 'Erro ao remover selo');
    } finally {
      setProcessandoSolicitacaoId(null);
    }
  };

  const handleAvaliarLaudo = async (alunoId, aprovado) => {
    setProcessandoLaudoId(alunoId);
    try {
      await avaliarLaudoPnee(alunoId, aprovado);
      await carregarLaudos();
      alert(`Laudo do aluno ${aprovado ? 'Aprovado' : 'Recusado'} com sucesso!`);
    } catch (error) {
      alert(error.message || 'Erro ao avaliar laudo PNEE');
    } finally {
      setProcessandoLaudoId(null);
    }
  };

  const handleAbrirChat = (atendId, titulo) => {
    setChatAtendimentoId(atendId);
    setChatTitulo(titulo || 'Chat do Atendimento');
  };

  const laudosPendentes = laudosPnee.filter((l) => !l.necessidades_especiais);

  const abas = [
    { id: 'laudos',       label: 'Validação de Laudos PNEE',       badge: laudosPnee.length,           badgeCor: 'bg-purple-100 text-purple-800' },
    { id: 'solicitacoes', label: 'Solicitações TAI',               badge: solicitacoesPendentes.length, badgeCor: 'bg-amber-100 text-amber-800' },
    { id: 'atendimentos', label: 'Atendimentos & Chat',            badge: atendimentosTai.length,       badgeCor: 'bg-emerald-100 text-emerald-800' },
    { id: 'criar',        label: 'Criar por Aluno',                 badge: null,                         badgeCor: '' },
  ];

  return (
    <PageShell>
      <PageHeader
        role="mediador"
        badge="NAPNE / TAI"
        title={`Área do Mediador — ${nomeMediador}`}
        subtitle="Valide laudos PNEE, conceda o selo às solicitações TAI e crie solicitações em nome de alunos."
      />

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <span className="text-2xl font-bold text-purple-900 block leading-tight">{laudosPendentes.length}</span>
            <span className="text-xs text-gray-500 font-medium">Laudos PNEE para validar</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <span className="text-2xl font-bold text-amber-600 block leading-tight">{solicitacoesPendentes.length}</span>
            <span className="text-xs text-gray-500 font-medium">Solicitações TAI pendentes</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <span className="text-2xl font-bold text-emerald-700 block leading-tight">
              {laudosPnee.filter(l => l.necessidades_especiais).length}
            </span>
            <span className="text-xs text-gray-500 font-medium">Selos emitidos (PNEE aprovados)</span>
          </div>
        </div>
      </div>

      {/* Painel com abas */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Abas */}
        <div className="flex border-b border-gray-100 text-sm font-semibold overflow-x-auto">
          {abas.map(aba => (
            <button key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`flex-1 min-w-max py-4 px-4 text-center border-b-2 transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${
                abaAtiva === aba.id
                  ? 'border-[#4a1575] text-[#4a1575]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}>
              <span>{aba.label}</span>
              {aba.badge !== null && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${aba.badgeCor}`}>
                  {aba.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        {abaAtiva === 'laudos' && (
          <AbaLaudos
            laudosPnee={laudosPnee}
            carregando={carregandoLaudos}
            processandoId={processandoLaudoId}
            onAvaliar={handleAvaliarLaudo}
          />
        )}
        {abaAtiva === 'solicitacoes' && (
          <AbaSolicitacoes
            solicitacoes={solicitacoesPendentes}
            carregando={carregandoSolicitacoes}
            processandoId={processandoSolicitacaoId}
            onSelar={handleSelarSolicitacao}
            onRemoverSelo={handleRemoverSelo}
          />
        )}
        {abaAtiva === 'atendimentos' && (
          <AbaAtendimentosChat
            atendimentos={atendimentosTai}
            carregando={carregandoAtendimentos}
            onAbrirChat={handleAbrirChat}
            chatAtendimentoId={chatAtendimentoId}
          />
        )}
        {abaAtiva === 'criar' && (
          <AbaCriarSolicitacao usuario={usuario} />
        )}
      </div>

      {/* Chat flutuante para o Mediador */}
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
};

export default DashboardMediador;

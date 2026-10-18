import React, { useEffect, useState } from 'react';
import { 
  buscarHorariosProfessor, 
  adicionarHorarioProfessor, 
  removerHorarioProfessor, 
  alternarHorarioProfessor 
} from '../../services/professor/horarios';
import PageShell from '../../components/ui/PageShell';
import PageHeader from '../../components/ui/PageHeader';

const DIAS_SEMANA = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira'
];

export default function ProfessorHorarios() {
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [modalAberto, setModalAberto] = useState(false);

  // Form states
  const [formDia, setFormDia] = useState('Segunda-feira');
  const [formHoraInicio, setFormHoraInicio] = useState('14:00');
  const [formHoraFim, setFormHoraFim] = useState('16:00');
  const [formLocal, setFormLocal] = useState('Sala de Professores - Bloco B');
  const [formModalidade, setFormModalidade] = useState('Presencial');
  const [formDisciplina, setFormDisciplina] = useState('Todas as disciplinas');

  const usuarioSalvo = localStorage.getItem('usuario');
  const suapSalvo = localStorage.getItem('suap_user');
  const usuario = usuarioSalvo
    ? JSON.parse(usuarioSalvo)
    : suapSalvo
      ? JSON.parse(suapSalvo)
      : null;

  const matricula = usuario?.matricula || '';

  const carregarHorarios = async () => {
    if (!matricula) {
      setErro('Matrícula do professor não identificada.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setErro('');
      const data = await buscarHorariosProfessor(matricula);
      setHorarios(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setErro('Não foi possível carregar os horários de atendimento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarHorarios();
  }, [matricula]);

  const handleSalvarHorario = async (e) => {
    e.preventDefault();
    if (!formHoraInicio || !formHoraFim) {
      setErro('Informe os horários de início e fim.');
      return;
    }
    try {
      setSalvando(true);
      setErro('');
      await adicionarHorarioProfessor(matricula, {
        dia_semana: formDia,
        hora_inicio: formHoraInicio,
        hora_fim: formHoraFim,
        local: formLocal || 'Sala de Professores',
        modalidade: formModalidade,
        disciplina: formDisciplina || 'Todas as disciplinas'
      });
      setSucesso('Horário cadastrado com sucesso!');
      setModalAberto(false);
      setTimeout(() => setSucesso(''), 4000);
      await carregarHorarios();
    } catch (err) {
      console.error(err);
      setErro(err.message || 'Erro ao cadastrar horário.');
    } finally {
      setSalvando(false);
    }
  };

  const handleToggleAtivo = async (id) => {
    try {
      await alternarHorarioProfessor(matricula, id);
      setHorarios(prev => prev.map(h => h.id === id ? { ...h, ativo: !h.ativo } : h));
    } catch (err) {
      console.error(err);
      setErro('Falha ao alterar status do horário.');
    }
  };

  const handleRemover = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover esta janela de atendimento?')) return;
    try {
      await removerHorarioProfessor(matricula, id);
      setHorarios(prev => prev.filter(h => h.id !== id));
      setSucesso('Horário removido com sucesso.');
      setTimeout(() => setSucesso(''), 3000);
    } catch (err) {
      console.error(err);
      setErro('Falha ao remover horário.');
    }
  };

  // Calcular métricas
  const totalJanelas = horarios.length;
  const janelasAtivas = horarios.filter(h => h.ativo).length;
  const diasAtendidos = new Set(horarios.filter(h => h.ativo).map(h => h.dia_semana)).size;

  const btnNovoHorario = (
    <button
      type="button"
      onClick={() => { setErro(''); setModalAberto(true); }}
      className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-medium px-4 py-2.5 rounded-lg transition-all text-sm"
    >
      + Adicionar horário
    </button>
  );

  return (
    <PageShell>
      <PageHeader
        role="professor"
        title="Horários de Atendimento"
        subtitle="Defina e gerencie os períodos semanais disponíveis para plantão e CA."
        actions={btnNovoHorario}
      />

      <div className="pb-6">
        {/* Alertas */}
        {erro && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg text-red-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{erro}</span>
            </div>
            <button onClick={() => setErro('')} className="text-red-500 hover:text-red-700 font-bold ml-4">✕</button>
          </div>
        )}

        {sucesso && (
          <div className="mb-6 bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{sucesso}</span>
            </div>
            <button onClick={() => setSucesso('')} className="text-emerald-600 hover:text-emerald-800 font-bold ml-4">✕</button>
          </div>
        )}

        {/* Grade de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Janelas Cadastradas</p>
              <p className="text-2xl font-bold text-gray-800">{totalJanelas}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Horários Ativos</p>
              <p className="text-2xl font-bold text-gray-800">{janelasAtivas}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Dias com Atendimento</p>
              <p className="text-2xl font-bold text-gray-800">{diasAtendidos} dia(s)/semana</p>
            </div>
          </div>
        </div>

        {/* Seção Principal de Horários por Dia da Semana */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Grade Semanal de Disponibilidade</h2>
              <p className="text-sm text-gray-500 mt-1">
                Ative ou desative horários para controlar quando os alunos podem solicitar agendamento
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              Carregando horários de atendimento...
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {DIAS_SEMANA.map((dia) => {
                const horariosDia = horarios.filter(h => h.dia_semana === dia);
                return (
                  <div key={dia} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                        <h3 className="font-semibold text-gray-800 text-lg">{dia}</h3>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                          {horariosDia.length} horário(s)
                        </span>
                      </div>
                    </div>

                    {horariosDia.length === 0 ? (
                      <p className="text-sm text-gray-400 italic pl-5">Nenhum horário cadastrado para este dia.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-5">
                        {horariosDia.map((item) => (
                          <div 
                            key={item.id} 
                            className={`p-4 rounded-xl border transition-all ${
                              item.ativo 
                                ? 'border-emerald-200 bg-emerald-50/20 shadow-xs' 
                                : 'border-gray-200 bg-gray-50/60 opacity-60'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-bold text-gray-800">
                                  {item.hora_inicio} às {item.hora_fim}
                                </span>
                              </div>
                              <button
                                onClick={() => handleToggleAtivo(item.id)}
                                title={item.ativo ? "Desativar horário" : "Ativar horário"}
                                className={`text-xs px-2 py-1 rounded font-medium cursor-pointer transition-colors ${
                                  item.ativo 
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                {item.ativo ? 'Ativo' : 'Inativo'}
                              </button>
                            </div>

                            <div className="space-y-1.5 text-xs text-gray-600 mb-4">
                              <div className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="truncate">{item.local || 'Sala de Professores'}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span>{item.modalidade || 'Presencial'}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <span className="truncate">{item.disciplina || 'Todas as disciplinas'}</span>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-gray-100 flex justify-end">
                              <button
                                onClick={() => handleRemover(item.id)}
                                className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1 hover:underline cursor-pointer"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Excluir
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Cadastro de Horário */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">Novo Horário de Atendimento</h3>
              <button 
                onClick={() => setModalAberto(false)}
                className="text-emerald-200 hover:text-white font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarHorario} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Dia da Semana</label>
                <select
                  value={formDia}
                  onChange={(e) => setFormDia(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  {DIAS_SEMANA.map((dia) => (
                    <option key={dia} value={dia}>{dia}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Hora de Início</label>
                  <input
                    type="time"
                    value={formHoraInicio}
                    onChange={(e) => setFormHoraInicio(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Hora de Término</label>
                  <input
                    type="time"
                    value={formHoraFim}
                    onChange={(e) => setFormHoraFim(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Local / Sala</label>
                <input
                  type="text"
                  value={formLocal}
                  onChange={(e) => setFormLocal(e.target.value)}
                  placeholder="Ex: Sala de Professores - Bloco B"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Modalidade</label>
                  <select
                    value={formModalidade}
                    onChange={(e) => setFormModalidade(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    <option value="Presencial">Presencial</option>
                    <option value="Remoto">Remoto</option>
                    <option value="Híbrido">Híbrido</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Disciplina</label>
                  <input
                    type="text"
                    value={formDisciplina}
                    onChange={(e) => setFormDisciplina(e.target.value)}
                    placeholder="Ex: Todas as disciplinas"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Salvar Horário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}

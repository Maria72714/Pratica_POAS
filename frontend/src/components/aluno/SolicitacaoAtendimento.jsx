import React, { useState, useEffect } from 'react';
import { fetchDisciplinas, fetchDisciplinasLocais, fetchDisciplinasSuap } from '../../services/api';
import { cadastrarSolicitacao, buscarSolicitacoes } from '../../services/aluno/solicitacao';
import { buscarAtendimentos } from '../../services/aluno/agendamento';
import CalendarioAtendimentos from '../CalendarioAtendimentos';
import { useNavigate } from 'react-router-dom';

const SolicitacaoTAI = () => {
  const [suporte, setSuporte] = useState('');
  const [disciplina, setDisciplina] = useState('');
  const [disciplinas, setDisciplinas] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [data, setData] = useState('');
  const [desc, setDesc] = useState('');
  const [agendamentos, setAgendamentos] = useState([]);

  useEffect(() => {
    const dados = localStorage.getItem('usuario') || localStorage.getItem('suap_user');
    if (!dados) return;
    const parsed = JSON.parse(dados);
    setUsuario(parsed);

    // Disciplinas: SUAP (real) → localStorage (salvo no login)
    fetchDisciplinasSuap()
      .then((lista) => {
        if (lista.length > 0) {
          setDisciplinas(lista);
        } else {
          // SUAP retornou vazio: usa o que foi salvo no login
          setDisciplinas(parsed.disciplinas ?? []);
        }
      })
      .catch(() => {
        // SUAP inacessível: usa o que foi salvo no login
        setDisciplinas(parsed.disciplinas ?? []);
      });

    if (parsed.matricula) {
      Promise.allSettled([
        buscarAtendimentos(parsed.matricula),
        buscarSolicitacoes(parsed.matricula)
      ])
        .then(([resAtend, resSol]) => {
          const listaAtend = resAtend.status === 'fulfilled' && Array.isArray(resAtend.value) ? resAtend.value : [];
          const listaSol = resSol.status === 'fulfilled' && Array.isArray(resSol.value) ? resSol.value : [];

          const formatados = [];

          // 1. CAs reais (atendimentos agendados ou criados pela aprovação do mediador)
          listaAtend.forEach((item) => {
            const dataIso = item.data_atendimento ? String(item.data_atendimento).split('T')[0] : '';
            if (dataIso) {
              const statusNorm =
                item.status === 'Agendado' || item.status === 'AGENDADO' || item.status === 'Confirmado'
                  ? 'Confirmado'
                  : item.status === 'CONCLUIDO' || item.status === 'Concluído'
                  ? 'Concluído'
                  : 'Pendente';

              formatados.push({
                id: `atend-${item.id}`,
                disciplina:
                  item.assunto?.split('|')?.[0]?.replace('Disciplina:', '')?.replace('TAI -', '')?.trim() ||
                  item.disciplina ||
                  'Atendimento CA',
                tipo: item.tipo_atendimento || 'CA',
                status: statusNorm,
                data: dataIso,
                horario: item.horario || 'Horário agendado',
                local: item.sala || item.local || 'Campus IFRN',
                assunto: item.assunto || item.relatorio || 'Atendimento agendado'
              });
            }
          });

          // 2. Solicitações do aluno com data preferencial
          listaSol.forEach((item) => {
            const dataSol = item.data_preferencial || item.data || item.data_atendimento;
            if (dataSol) {
              const dataIso = String(dataSol).split('T')[0];
              const statusNorm =
                item.status === 'Aprovado' || item.status === 'APROVADA'
                  ? 'Confirmado'
                  : item.status === 'Pendente' || item.status === 'PENDENTE'
                  ? 'Pendente'
                  : item.status;

              const jaExiste = formatados.some(
                (f) =>
                  f.data === dataIso &&
                  f.disciplina.toLowerCase().includes((item.disciplina || item.disciplina_nome || '').toLowerCase())
              );

              if (!jaExiste) {
                formatados.push({
                  id: `sol-${item.id}`,
                  disciplina: item.disciplina || item.disciplina_nome || 'Atendimento TAI',
                  tipo: 'TAI',
                  status: statusNorm,
                  data: dataIso,
                  horario: 'Horário preferencial',
                  local: 'Apoio TAI',
                  assunto: item.descricao || item.tipo_suporte || 'Solicitação TAI'
                });
              }
            }
          });

          setAgendamentos(formatados);
        })
        .catch(() => {
          setAgendamentos([]);
        });
    }
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!usuario?.matricula) return;

    try {
      await cadastrarSolicitacao({
        matricula: usuario.matricula,
        disciplina,
        tipo_suporte: suporte,
        descricao: desc || undefined,
        data_preferencial: data || undefined,
      });
      navigate('/historico');
    } catch (err) {
      const mensagem = err.response?.data?.detail || err.message || 'Erro ao solicitar CA';
      alert(mensagem);
      console.error('Erro ao solicitar CA:', err);
    }
  }

  const navigate = useNavigate()

  const opcoesSuporte = [
    {
      id: 'libras',
      title: 'Intérprete de Libras',
      desc: 'Para alunos com deficiência auditiva / surdez',
    },
    {
      id: 'braille',
      title: 'Apoio Braille / Audiodescrição',
      desc: 'Para alunos com deficiência visual / cegueira',
    },
    {
      id: 'pedagogico',
      title: 'Acompanhamento Pedagógico',
      desc: 'Dislexia, dislalia e transtornos de aprendizagem',
    },
    {
      id: 'mobilidade',
      title: 'Apoio à Mobilidade',
      desc: 'Cadeirantes e deficiência motora',
    },
    {
      id: 'transtornos',
      title: 'Suporte para Transtornos',
      desc: 'TDA/TDAH, autismo (TEA) e similares',
    },
    {
      id: 'outro',
      title: 'Outro tipo de suporte',
      desc: 'Descreva nas observações abaixo',
    },
  ];

  return (
    <div className="flex-1 bg-gray-50 min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Banner Superior Verde Escuro */}
        <div className="bg-[#004d34] text-white p-6 rounded-xl shadow-sm">
          <h1 className="text-2xl font-bold mb-1">Solicitação de Atendimento TAI</h1>
          <p className="text-emerald-100 text-sm">
            Tutoria de Aprendizagem Inclusiva — atendimento especializado com mediador NAPNE.
          </p>
          {usuario?.turma_nome && (
            <p className="text-emerald-200 text-xs mt-2">
              {usuario.turma_nome} • {usuario.ano_letivo}
            </p>
          )}
        </div>

        {/* Banner Informativo Roxo */}
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-start gap-3 text-purple-900 text-sm">
          <svg className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>
            Somente alunos PNEE (com atendimento TAI) podem solicitar Centros de Aprendizagem. As disciplinas listadas abaixo correspondem ao seu curso e ano letivo — você só pode solicitar CA de matérias da sua grade.
          </p>
        </div>

        {/* Card do Formulário */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {/* Seção Qual tipo de suporte você precisa? */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-4">
                Qual tipo de suporte você precisa? <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {opcoesSuporte.map((opcao) => (
                  <label
                    key={opcao.id}
                    className={`cursor-pointer border rounded-xl p-4 flex items-start gap-3 transition-all ${
                      suporte === opcao.id
                        ? 'border-purple-500 ring-1 ring-purple-500 bg-purple-50/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipoSuporte"
                      value={opcao.id}
                      checked={suporte === opcao.id}
                      onChange={() => setSuporte(opcao.id)}
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

            {/* Grid Disciplina e Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* Disciplina */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium text-gray-700">Disciplina</label>
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    ✓ disciplinas do seu curso
                  </span>
                </div>
                <select
                  value={disciplina}
                  onChange={(e) => setDisciplina(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
                  required
                >
                  <option value="">Selecione uma disciplina</option>
                  {disciplinas.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {disciplinas.length === 0 ? (
                  <p className="text-xs text-amber-600 mt-1">
                    Nenhuma disciplina encontrada. Faça logout e login novamente pelo SUAP para sincronizar suas matérias.
                  </p>
                ) : (
                  <p className="text-xs text-emerald-700 mt-1">
                    {disciplinas.length} disciplina(s) carregada(s) do SUAP
                  </p>
                )}
              </div>

              {/* Data Preferencial com Calendário */}
              <div className="md:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Data Preferencial (opcional)
                  </label>
                  {data && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        Selecionado: {data.split('-')[2]}/{data.split('-')[1]}/{data.split('-')[0]}
                      </span>
                      <button
                        type="button"
                        onClick={() => setData('')}
                        className="text-xs text-gray-400 hover:text-red-500 underline"
                      >
                        Limpar data
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Clique diretamente em um dia do calendário abaixo para definir sua data preferencial. Os feriados e seus agendamentos já aparecem destacados.
                </p>

                <CalendarioAtendimentos
                  agendamentos={agendamentos}
                  diaSelecionado={data || null}
                  onSelectDia={(diaIso) => setData(diaIso)}
                />
              </div>

            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descreva sua dúvida (opcional)
              </label>
              <textarea
                rows="3"
                placeholder="Informe detalhes para que o mediador possa se preparar adequadamente..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
                onChange={(e) => (setDesc(e.target.value))}
              ></textarea>
            </div>

            {/* Botões de Ação */}
            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                className="px-6 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!suporte || !disciplina}
                className="px-6 py-2.5 bg-[#8b3dff] text-white text-sm font-medium rounded-lg hover:bg-[#7a2eff] disabled:opacity-50 transition-colors shadow-sm"
              >
                Confirmar Solicitação
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default SolicitacaoTAI;

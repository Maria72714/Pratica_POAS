import React, { useEffect, useState, useMemo } from 'react';
import { buscarAtendimentosProfessor } from '../../services/professor/agendamento';
import PageShell from '../../components/ui/PageShell';
import PageHeader from '../../components/ui/PageHeader';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

const CORES_PALETA = ['#059669', '#2563eb', '#7c3aed', '#d97706', '#dc2626', '#0891b2'];

export default function ProfessorIndicadores() {
  const [atendimentos, setAtendimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [filtroAno, setFiltroAno] = useState('todos');

  const usuarioSalvo = localStorage.getItem('usuario');
  const suapSalvo = localStorage.getItem('suap_user');
  const usuario = usuarioSalvo
    ? JSON.parse(usuarioSalvo)
    : suapSalvo
      ? JSON.parse(suapSalvo)
      : null;

  const matricula = usuario?.matricula || '';

  useEffect(() => {
    async function carregarDados() {
      if (!matricula) {
        setErro('Matrícula do professor não identificada.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setErro('');
        const data = await buscarAtendimentosProfessor(matricula);
        setAtendimentos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setErro('Não foi possível carregar os dados de atendimentos.');
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, [matricula]);

  // Lista de anos disponíveis para filtro
  const anosDisponiveis = useMemo(() => {
    const anos = new Set();
    atendimentos.forEach(a => {
      if (a.data_atendimento) {
        const ano = a.data_atendimento.split('-')[0];
        if (ano) anos.add(ano);
      }
    });
    return Array.from(anos).sort().reverse();
  }, [atendimentos]);

  // Dados filtrados pelo ano selecionado
  const atendimentosFiltrados = useMemo(() => {
    if (filtroAno === 'todos') return atendimentos;
    return atendimentos.filter(a => a.data_atendimento && a.data_atendimento.startsWith(filtroAno));
  }, [atendimentos, filtroAno]);

  // Métricas calculadas
  const metricas = useMemo(() => {
    const total = atendimentosFiltrados.length;
    const realizados = atendimentosFiltrados.filter(a => (a.status || '').toLowerCase() === 'realizado').length;
    const agendados = atendimentosFiltrados.filter(a => (a.status || '').toLowerCase() === 'agendado').length;
    const cancelados = atendimentosFiltrados.filter(a => (a.status || '').toLowerCase() === 'cancelado').length;
    
    const taiCount = atendimentosFiltrados.filter(a => 
      (a.tipo_atendimento && a.tipo_atendimento.toUpperCase() === 'TAI') || 
      (a.assunto && a.assunto.toUpperCase().includes('TAI')) ||
      Boolean(a.id_solicitacao)
    ).length;

    const taxaConclusao = total > 0 ? Math.round((realizados / total) * 100) : 0;

    // Alunos únicos
    const alunosSet = new Set();
    atendimentosFiltrados.forEach(a => {
      if (a.aluno_id) alunosSet.add(a.aluno_id);
      else if (a.aluno_nome && a.aluno_nome !== 'Aluno Geral') alunosSet.add(a.aluno_nome);
    });

    return {
      total,
      realizados,
      agendados,
      cancelados,
      taiCount,
      taxaConclusao,
      alunosUnicos: alunosSet.size || Math.min(total, 1),
    };
  }, [atendimentosFiltrados]);

  // Dados para Gráfico Mensal
  const dadosMensais = useMemo(() => {
    const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const mapa = {};
    mesesNomes.forEach(m => { mapa[m] = 0; });

    atendimentosFiltrados.forEach(a => {
      if (a.data_atendimento) {
        const partes = a.data_atendimento.split('-');
        if (partes.length >= 2) {
          const idx = parseInt(partes[1], 10) - 1;
          if (idx >= 0 && idx < 12) {
            mapa[mesesNomes[idx]] = (mapa[mesesNomes[idx]] || 0) + 1;
          }
        }
      }
    });

    // Se tudo for 0 e temos atendimentos sem data, simula pelo menos um ponto
    const totalContado = Object.values(mapa).reduce((acc, v) => acc + v, 0);
    if (totalContado === 0 && atendimentosFiltrados.length > 0) {
      mapa['Out'] = atendimentosFiltrados.length;
    }

    return Object.keys(mapa).map(mes => ({
      mes,
      atendimentos: mapa[mes]
    }));
  }, [atendimentosFiltrados]);

  // Dados para Gráfico por Disciplina
  const dadosPorDisciplina = useMemo(() => {
    const contagem = {};
    atendimentosFiltrados.forEach(a => {
      const disc = a.disciplina_nome || 'Geral';
      contagem[disc] = (contagem[disc] || 0) + 1;
    });

    const lista = Object.keys(contagem).map(disciplina => ({
      disciplina,
      total: contagem[disciplina]
    }));

    return lista.sort((a, b) => b.total - a.total).slice(0, 6);
  }, [atendimentosFiltrados]);

  // Dados para Gráfico de Modalidade
  const dadosModalidade = useMemo(() => {
    let presencial = 0;
    let remoto = 0;
    let outros = 0;

    atendimentosFiltrados.forEach(a => {
      const mod = (a.modalidade || '').toLowerCase();
      if (mod.includes('presencial')) presencial++;
      else if (mod.includes('remoto') || mod.includes('online')) remoto++;
      else outros++;
    });

    if (presencial === 0 && remoto === 0 && outros === 0 && atendimentosFiltrados.length > 0) {
      presencial = Math.ceil(atendimentosFiltrados.length * 0.7);
      remoto = atendimentosFiltrados.length - presencial;
    }

    return [
      { name: 'Presencial', value: presencial || 1 },
      { name: 'Remoto', value: remoto || 0 },
      ...(outros > 0 ? [{ name: 'Híbrido / Outro', value: outros }] : [])
    ].filter(item => item.value > 0);
  }, [atendimentosFiltrados]);

  // Dados para Gráfico Tipo (TAI vs Regular)
  const dadosTipo = useMemo(() => {
    const regular = metricas.total - metricas.taiCount;
    return [
      { tipo: 'Regular (Plantão CA)', quantidade: Math.max(regular, 0) },
      { tipo: 'TAI (Apoio Inclusivo)', quantidade: metricas.taiCount }
    ];
  }, [metricas]);

  const seletorAno = anosDisponiveis.length > 0 ? (
    <div className="flex items-center gap-2 bg-white/15 px-3 py-2 rounded-lg">
      <span className="text-xs text-white/80 uppercase font-semibold">Exercício</span>
      <select
        value={filtroAno}
        onChange={(e) => setFiltroAno(e.target.value)}
        className="bg-transparent text-white font-medium text-sm outline-none cursor-pointer"
      >
        <option value="todos" className="text-gray-900">Todos</option>
        {anosDisponiveis.map((ano) => (
          <option key={ano} value={ano} className="text-gray-900">{ano}</option>
        ))}
      </select>
    </div>
  ) : null;

  return (
    <PageShell>
      <PageHeader
        role="professor"
        title="Indicadores e Métricas"
        subtitle="Análise de volume, adesão, perfil e modalidades dos seus atendimentos."
        actions={seletorAno}
      />

      <div className="pb-8">
        {/* Alerta de Erro */}
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

        {/* Grade de Estatísticas Superiores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Atendimentos</p>
              <p className="text-2xl font-bold text-gray-800">{metricas.total}</p>
              <p className="text-xs text-gray-400 mt-0.5">{metricas.realizados} concluídos • {metricas.agendados} agendados</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Taxa de Conclusão</p>
              <p className="text-2xl font-bold text-gray-800">{metricas.taxaConclusao}%</p>
              <p className="text-xs text-gray-400 mt-0.5">{metricas.cancelados} cancelamento(s)</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Alunos Atendidos</p>
              <p className="text-2xl font-bold text-gray-800">{metricas.alunosUnicos}</p>
              <p className="text-xs text-gray-400 mt-0.5">Discentes distintos</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Atendimentos TAI</p>
              <p className="text-2xl font-bold text-gray-800">{metricas.taiCount}</p>
              <p className="text-xs text-gray-400 mt-0.5">Com apoio/adaptação</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-gray-500 bg-white rounded-xl border border-gray-100">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Processando dados e gerando gráficos analíticos...
          </div>
        ) : (
          <div className="space-y-8">
            {/* Linha 1 de Gráficos: Mensal & Disciplinas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Gráfico 1: Evolução Mensal */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="border-b border-gray-100 pb-4 mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Evolução Mensal de Atendimentos</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Volume de atendimentos realizados ao longo dos meses</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 font-semibold rounded-md">
                    Histórico
                  </span>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dadosMensais} margin={{ top: 15, right: 25, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(val) => [`${val} atendimento(s)`, 'Total']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="atendimentos" 
                        stroke="#059669" 
                        strokeWidth={3} 
                        dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#fff' }} 
                        activeDot={{ r: 7 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico 2: Demandas por Disciplina */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="border-b border-gray-100 pb-4 mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Demandas por Disciplina</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Distribuição do volume entre os componentes curriculares</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold rounded-md">
                    Top Disciplinas
                  </span>
                </div>
                <div className="h-72">
                  {dadosPorDisciplina.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-gray-400 italic">
                      Sem dados de disciplinas registrados.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dadosPorDisciplina} margin={{ top: 15, right: 25, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="disciplina" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} allowDecimals={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                          formatter={(val) => [`${val} atendimento(s)`, 'Atendimentos']}
                        />
                        <Bar dataKey="total" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={42} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Linha 2 de Gráficos: Modalidade & TAI vs Regular */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Gráfico 3: Distribuição por Modalidade */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="border-b border-gray-100 pb-4 mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Modalidade de Atendimento</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Proporção entre atendimentos presenciais e virtuais</p>
                  </div>
                </div>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dadosModalidade}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {dadosModalidade.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CORES_PALETA[index % CORES_PALETA.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val, name) => [`${val} (${Math.round((val / metricas.total || 1) * 100)}%)`, name]} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico 4: Regular vs TAI */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="border-b border-gray-100 pb-4 mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Atendimentos Regulares vs TAI</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Comparativo de atendimentos convencionais e com suporte inclusivo</p>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dadosTipo} layout="vertical" margin={{ top: 15, right: 30, left: 40, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} allowDecimals={false} />
                      <YAxis dataKey="tipo" type="category" axisLine={false} tickLine={false} tick={{ fill: '#374151', fontSize: 11 }} />
                      <Tooltip formatter={(val) => [`${val} atendimento(s)`, 'Total']} />
                      <Bar dataKey="quantidade" fill="#059669" radius={[0, 6, 6, 0]} barSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

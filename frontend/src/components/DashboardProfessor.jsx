import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardProfessor = () => {
  const estatisticas = [
    { rotulo: 'Próximos Atendimentos', valor: '3', icone: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', corIcone: 'text-emerald-500', fundoIcone: 'bg-emerald-50' },
    { rotulo: 'Atendimentos (Mês)', valor: '36', icone: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', corIcone: 'text-blue-500', fundoIcone: 'bg-blue-50' },
    { rotulo: 'Alunos Atendidos', valor: '28', icone: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', corIcone: 'text-purple-500', fundoIcone: 'bg-purple-50' },
    { rotulo: 'Taxa de Presença', valor: '94%', icone: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', corIcone: 'text-amber-500', fundoIcone: 'bg-amber-50' },
  ];

  const dadosMensais = [
    { mes: 'Jan', valor: 8 },
    { mes: 'Fev', valor: 10 },
    { mes: 'Mar', valor: 9 },
    { mes: 'Abr', valor: 12 },
  ];

  const dadosDisciplina = [
    { disciplina: 'POO', valor: 18 },
    { disciplina: 'Estrutura de Dados', valor: 12 },
    { disciplina: 'Algoritmos', valor: 6 },
  ];

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      {/* Banner */}
      <div className="bg-emerald-900 text-white px-8 py-10 ml-6 mr-6 rounded-xl mb-8 mt-10">
        <h1 className="text-3xl font-bold mb-2">Área do Professor</h1>
        <p className="text-emerald-100 text-lg">
          Gerencie seus atendimentos e visualize estatísticas do CA
        </p>
      </div>

      <div className="p-8">
      {/* Grade de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {estatisticas.map((estatistica, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg ${estatistica.fundoIcone} flex items-center justify-center`}>
              <svg className={`w-6 h-6 ${estatistica.corIcone}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={estatistica.icone} />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">{estatistica.rotulo}</p>
              <p className="text-2xl font-bold text-gray-800">{estatistica.valor}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gráfico de Linha */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-8">
          <div className="p-6 pb-2 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">Meus Atendimentos por Mês</h2>
          </div>
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dadosMensais} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip cursor={{ stroke: '#f3f4f6', strokeWidth: 2 }} />
                <Line type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Barras */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-8">
          <div className="p-6 pb-2 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">Atendimentos por Disciplina</h2>
          </div>
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosDisciplina} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="disciplina" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f3f4f6'}} />
                <Bar dataKey="valor" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-8 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <button className="flex flex-col items-start p-4 border border-emerald-500 bg-emerald-50 rounded-lg text-left hover:bg-emerald-100 transition-colors">
            <span className="font-semibold text-emerald-700 mb-1">Criar Novo Atendimento</span>
            <span className="text-sm text-emerald-600/80">Adicione horários disponíveis para atendimento</span>
          </button>
          
          <button className="flex flex-col items-start p-4 border border-gray-100 rounded-lg text-left hover:bg-gray-50 transition-colors">
            <span className="font-semibold text-gray-800 mb-1">Gerenciar Horários</span>
            <span className="text-sm text-gray-500">Configure sua disponibilidade semanal</span>
          </button>
          
          <button className="flex flex-col items-start p-4 border border-gray-100 rounded-lg text-left hover:bg-gray-50 transition-colors">
            <span className="font-semibold text-gray-800 mb-1">Dashboard de Indicadores</span>
            <span className="text-sm text-gray-500">Visualize gráficos detalhados por disciplina e período</span>
          </button>
          
          <button className="flex flex-col items-start p-4 border border-gray-100 rounded-lg text-left hover:bg-gray-50 transition-colors">
            <span className="font-semibold text-gray-800 mb-1">Relatórios Mensais</span>
            <span className="text-sm text-gray-500">Gere relatórios de atendimentos realizados</span>
          </button>

        </div>
      </div>
      </div>
    </div>
  );
};

export default DashboardProfessor;

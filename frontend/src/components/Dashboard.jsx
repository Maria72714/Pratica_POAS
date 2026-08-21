import React from 'react';
// importando componentes do recharts para fazer o grafico de barras
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  // dados dos cards de estatisticas - depois isso vai vir da API do backend
  //mockss
  const stats = [
    { label: 'Atendimentos Este Mês', value: '8' },
    { label: 'Próximo Atendimento', value: 'Hoje' },
    { label: 'Disciplinas em Monitoria', value: '4' },
  ];

  // lista de agendamentos - mock por enquanto, quando a API estiver pronta vamos buscar os dados reais
  const appointments = [
    {
      subject: 'Programação Orientada a Objetos (TAL)',
      professor: 'Prof. Roberto Santos',
      time: '14:00 - 15:00',
      date: '28 Abr 2026',
      location: 'Sala CA-01',
      status: 'Confirmado',
      statusColor: 'bg-green-100 text-green-800', // cor do badge de status
    },
    {
      subject: 'Banco de Dados (TAL)',
      professor: 'Profa. Carla Oliveira',
      time: '10:00 - 11:00',
      date: '29 Abr 2026',
      location: 'Laboratório de Informática 2',
      status: 'Pendente',
      statusColor: 'bg-yellow-100 text-yellow-800',
    },
    {
      subject: 'Matemática Aplicada (TAI)',
      professor: 'Prof. Fernando Lima',
      time: '16:00 - 17:00',
      date: '30 Abr 2026',
      location: 'Sala CA-03 (Acessível)',
      status: 'Confirmado',
      statusColor: 'bg-green-100 text-green-800',
    },
  ];

  // dados do grafico de atendimentos por mes - mock por enquanto
  // o Recharts espera um array de objetos com as propriedades que vamos usar no grafico
  const monthlyData = [
    { month: 'Jan', atendimentos: 2 },
    { month: 'Fev', atendimentos: 1 },
    { month: 'Mar', atendimentos: 3 },
    { month: 'Abr', atendimentos: 4 },
  ];

  return (
    <div className="flex-1 bg-gray-50">
      {/* banner de boas vindas */}
      <div className="bg-emerald-900 text-white px-8 py-10 ml-6 mr-6 rounded-xl mb-8 mt-10">
        <h1 className="text-3xl font-bold mb-2">Bem-vindo ao Centro de Aprendizagem</h1>
        <p className="text-emerald-100 text-lg">
          Agende atendimentos com monitores e acompanhe seu desenvolvimento acadêmico
        </p>
      </div>

      <div className="p-8">
        {/* cards com as estatisticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* o map() percorre o array stats e renderiza um card para cada item */}
          {/* o key={index} é obrigatorio no React para identificar cada elemento na lista */}
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div>
                <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                <p className={`text-4xl font-bold mt-2 ${stat.value === 'Hoje' ? 'text-emerald-600' : 'text-gray-800'}`}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* secao de agendamentos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">Meus Agendamentos</h2>
            <button
              onClick={() => window.location.href = "/solicitar-atendimento"}
              className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
>
              Solicitar Novo Atendimento
            </button>
          </div>

          {/* lista de agendamentos */}
          <div className="p-6 space-y-4">
            {/* percorrendo o array de agendamentos com map() */}
            {/* cada agendamento vira um card na tela */}
            {appointments.map((appointment, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-lg mb-1">
                      {appointment.subject}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      {appointment.professor}
                    </p>
                    <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {appointment.time}
                      </span>
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {appointment.date}
                      </span>
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {appointment.location}
                      </span>
                    </div>
                  </div>
                  {/* badge de status - a cor muda dependendo do status (confirmado/pendente) */}
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium ${appointment.statusColor}`}
                  >
                    {appointment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* grafico de atendimentos por mes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-8">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">Meus Atendimentos por Mês</h2>
          </div>
          <div className="p-6">
            {/* ResponsiveContainer faz o grafico responsivo (se adapta ao tamanho da tela) */}
            <ResponsiveContainer width="100%" height={300}>
              {/* BarChart é o componente principal do grafico de barras */}
              <BarChart data={monthlyData}>
                {/* CartesianGrid cria as linhas de fundo do grafico */}
                <CartesianGrid strokeDasharray="3 3" />
                {/* XAxis é o eixo X (horizontal) - mostra os meses */}
                <XAxis dataKey="month" />
                {/* YAxis é o eixo Y (vertical) - mostra os numeros */}
                <YAxis />
                {/* Tooltip mostra informacoes quando passa o mouse em cima da barra */}
                <Tooltip />
                {/* Bar é a barra do grafico - dataKey diz qual dado mostrar, fill é a cor*/}
                <Bar dataKey="atendimentos" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

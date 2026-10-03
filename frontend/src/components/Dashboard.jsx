import React from 'react';
// importando componentes do recharts para fazer o grafico de barras
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  // dados dos cards de estatisticas - depois isso vai vir da API do backend
  //mockss
  const stats = [
    { 
      label: 'Atendimentos Este Mês', 
      value: '8',
      icon: (
        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    { 
      label: 'Próximo Atendimento', 
      value: 'Hoje',
      icon: (
        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      label: 'Disciplinas em Monitoria', 
      value: '4',
      icon: (
        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
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
    <div className="flex-1 bg-gray-50 min-h-screen">
      {/* Banner de boas vindas - Responsivo */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white mx-4 sm:mx-6 rounded-xl mb-6 mt-4 lg:mt-10 p-6 lg:p-10">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
          Bem-vindo ao Centro de Aprendizagem
        </h1>
        <p className="text-emerald-100 text-sm sm:text-base lg:text-lg leading-relaxed">
          Agende atendimentos com monitores e acompanhe seu desenvolvimento acadêmico
        </p>
      </div>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Cards com as estatisticas - Grid responsivo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-4 lg:p-6 border border-gray-100 hover:shadow-md transition-all duration-200 hover:border-emerald-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-gray-600 text-xs sm:text-sm font-medium leading-tight mb-1">{stat.label}</p>
                  <p className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${stat.value === 'Hoje' ? 'text-emerald-600' : 'text-gray-800'}`}>
                    {stat.value}
                  </p>
                </div>
                <div className="flex-shrink-0 ml-4">
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Seção de agendamentos - Responsiva */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header responsivo */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b border-gray-100 gap-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Meus Agendamentos</h2>
            <button
              onClick={() => window.location.href = "/solicitar-atendimento"}
              className="w-full sm:w-auto bg-emerald-600 text-white px-4 sm:px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm sm:text-base"
            >
              Solicitar Novo Atendimento
            </button>
          </div>

          {/* Lista de agendamentos - Layout mobile-first */}
          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            {appointments.map((appointment, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-xl p-4 sm:p-5 hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 lg:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 text-base sm:text-lg mb-1 leading-tight truncate">
                          {appointment.subject}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3">
                          {appointment.professor}
                        </p>
                      </div>
                    </div>
                    
                    {/* Informações em mobile - Stack vertical */}
                    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 lg:gap-6 text-xs sm:text-sm text-gray-500 ml-5">
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{appointment.time}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
                        </svg>
                        <span>{appointment.date}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{appointment.location}</span>
                      </span>
                    </div>
                  </div>
                  
                  {/* Badge de status - Responsivo */}
                  <div className="flex justify-start lg:justify-end mt-2 lg:mt-0">
                    <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium ${appointment.statusColor} inline-block`}>
                      {appointment.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
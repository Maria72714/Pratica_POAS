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
      {/* Header Mobile com hambúrguer, logo e avatar */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        {/* Menu hambúrguer */}
        <button className="w-10 h-10 flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo central */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Direita com notificação e avatar */}
        <div className="flex items-center gap-3">
          <button className="relative">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">EM</span>
          </div>
        </div>
      </div>

      {/* Container Mobile */}
      <div className="lg:hidden p-4">
        {/* Banner de boas vindas - Mobile */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white rounded-2xl p-6 mb-6">
          <h1 className="text-xl font-bold mb-2">Bem-vindo, Eduardo!</h1>
          <p className="text-emerald-100 text-sm leading-relaxed">
            Agende atendimentos e acompanhe seu desenvolvimento acadêmico.
          </p>
        </div>

        {/* Cards de estatísticas em grid 2x2 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-600 text-xs font-medium mb-1">Atendimentos Agendados</p>
            <p className="text-2xl font-bold text-gray-800">3</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-600 text-xs font-medium mb-1">Próximo Atendimento</p>
            <p className="text-xl font-bold text-emerald-600">22/12/2026</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-600 text-xs font-medium mb-1">Disciplinas</p>
            <p className="text-2xl font-bold text-gray-800">1</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            {/* Espaço vazio ou outro card */}
          </div>
        </div>

        {/* Card de CAs disponíveis */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-emerald-800 text-sm mb-1">CAs disponíveis para inscrição</h3>
              <p className="text-emerald-700 text-xs leading-relaxed mb-3">
                Veja os atendimentos abertos pelos seus professores.
              </p>
              <button className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
                Ver CAs
              </button>
            </div>
          </div>
        </div>

        {/* Seção Meus Agendamentos */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Meus Agendamentos</h2>
          
          {/* Lista de agendamentos em cards mobile */}
          {appointments.map((appointment, index) => (
            <div key={index} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800 text-sm leading-tight flex-1 pr-2">
                  {appointment.subject}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${appointment.statusColor}`}>
                  {appointment.status}
                </span>
              </div>
              <p className="text-gray-600 text-xs mb-3">{appointment.professor}</p>
              
              <div className="space-y-1 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{appointment.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{appointment.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{appointment.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Layout Desktop - igual ao original */}
      <div className="hidden lg:block">
        {/* Banner de boas vindas - Responsivo */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white mx-6 rounded-xl mb-8 mt-10 p-10">
          <h1 className="text-3xl font-bold mb-2">
            Bem-vindo ao Centro de Aprendizagem
          </h1>
          <p className="text-emerald-100 text-lg leading-relaxed">
            Agende atendimentos com monitores e acompanhe seu desenvolvimento acadêmico
          </p>
        </div>

        <div className="p-8">
          {/* Cards com as estatisticas - Grid responsivo otimizado */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-200 hover:border-emerald-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-600 text-sm font-medium leading-tight mb-1 truncate">{stat.label}</p>
                    <p className={`text-4xl font-bold ${stat.value === 'Hoje' ? 'text-emerald-600' : 'text-gray-800'}`}>
                      {stat.value}
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                      {React.cloneElement(stat.icon, { 
                        className: "w-6 h-6 text-emerald-600" 
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Seção de agendamentos - Responsiva */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header responsivo */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">Meus Agendamentos</h2>
              <button
                onClick={() => window.location.href = "/solicitar-atendimento"}
                className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                Solicitar Novo Atendimento
              </button>
            </div>

            {/* Lista de agendamentos - Layout desktop */}
            <div className="p-6 space-y-4">
              {appointments.map((appointment, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 text-lg mb-1 leading-tight truncate">
                            {appointment.subject}
                          </h3>
                          <p className="text-gray-600 text-sm mb-3">
                            {appointment.professor}
                          </p>
                        </div>
                      </div>
                      
                      {/* Informações em desktop */}
                      <div className="flex items-center gap-6 text-sm text-gray-500 ml-5">
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{appointment.time}</span>
                        </span>
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
                    
                    {/* Badge de status - Desktop */}
                    <div className="flex justify-end">
                      <span className={`px-4 py-2 rounded-full text-sm font-medium ${appointment.statusColor} inline-block`}>
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
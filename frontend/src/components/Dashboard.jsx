import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const stats = [
    { 
      label: 'Atendimentos Agendados', 
      value: '3',
    },
    { 
      label: 'Próximo Atendimento', 
      value: '22/12/2026',
    },
    { 
      label: 'Disciplinas', 
      value: '1',
    },
  ];

  const appointments = [
    {
      subject: 'Programação Orientada a Objetos (TAL)',
      professor: 'Prof. Roberto Santos',
      time: '14:00 - 15:00',
      date: '28 Abr 2026',
      location: 'Sala CA-01',
      status: 'Confirmado',
      statusColor: 'bg-green-100 text-green-800',
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

  const monthlyData = [
    { month: 'Jan', atendimentos: 2 },
    { month: 'Fev', atendimentos: 1 },
    { month: 'Mar', atendimentos: 3 },
    { month: 'Abr', atendimentos: 4 },
  ];

  return (
    <div className="flex-1 bg-gray-50 min-h-screen">
      {/* Banner de boas vindas - Responsivo */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white mx-2 sm:mx-4 lg:mx-6 rounded-lg sm:rounded-xl mb-3 sm:mb-4 lg:mb-6 mt-2 sm:mt-3 lg:mt-4 p-4 sm:p-6 lg:p-8">
        <h1 className="text-base sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-2">
          Bem-vindo, Eduardo!
        </h1>
        <p className="text-emerald-100 text-xs sm:text-sm lg:text-base leading-relaxed">
          Agende atendimentos e acompanhe seu desenvolvimento acadêmico.
        </p>
      </div>

      <div className="p-2 sm:p-3 lg:p-6">
        {/* Cards com as estatisticas - Grid responsivo */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4 lg:mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 lg:p-4 border border-gray-100">
              <div className="flex flex-col gap-1">
                <p className="text-gray-600 text-xs font-medium leading-tight">{stat.label}</p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Seção CAs disponíveis */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h3 className="font-semibold text-emerald-900 text-sm mb-1">CAs disponíveis para inscrição</h3>
            <p className="text-emerald-700 text-xs mb-3">Veja os atendimentos abertos pelos seus professores.</p>
            <button className="bg-emerald-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-emerald-700 transition-colors">
              Ver CAs
            </button>
          </div>
        </div>

        {/* Seção de agendamentos - Responsiva */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header responsivo */}
          <div className="p-3 sm:p-4 lg:p-4 border-b border-gray-100">
            <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-800">Meus Agendamentos</h2>
          </div>

          {/* Lista de agendamentos - Layout mobile-first */}
          <div className="p-3 sm:p-4 lg:p-4 space-y-2 sm:space-y-3">
            {appointments.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-6">Nenhum agendamento no momento</p>
            ) : (
              appointments.map((appointment, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white hover:shadow-sm transition-shadow"
                >
                  <div className="flex flex-col gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-800 text-xs sm:text-sm mb-1">
                        {appointment.subject}
                      </h3>
                      <p className="text-gray-600 text-xs mb-2">
                        {appointment.professor}
                      </p>
                    </div>
                    
                    {/* Informações em 2 colunas no mobile */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{appointment.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{appointment.date}</span>
                      </div>
                      <div className="flex items-center gap-1 col-span-2">
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span className="truncate">{appointment.location}</span>
                      </div>
                    </div>

                    {/* Badge de status */}
                    <div className="flex justify-start pt-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${appointment.statusColor}`}>
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

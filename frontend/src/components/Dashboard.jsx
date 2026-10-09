import React from 'react';
import { buscarAtendimentos } from '../services/agendamento';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CardEstatisticas from './CardEstatisticas';
import CardAgendamento from './CardAgendamento';

const Dashboard = () => {
  const userName = (() => {
    try {
      const storedUser = JSON.parse(
        localStorage.getItem('suap_user') ||
        localStorage.getItem('usuario') ||
        localStorage.getItem('user') ||
        'null'
      );
      return storedUser?.nome || storedUser?.name || 'usuário';
    } catch {
      return 'usuário';
    }
  })();

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
          Bem-vindo, {userName}!
        </h1>
        <p className="text-emerald-100 text-xs sm:text-sm lg:text-base leading-relaxed">
          Agende atendimentos e acompanhe seu desenvolvimento acadêmico.
        </p>
      </div>

      <div className="p-2 sm:p-3 lg:p-6">
        {/* Cards com as estatisticas - Grid responsivo */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4 lg:mb-6">
            {
            stats.map((stat, index) => (
              <CardEstatisticas stat={stat} index={index}/>
            ))
          }
        </div>


        {/* Seção de agendamentos - Responsiva */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header responsivo */}
          <div className="p-3 sm:p-4 lg:p-4 border-b border-gray-100">
            <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-800">Meus Agendamentos</h2>
          </div>

          {/* Componente para Listagem de agendamentos - Layout mobile-first */}
          <div className="p-3 sm:p-4 lg:p-4 space-y-2 sm:space-y-3">
            {
            appointments.map((appointment, index) => (
              <CardAgendamento
                key={appointment.subject}
                appointment={appointment}
                index={index}
              />
            ))}
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

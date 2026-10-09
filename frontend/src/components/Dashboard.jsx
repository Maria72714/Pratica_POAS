import React, { useEffect, useState } from 'react';
import { buscarAtendimentos } from '../services/agendamento';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CardEstatisticas from './CardEstatisticas';
import CardAgendamento from './CardAgendamento';

const Dashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const stats = [
    {
    titulo: 'Meus agendamentos',
    valor: appointments.length,
    },
  ];  
  useEffect(() => {
  async function carregarAgendamentos() {
    try {
      setErro('');

      const usuarioSalvo = localStorage.getItem('usuario');
      const suapSalvo = localStorage.getItem('suap_user');

      const usuario = usuarioSalvo
        ? JSON.parse(usuarioSalvo)
        : suapSalvo
          ? JSON.parse(suapSalvo)
          : null;

      if (!usuario?.matricula) {
        setErro('Matrícula do aluno não encontrada.');
        return;
      }

      const dados = await buscarAtendimentos(usuario.matricula);
      console.log(
        "Dados completos do atendimento:",
        JSON.stringify(dados, null, 2)
      );
      setAppointments(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      setErro('Não foi possível carregar os agendamentos.');
    } finally {
      setLoading(false);
    }
  }

  carregarAgendamentos();
}, []);

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
          Bem-vindo!
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

          {/* Componente para Listagem de agendamentos - Layout mobile-first */}
          <div className="p-3 sm:p-4">
          {loading ? (
            <p className="text-gray-500 text-sm">
              Carregando agendamentos...
            </p>
          ) : erro ? (
            <p className="text-red-600 text-sm">
              {erro}
            </p>
          ) : appointments.length === 0 ? (
            <p className="text-gray-500 text-sm">
              Você ainda não possui agendamentos.
            </p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {appointments.map((atendimento) => (
                <CardAgendamento
                  key={atendimento.id}
                  atendimento={atendimento}
                />
              ))}
            </div>
          )}
        </div>
          
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

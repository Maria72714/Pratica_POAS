import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../ui/PageShell';
import PageHeader from '../ui/PageHeader';

const DashboardProfessor = () => {
  const navigate = useNavigate();

  return (
    <PageShell>
      <PageHeader
        role="professor"
        title="Área do Professor"
        subtitle="Gerencie seus atendimentos TAI e configure sua disponibilidade."
      />

      <div className="space-y-6">
        {/* Menu Principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <button 
            onClick={() => navigate('/professor/atendimentos')}
            className="flex flex-col items-start p-6 border border-emerald-200 bg-emerald-50 text-emerald-900 rounded-xl text-left hover:bg-emerald-100 transition-colors shadow-sm"
          >
            <span className="font-bold text-lg">Meus Atendimentos</span>
            <span className="text-sm text-emerald-700 mt-1">Visualize e gerencie todos os seus atendimentos TAI</span>
          </button>

          <button 
            onClick={() => navigate('/professor/atendimentos/novo')}
            className="flex flex-col items-start p-6 border border-emerald-600 bg-emerald-700 text-white rounded-xl text-left hover:bg-emerald-800 transition-colors shadow-sm"
          >
            <span className="font-bold text-lg">Novo Atendimento</span>
            <span className="text-sm text-emerald-100 mt-1">Crie um novo atendimento para alunos</span>
          </button>

          <button 
            onClick={() => navigate('/professor/horarios')}
            className="flex flex-col items-start p-6 border border-blue-200 bg-blue-50 text-blue-900 rounded-xl text-left hover:bg-blue-100 transition-colors shadow-sm"
          >
            <span className="font-bold text-lg">Horários Disponíveis</span>
            <span className="text-sm text-blue-700 mt-1">Configure sua disponibilidade semanal</span>
          </button>

          <button 
            onClick={() => navigate('/professor/completar-perfil')}
            className="flex flex-col items-start p-6 border border-purple-200 bg-purple-50 text-purple-900 rounded-xl text-left hover:bg-purple-100 transition-colors shadow-sm"
          >
            <span className="font-bold text-lg">Minhas Disciplinas</span>
            <span className="text-sm text-purple-700 mt-1">Vincule as disciplinas e turmas que você leciona</span>
          </button>

          <button 
            onClick={() => navigate('/professor/relatorios')}
            className="flex flex-col items-start p-6 border border-amber-200 bg-amber-50 text-amber-900 rounded-xl text-left hover:bg-amber-100 transition-colors shadow-sm"
          >
            <span className="font-bold text-lg">Relatórios</span>
            <span className="text-sm text-amber-700 mt-1">Gere relatórios de atendimentos realizados</span>
          </button>

        </div>

        {/* Informações Úteis */}
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-6">
          <h3 className="font-bold text-emerald-900 mb-3">Bem-vindo ao Sistema pratiCA</h3>
          <ul className="space-y-2 text-sm text-emerald-800">
            <li>Crie atendimentos presenciais ou remotos para os alunos</li>
            <li>Configure seus horários disponíveis para atendimento</li>
            <li>Gerencie solicitações TAI enviadas por alunos e mediadores</li>
            <li>Acompanhe relatórios de atendimentos realizados</li>
          </ul>
        </div>
      </div>
    </PageShell>
  );
};

export default DashboardProfessor;

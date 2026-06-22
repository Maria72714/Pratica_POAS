import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import DashboardProfessor from './components/DashboardProfessor';
import SolicitacaoAtendimento from './components/SolicitacaoAtendimento';

function AppLayout({ children, isProfessor }) {
  // Configuração simples para demonstrar as rotas
  const professorMenu = [
    { icone: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", texto: "Início", link: "/professor" },
    { icone: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", texto: "Meus Atendimentos", link: "/professor" },
    { icone: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", texto: "Horários Disponíveis", link: "/professor" },
    { icone: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", texto: "Dashboard de<br/>Indicadores", link: "/professor" },
    { icone: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", texto: "Relatórios", link: "/professor" }
  ];

  const alunoMenu = [
    { icone: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", texto: "Início", link: "/" },
    { icone: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", texto: "Meus Agendamentos", link: "/" },
    { icone: "M12 6v6m0 0v6m0-6h6m-6 0H6", texto: "Solicitar Atendimento", link: "/solicitar-atendimento" },
    { icone: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", texto: "Histórico", link: "/" }
  ];

  const professorInfo = { nome: "Prof. Dr. Roberto Santos", descricao: "Professor • Mat. 198765", iniciais: "PD", corAvatar: "bg-emerald-700" };
  const alunoInfo = { nome: "Ana Carolina Silva", descricao: "Aluno - Mat. 20231145678", iniciais: "AC", corAvatar: "bg-emerald-600" };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar itensMenu={isProfessor ? professorMenu : alunoMenu} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header usuario={isProfessor ? professorInfo : alunoInfo} />
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas do Aluno */}
        <Route path="/" element={<AppLayout isProfessor={false}><Dashboard /></AppLayout>} />
        <Route path="/solicitar-atendimento" element={<AppLayout isProfessor={false}><SolicitacaoAtendimento /></AppLayout>} />
        
        {/* Rotas do Professor */}
        <Route path="/professor" element={<AppLayout isProfessor={true}><DashboardProfessor /></AppLayout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

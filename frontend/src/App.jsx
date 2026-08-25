import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import DashboardProfessor from './components/DashboardProfessor';
import SolicitacaoAtendimento from './components/SolicitacaoAtendimento';
import Agendamentos from './pages/Agendamentos';
import Historico from './pages/historico';
import Login from './pages/Login';
import Callback from './pages/Callback';
import DashboardAuth from './pages/DashboardAuth';

// Novos componentes de Formulário Pós-Login e Admin TAI
import CompletarPerfil from './pages/CompletarPerfil';
import AdminAprovacoesTAI from './pages/AdminAprovacoesTAI';

import { AuthProvider } from './context/AuthContext';

function AppLayout({ children, isProfessor }) {
  const navigate = useNavigate();
  const dados = localStorage.getItem('usuario');
  const usuarioLogado = dados ? JSON.parse(dados) : null;

  React.useEffect(() => {
    if (!dados) {
      navigate('/login');
    } else if (usuarioLogado && usuarioLogado.perfil_preenchido === false) {
      navigate('/completar-perfil');
    }
  }, [dados, usuarioLogado, navigate]);

  if (!dados) return null;

  const professorMenu = [
    { icone: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", texto: "Início", link: "/professor" },
    { icone: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", texto: "Meus Atendimentos", link: "/professor" },
    { icone: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", texto: "Horários Disponíveis", link: "/professor" },
    { icone: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", texto: "Dashboard de<br/>Indicadores", link: "/professor" },
    { icone: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", texto: "Relatórios", link: "/professor" }
  ];

  const isApprovedTai = usuarioLogado?.tai_status === 'APROVADO';

  const alunoMenu = [
    { icone: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", texto: "Início", link: "/" },
    { icone: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", texto: "Meus Agendamentos", link: "/Agendamentos" },
    ...(isApprovedTai ? [{ icone: "M12 6v6m0 0v6m0-6h6m-6 0H6", texto: "Solicitar Atendimento TAI", link: "/solicitar-atendimento" }] : []),
    { icone: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", texto: "Histórico", link: "/historico" }
  ];

  const iniciais = usuarioLogado?.nome 
    ? usuarioLogado.nome.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() 
    : 'U';

  const usuarioInfo = {
    nome: usuarioLogado?.nome || (isProfessor ? "Professor" : "Aluno"),
    descricao: `${usuarioLogado?.tipo_vinculo || (isProfessor ? 'Professor' : 'Aluno')} • Mat. ${usuarioLogado?.matricula || ''}`,
    iniciais: iniciais,
    corAvatar: isProfessor ? "bg-emerald-700" : "bg-emerald-600",
    foto: usuarioLogado?.foto,
    email: usuarioLogado?.email_escolar || usuarioLogado?.email
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar itensMenu={isProfessor ? professorMenu : alunoMenu} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header usuario={usuarioInfo} />
        
        {/* Banner de status TAI pendente para alunos */}
        {!isProfessor && usuarioLogado?.tai_status === 'PENDENTE' && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs font-medium text-amber-900 shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="text-amber-600 font-bold">⏳ Info:</span>
              <span>
                Sua solicitação de Aluno TAI com envio de laudo está em <strong>análise pelo Administrador</strong>. Enquanto isso, você pode utilizar a plataforma normalmente como Aluno TAL.
              </span>
            </div>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── OAuth2 SUAP & Form Pós-Login ───────────────────────────── */}
          <Route path="/login"            element={<Login />} />
          <Route path="/callback"         element={<Callback />} />
          <Route path="/dashboard"        element={<DashboardAuth />} />
          <Route path="/completar-perfil" element={<CompletarPerfil />} />

          {/* ── Painel de Aprovações do Admin TAI ───────────────────────── */}
          <Route path="/admin/aprovacoes-tai" element={<AppLayout isProfessor={false}><AdminAprovacoesTAI /></AppLayout>} />

          {/* ── Rotas do Aluno ───────────────────────────────────────────── */}
          <Route path="/" element={<AppLayout isProfessor={false}><Dashboard /></AppLayout>} />
          <Route path="/solicitar-atendimento" element={<AppLayout isProfessor={false}><SolicitacaoAtendimento /></AppLayout>} />
          <Route path="/historico" element={<AppLayout isProfessor={false}><Historico /></AppLayout>} />
          <Route path="/Agendamentos" element={<AppLayout isProfessor={false}><Agendamentos /></AppLayout>} />

          {/* ── Rotas do Professor ───────────────────────────────────────── */}
          <Route path="/professor" element={<AppLayout isProfessor={true}><DashboardProfessor /></AppLayout>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

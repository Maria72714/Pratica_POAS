import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import DashboardProfessor from './components/DashboardProfessor';
import DashboardMediador from './components/DashboardMediador';
import SolicitacaoAtendimento from './components/SolicitacaoAtendimento';
import Agendamentos from './pages/Agendamentos';
import EditarSolicitacao from './components/Editarsolicitacao';
import Historico from './pages/Historico';
import Perfil from './pages/Perfil';
// ── Rotas de autenticação OAuth2 SUAP ────────────────────────────────────────
import Login from './pages/Login';
import Callback from './pages/Callback';
import DashboardAuth from './pages/DashboardAuth';
import ComplementacaoPerfil from './pages/ComplementacaoPerfil';
import ComplementacaoPerfilProfessor from './pages/ComplementacaoPerfilProfessor';
import SolicitacaoMediador from './pages/SolicitacaoMediador';

import { AuthProvider } from './context/AuthContext';
import { fetchPerfilAluno, salvarUsuarioLocal } from './services/api';

function AppLayout({ children, isProfessor = false, isMediador = false, requerTai = false }) {
  const navigate = useNavigate();
  const [usuarioLogado, setUsuarioLogado] = React.useState(() => {
    const dados = localStorage.getItem('usuario') || localStorage.getItem('suap_user');
    return dados ? JSON.parse(dados) : null;
  });

  const isMediadorUser = isMediador || usuarioLogado?.tipo === 'mediador';
  const isProfessorUser = isProfessor || usuarioLogado?.tipo === 'professor' || usuarioLogado?.tipo_vinculo === 'professor';

  React.useEffect(() => {
    if (!usuarioLogado) {
      navigate('/login');
      return;
    }

    const path = window.location.pathname;

    if (usuarioLogado.tipo === 'mediador' && !path.startsWith('/mediador') && path !== '/perfil') {
      navigate('/mediador');
      return;
    }

    if ((usuarioLogado.tipo === 'professor' || usuarioLogado.tipo_vinculo === 'professor') && !path.startsWith('/professor') && path !== '/perfil') {
      navigate('/professor');
      return;
    }

    const isAluno = usuarioLogado.tipo === 'aluno' || usuarioLogado.is_aluno || (!usuarioLogado.tipo && !usuarioLogado.tipo_vinculo);
    if (isAluno && usuarioLogado.perfil_completo === false) {
      navigate('/complementar-perfil');
      return;
    }

    if (requerTai && !usuarioLogado.necessidades_especiais) {
      navigate('/');
    }
  }, [usuarioLogado, navigate, isProfessor, isMediador, requerTai]);

  React.useEffect(() => {
    if (!usuarioLogado?.matricula || usuarioLogado?.foto) return;
    fetchPerfilAluno(usuarioLogado.matricula)
      .then((perfil) => {
        if (perfil.foto) {
          const atualizado = { ...usuarioLogado, ...perfil };
          salvarUsuarioLocal(atualizado);
          setUsuarioLogado(atualizado);
        }
      })
      .catch(() => { });
  }, [usuarioLogado]);

  if (!usuarioLogado) return null;

  const mediadorMenu = [
    { icone: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", texto: "Início", link: "/mediador" },
    { icone: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", texto: "Solicitações TAI", link: "/mediador/solicitacoes" },
    { icone: "M15 19a4 4 0 00-6 0m3-8a3 3 0 100-6 3 3 0 000 6zm7 8a7 7 0 00-14 0", texto: "Meu Perfil", link: "/perfil" }
  ];

  const professorMenu = [
    { icone: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", texto: "Início", link: "/professor" },
    { icone: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", texto: "Meus Atendimentos", link: "/professor" },
    { icone: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", texto: "Horários Disponíveis", link: "/professor" },
    { icone: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", texto: "Dashboard de<br/>Indicadores", link: "/professor" },
    { icone: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", texto: "Relatórios", link: "/professor" }
  ];

  const alunoMenu = [
    { icone: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", texto: "Início", link: "/" },
    { icone: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", texto: "Meus Agendamentos", link: "/Agendamentos" },
    ...(usuarioLogado?.necessidades_especiais ? [{ icone: "M12 6v6m0 0v6m0-6h6m-6 0H6", texto: "Solicitar Atendimento", link: "/solicitar-atendimento" }] : []),
    { icone: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", texto: "Histórico", link: "/historico" },
    { icone: "M15 19a4 4 0 00-6 0m3-8a3 3 0 100-6 3 3 0 000 6zm7 8a7 7 0 00-14 0", texto: "Meu Perfil", link: "/perfil" }
  ];

  const iniciais = usuarioLogado?.nome
    ? usuarioLogado.nome.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  const menuAtivo = isMediadorUser ? mediadorMenu : (isProfessorUser ? professorMenu : alunoMenu);
  const corAvatar = isMediadorUser ? "bg-purple-700" : (isProfessorUser ? "bg-emerald-700" : "bg-emerald-600");
  const papelTexto = isMediadorUser ? "Mediador" : (isProfessorUser ? "Professor" : "Aluno");

  const usuarioInfo = {
    nome: usuarioLogado?.nome || papelTexto,
    descricao: `${papelTexto}${usuarioLogado?.matricula ? ' • Mat. ' + usuarioLogado.matricula : ''}`,
    iniciais: iniciais,
    corAvatar: corAvatar,
    foto: usuarioLogado?.foto,
    email: usuarioLogado?.email
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar itensMenu={menuAtivo} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header usuario={usuarioInfo} />
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
          {/* ── OAuth2 SUAP ──────────────────────────────────────────────── */}
          <Route path="/login" element={<Login />} />
          <Route path="/callback" element={<Callback />} />
          <Route path="/complementar-perfil" element={<ComplementacaoPerfil />} />
          <Route path="/dashboard" element={<DashboardAuth />} />
          <Route path="/solicitar-mediador" element={<SolicitacaoMediador />} />

          {/* ── Rotas do Aluno ───────────────────────────────────────────── */}
          <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/solicitar-atendimento" element={<AppLayout requerTai={false}><SolicitacaoAtendimento /></AppLayout>} />
          <Route path="/historico" element={<AppLayout><Historico /></AppLayout>} />
          <Route path="/Agendamentos" element={<AppLayout><Agendamentos /></AppLayout>} />
          <Route path="/perfil" element={<AppLayout><Perfil /></AppLayout>} />
          <Route path="/solicitacoes/editar/:id" element={<AppLayout><EditarSolicitacao /></AppLayout>} />

          {/* ── Rotas do Mediador ───────────────────────────────────────── */}
          <Route path="/mediador" element={<AppLayout isMediador={true}><DashboardMediador /></AppLayout>} />
          <Route path="/mediador/solicitacoes" element={<AppLayout isMediador={true}><DashboardMediador /></AppLayout>} />

          {/* ── Rotas do Professor ───────────────────────────────────────── */}
          <Route path="/professor" element={<AppLayout isProfessor={true}><DashboardProfessor /></AppLayout>} />
          <Route path="/professor/completar-perfil" element={<ComplementacaoPerfilProfessor />} />
          <Route path="/teste/professor/completar-perfil" element={<ComplementacaoPerfilProfessor />} />
          <Route path="/preview/professor" element={
            <div className="flex min-h-screen bg-gray-50">
              <Sidebar itensMenu={[
                { icone: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 01-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", texto: "Início", link: "/preview/professor" },
                { icone: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", texto: "Meus Atendimentos", link: "/preview/professor" },
                { icone: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", texto: "Horários Disponíveis", link: "/preview/professor" },
                { icone: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", texto: "Indicadores", link: "/preview/professor" },
                { icone: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", texto: "Relatórios", link: "/preview/professor" }
              ]} />
              <div className="flex-1 flex flex-col overflow-hidden">
                <Header usuario={{ nome: "Prof. Preview", descricao: "Professor • Visualização", iniciais: "PP", corAvatar: "bg-emerald-700" }} />
                <DashboardProfessor />
              </div>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

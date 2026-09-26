/**
 * Login.jsx — Página de login com design dividido em dois painéis
 * Painel esquerdo: informações sobre a plataforma pratiCA
 * Painel direito: formulário de autenticação via SUAP
 */

import React, { useState } from 'react';
import { login } from '../services/suapAuth';
import { loginLocal } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';

const Login = () => {
  const { isLogged, loading, setAuthenticatedUser } = useAuth();
  const navigate = useNavigate();

  const [showDevLogin, setShowDevLogin] = useState(false);
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [devLoading, setDevLoading] = useState(false);
  const [devError, setDevError] = useState('');

  if (!loading && isLogged) {
    return <Navigate to="/" replace />;
  }

  async function handleDevLogin(e) {
    e.preventDefault();
    setDevError('');
    setDevLoading(true);

    try {
      const data = await loginLocal(matricula, senha);

      const userData = {
        id: data.matricula,
        matricula: data.matricula,
        nome: data.nome,
        email: data.email,
        foto: null,
        campus: 'Caicó',
        tipo: data.tipo_usuario,
        tipoOriginal: data.tipo_usuario,
        necessidades_especiais: data.necessidades_especiais ?? false,
        curso: data.curso ?? null,
        id_turma: data.id_turma ?? null,
      };

      localStorage.setItem('suap_user', JSON.stringify(userData));
      localStorage.setItem('suap_access_token', 'dev-local');
      localStorage.setItem('suap_token_expiry', String(Date.now() + 24 * 60 * 60 * 1000));

      setAuthenticatedUser(userData);
      navigate(data.tipo_usuario === 'professor' ? '/professor' : '/', { replace: true });
    } catch (err) {
      setDevError(err.message || 'Erro ao fazer login');
    } finally {
      setDevLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 flex flex-col items-center justify-center p-4 relative">

      {/* Container principal com cantos arredondados */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row relative z-10">

        {/* Painel Esquerdo - Verde escuro */}
        <div className="lg:w-1/2 bg-gradient-to-br from-emerald-800 to-emerald-900 p-10 lg:p-14 flex flex-col justify-between">

          {/* Logo */}
          <div className="flex items-center gap-4 mb-8">
            <img
              src="/images/logo_branca_pratica_vetorizada.png"
              alt="pratiCA"
              className="h-14 w-auto"
            />
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">pratiCA</h1>
              <p className="text-emerald-200 text-sm font-medium">Gerenciamento de CA</p>
            </div>
          </div>

          {/* Mensagem de boas-vindas */}
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
              Bem-vindo(a) de volta!
            </h2>
            <p className="text-emerald-100 text-lg leading-relaxed">
              Plataforma de gerenciamento de Centro de Aprendizagem do IFRN Campus Caicó.
              Acesse para gerenciar seus atendimentos, inscrições e disciplinas.
            </p>
          </div>

          {/* Lista de funcionalidades */}
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-600/50 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-white text-lg font-medium">Gerenciamento de Atendimentos</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-600/50 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-white text-lg font-medium">Inscrições em CAs</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-600/50 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="text-white text-lg font-medium">Suporte Inclusivo (TAI)</span>
            </div>
          </div>
        </div>

        {/* Painel Direito - Branco */}
        <div className="lg:w-1/2 bg-white p-10 lg:p-14 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Entrar na plataforma
            </h2>
            <p className="text-gray-500 text-base mb-8">
              Acesse com sua conta institucional do SUAP.
            </p>

            {/* Botão SUAP */}
            <button
              onClick={login}
              className="w-full flex items-center justify-center gap-3 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 group mb-6"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Entrar com SUAP</span>
              <svg className="w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Box informativo */}
            <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100 mb-6">
              <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <p className="text-sm text-emerald-800 leading-relaxed">
                Use sua <strong>matrícula</strong>, <strong>nome de usuário ou email</strong>
                e sua <strong>senha</strong>. O sistema detectará automaticamente seu tipo de usuário.
              </p>
            </div>

            {/* Divider Login Local (Dev) */}
            <div className="relative flex py-2 items-center my-2">
              <div className="flex-grow border-t border-gray-200"></div>
              <button
                type="button"
                onClick={() => setShowDevLogin(!showDevLogin)}
                className="flex-shrink mx-4 flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-700 font-medium transition-colors"
              >
                <span>Login Local</span>
                <svg className={`w-3.5 h-3.5 transition-transform ${showDevLogin ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* Form de dev apenas se showDevLogin for true */}
            {showDevLogin && (
              <div className="space-y-4 mb-4 pt-2">
                <form onSubmit={handleDevLogin} className="space-y-3">
                  {devError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-2xl text-center">
                      {devError}
                    </div>
                  )}

                  <div>
                    <input
                      type="text"
                      value={matricula}
                      onChange={(e) => setMatricula(e.target.value)}
                      placeholder="Matrícula, Nome de Usuário ou Email"
                      className="w-full px-5 py-3.5 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder-gray-400 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <input
                      type="password"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="Senha"
                      className="w-full px-5 py-3.5 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder-gray-400 transition-all"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={devLoading}
                    className="w-full py-3.5 px-6 bg-[#212b36] hover:bg-[#161c24] active:bg-[#0f131a] text-white font-medium text-sm rounded-2xl transition-all duration-200 shadow-sm flex items-center justify-center gap-2"
                  >
                    {devLoading ? 'Entrando...' : 'Entrar'}
                  </button>

                  <p className="text-center text-xs text-gray-400 pt-1">
                    Senha padrão dos usuários de teste: <span className="font-bold text-gray-500">123456</span>
                  </p>
                </form>
              </div>
            )}

            {/* Links sempre visíveis abaixo do Login Local (Dev) */}
            <div className="flex flex-col items-center gap-2.5 my-3">
              <button
                type="button"
                onClick={() => {
                  setShowDevLogin(true);
                  setMatricula('admin');
                  setSenha('123456');
                }}
                className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors py-1"
              >
                <svg className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Acesso Administrativo</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/solicitar-mediador')}
                className="flex items-center justify-center gap-2 text-xs text-gray-600 hover:text-emerald-700 transition-colors py-1"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span>Quero ser Mediador</span>
              </button>
            </div>

            {/* Links SUAP */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-400 font-medium mb-4 text-center">SUAP IFRN</p>
              <div className="flex justify-center gap-6">
                <a href="https://suap.ifrn.edu.br" target="_blank" rel="noopener noreferrer"
                  className="text-xs text-gray-400 hover:text-emerald-600 transition-colors">Portal SUAP</a>
                <span className="text-gray-300">·</span>
                <a href="https://www.ifrn.edu.br" target="_blank" rel="noopener noreferrer"
                  className="text-xs text-gray-400 hover:text-emerald-600 transition-colors">Site IFRN</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-emerald-300 text-xs mt-8">
        © 2026 IFRN Campus Caicó — pratiCA. Todos os direitos reservados.
      </p>
    </div>
  );
};

export default Login;

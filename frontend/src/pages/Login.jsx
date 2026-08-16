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

            {/* Login Local (Dev) */}
            <div className="mb-4">
              <button
                onClick={() => setShowDevLogin(!showDevLogin)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-700 font-medium transition-colors"
              >
                <span>Login Local (Dev)</span>
                <svg className={`w-4 h-4 transition-transform ${showDevLogin ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {showDevLogin && (
              <div className="space-y-3 mb-6">
                <button className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left">
                  <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700 font-medium">Acesso Administrativo</span>
                </button>

                <button className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left">
                  <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700 font-medium">+ Quero ser Mediador</span>
                </button>
              </div>
            )}

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

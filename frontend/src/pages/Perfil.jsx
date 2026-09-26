import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Perfil = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const dados = localStorage.getItem('usuario') || localStorage.getItem('suap_user');
    if (dados) {
      setUsuario(JSON.parse(dados));
    }
  }, []);

  const handleSair = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isMediador = usuario?.tipo === 'mediador';
  const isProfessor = usuario?.tipo === 'professor' || usuario?.tipo_vinculo === 'professor';
  const papelFormatado = isMediador ? 'Mediador' : (isProfessor ? 'Professor' : (usuario?.tipo_vinculo || usuario?.tipo || 'Aluno'));

  const iniciais = usuario?.nome
    ? usuario.nome.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : (isMediador ? 'MD' : 'U');

  const bannerBg = isMediador
    ? 'bg-gradient-to-r from-[#4a1575] via-[#5b1f86] to-[#6b259d]'
    : (isProfessor ? 'bg-emerald-800' : 'bg-[#004d34]');

  const avatarBg = isMediador
    ? 'bg-purple-800'
    : (isProfessor ? 'bg-emerald-800' : 'bg-[#1d4d38]');

  return (
    <div className="flex-1 bg-gray-100 min-h-screen p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Cabeçalho da Página */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isMediador ? 'Informações do seu perfil de Mediador' : 'Informações da sua conta no sistema'}
          </p>
        </div>

        {/* Card do Perfil / Banner */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Banner Superior */}
          <div className={`${bannerBg} h-32 w-full`}></div>

          {/* Conteúdo do Perfil */}
          <div className="px-6 pb-6 pt-0 relative">
            <div className="flex justify-between items-end -mt-12 mb-4">
              
              {/* Avatar com Iniciais ou Foto */}
              <div className="relative">
                <div className={`w-24 h-24 rounded-2xl ${avatarBg} border-4 border-white flex items-center justify-center text-white text-2xl font-bold shadow-md overflow-hidden`}>
                  {usuario?.foto ? (
                    <img src={usuario.foto} alt="Foto de Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <span>{iniciais}</span>
                  )}
                </div>
              </div>

              {/* Badge de Vínculo */}
              <span className={`font-semibold text-xs px-3 py-1 rounded-full border ${isMediador ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {papelFormatado}
              </span>
            </div>

            {/* Nome e Email Cadastrado */}
            <h2 className="text-xl font-bold text-gray-800 mb-0.5">{usuario?.nome || papelFormatado}</h2>
            <p className="text-sm text-gray-500 font-medium">
              {usuario?.email || 'E-mail não informado'}
            </p>
          </div>
        </div>

        {/* Tabela / Lista de Dados da Conta */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          <div className="p-4 sm:px-6 flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Identificação / Matrícula</span>
            <span className="font-bold text-gray-800">{usuario?.matricula || 'Cadastro Local'}</span>
          </div>

          <div className="p-4 sm:px-6 flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Campus</span>
            <span className="font-bold text-gray-800">{usuario?.campus || 'Caicó'}</span>
          </div>

          <div className="p-4 sm:px-6 flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Tipo de vínculo</span>
            <span className="font-bold text-gray-800">{papelFormatado}</span>
          </div>

          <div className="p-4 sm:px-6 flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Área de Atuação / Modalidade</span>
            <span className="font-bold text-gray-800">{isMediador ? 'Mediação Inclusiva (NAPNE)' : (usuario?.modalidade || 'Presencial')}</span>
          </div>
        </div>

        {/* Alerta Informativo */}
        <div className={`border rounded-xl p-4 flex items-start gap-3 text-xs ${isMediador ? 'bg-purple-50/60 border-purple-200/60 text-purple-800' : 'bg-blue-50/60 border-blue-200/60 text-blue-700'}`}>
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="leading-relaxed">
            {isMediador 
              ? 'Perfil cadastrado na plataforma pratiCA para acompanhamento e suporte inclusivo aos estudantes.' 
              : 'Seus dados de conta e credenciais estão integrados à plataforma pratiCA.'}
          </p>
        </div>

        {/* Botões de Ação Inferiores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 px-4 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>

          <button
            onClick={handleSair}
            className="w-full py-3 px-4 border border-red-200 rounded-xl bg-white hover:bg-red-50 text-red-600 text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair da conta
          </button>
        </div>

      </div>
    </div>
  );
};

export default Perfil;
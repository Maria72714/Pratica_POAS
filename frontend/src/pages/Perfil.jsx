import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Perfil = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const dados = localStorage.getItem('usuario');
    if (dados) {
      setUsuario(JSON.parse(dados));
    }
  }, []);

  const handleAlterarFoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const fotoUrl = reader.result;
        const usuarioAtualizado = { ...usuario, foto: fotoUrl };
        setUsuario(usuarioAtualizado);
        localStorage.setItem('usuario', JSON.stringify(usuarioAtualizado));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSair = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const iniciais = usuario?.nome
    ? usuario.nome.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : '??';

  return (
    <div className="flex-1 bg-gray-100 min-h-screen p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Cabeçalho da Página */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Informações da sua conta institucional
          </p>
        </div>

        {/* Card do Perfil / Banner */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Banner Verde Superior */}
          <div className="bg-[#004d34] h-32 w-full"></div>

          {/* Conteúdo do Perfil */}
          <div className="px-6 pb-6 pt-0 relative">
            <div className="flex justify-between items-end -mt-12 mb-4">
              
              {/* Avatar com Iniciais ou Foto */}
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-[#1d4d38] border-4 border-white flex items-center justify-center text-white text-2xl font-bold shadow-md overflow-hidden">
                  {usuario?.foto ? (
                    <img src={usuario.foto} alt="Foto de Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <span>{iniciais}</span>
                  )}
                </div>
              </div>

              {/* Badge de Vínculo */}
              <span className="bg-gray-100 text-gray-600 font-medium text-xs px-3 py-1 rounded-full border border-gray-200">
                {usuario?.tipo_vinculo || 'Aluno'}
              </span>
            </div>

            {/* Email Cadastrado */}
            <p className="text-sm text-gray-500 font-medium mb-4">
              {usuario?.email || '20231101110048@academico.ifrn.edu.br'}
            </p>

            {/* Botão de Alterar Foto */}
            <div>
              <label htmlFor="foto-upload" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors shadow-sm">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h0.93a2 2 0 001.664-.89l0.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l0.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Alterar foto
              </label>
              <input
                id="foto-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAlterarFoto}
              />
            </div>
          </div>
        </div>

        {/* Tabela / Lista de Dados da Conta */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          <div className="p-4 sm:px-6 flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Matrícula</span>
            <span className="font-bold text-gray-800">{usuario?.matricula || '20231101110048'}</span>
          </div>

          <div className="p-4 sm:px-6 flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Campus</span>
            <span className="font-bold text-gray-800">{usuario?.campus || 'Caicó'}</span>
          </div>

          <div className="p-4 sm:px-6 flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Tipo de vínculo</span>
            <span className="font-bold text-gray-800">{usuario?.tipo_vinculo || 'Aluno'}</span>
          </div>

          <div className="p-4 sm:px-6 flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Modalidade</span>
            <span className="font-bold text-gray-800">{usuario?.modalidade || 'TAL'}</span>
          </div>
        </div>

        {/* Alerta Informativo SUAP */}
        <div className="bg-blue-50/60 border border-blue-200/60 rounded-xl p-4 flex items-start gap-3 text-xs text-blue-700">
          <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="leading-relaxed">
            Nome e e-mail são sincronizados automaticamente com o SUAP a cada login. Você pode alterar a foto de perfil aqui (salva localmente no dispositivo).{' '}
            <a href="https://suap.ifrn.edu.br" target="_blank" rel="noreferrer" className="underline font-semibold hover:text-blue-800">
              suap.ifrn.edu.br
            </a>
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
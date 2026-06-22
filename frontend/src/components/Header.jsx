import React from 'react';

const Header = ({ usuario }) => {
  // Usuário padrão (aluno) se não for passado nada
  const usuarioInfo = usuario || {
    nome: "Ana Carolina Silva",
    descricao: "Aluno - Mat. 20231145678",
    iniciais: "AC",
    corAvatar: "bg-emerald-600"
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* barra de busca */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            {/* input de busca */}
            <input
              type="text"
              placeholder="Buscar disciplinas, professores, atendimentos..."
              className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            {/* icone de lupa */}
            <svg
              className="absolute left-3 top-3 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* lado direito com notificacao, usuario e logout */}
        <div className="flex items-center gap-6">
          {/* botao de notificacao */}
          <button className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
          </button>

          {/* info do usuario logado */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-semibold text-sm text-gray-800">{usuarioInfo.nome}</p>
              <p className="text-xs text-gray-500">{usuarioInfo.descricao}</p>
            </div>
            {/* avatar */}
            <div className={`w-9 h-9 ${usuarioInfo.corAvatar} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
              {usuarioInfo.iniciais}
            </div>
          </div>

          {/* botao de logout */}
          <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

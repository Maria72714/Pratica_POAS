import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  fetchNotificacoes, 
  marcarNotificacaoComoLida, 
  marcarTodasNotificacoesComoLidas, 
  deletarNotificacao 
} from '../services/api';

const Header = ({ usuario }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const dropdownRef = useRef(null);
  const [dropdownAberto, setDropdownAberto] = useState(false);
  
  const [notificacoes, setNotificacoes] = useState([]);

  // Busca notificações reais vinculadas ao usuário no banco Neon
  useEffect(() => {
    const dados = localStorage.getItem('usuario') || localStorage.getItem('suap_user');
    const u = dados ? JSON.parse(dados) : (usuario || {});
    const identificador = u.matricula || u.id || u.email;

    if (identificador) {
      fetchNotificacoes(identificador)
        .then(data => {
          if (data && Array.isArray(data)) {
            setNotificacoes(data);
          }
        })
        .catch(() => {});
    }
  }, [usuario]);

  // Informações do usuário logado
  const usuarioInfo = usuario || {
    nome: "Usuário",
    descricao: "pratiCA",
    iniciais: "U",
    corAvatar: "bg-emerald-600",
    foto: null,
    email: null
  };

  const urlFoto = usuarioInfo.foto 
    ? (usuarioInfo.foto.startsWith('http') ? usuarioInfo.foto : `https://suap.ifrn.edu.br${usuarioInfo.foto}`)
    : null;

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  async function handleMarcarComoLida(id) {
    setNotificacoes(prev =>
      prev.map(n => (n.id === id ? { ...n, lida: true } : n))
    );
    try {
      await marcarNotificacaoComoLida(id);
    } catch (err) {}
  }

  async function handleMarcarTodasComoLidas() {
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    const dados = localStorage.getItem('usuario') || localStorage.getItem('suap_user');
    const u = dados ? JSON.parse(dados) : (usuario || {});
    const identificador = u.matricula || u.id || u.email;
    if (identificador) {
      try {
        await marcarTodasNotificacoesComoLidas(identificador);
      } catch (err) {}
    }
  }

  async function handleExcluirNotificacao(id, e) {
    e.stopPropagation();
    setNotificacoes(prev => prev.filter(n => n.id !== id));
    try {
      await deletarNotificacao(id);
    } catch (err) {}
  }

  return (
    <header className="bg-white border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Hambúrguer em mobile, logo checkmark no mobile/tablet */}
        <div className="flex items-center gap-2 lg:hidden">
          {/* Hambúrguer */}
          <button
            onClick={() => {}}
            className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Logo checkmark mobile */}
          <img src="/images/pratiCA_logo_vetorizada (1).png" alt="Logo" className="w-8 h-8 object-contain" />
        </div>
        
        {/* Barra de busca - Oculta em mobile */}
        <div className="hidden sm:flex flex-1 max-w-md lg:max-w-xl">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full px-3 sm:px-4 py-2 pl-8 sm:pl-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <svg
              className="absolute left-2 sm:left-3 top-2.5 h-4 w-4 text-gray-400"
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

        {/* Lado direito com notificações, usuário e logout */}
        <div className="flex items-center gap-1 sm:gap-3 lg:gap-6">
          {/* Central de Notificações Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setDropdownAberto(!dropdownAberto)}
              className="relative p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {naoLidas > 0 && (
                <span className="absolute top-0 right-0 min-w-4 h-4 bg-red-500 rounded-full text-[8px] sm:text-[10px] font-bold text-white flex items-center justify-center px-0.5 sm:px-1">
                  {naoLidas}
                </span>
              )}
            </button>

            {dropdownAberto && (
              <div className="absolute right-0 mt-2 sm:mt-3 w-64 sm:w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden transition-all transform origin-top-right">
                <div className="p-2 sm:p-4 border-b border-gray-100 flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-gray-800 text-sm truncate">Notificações</h3>
                  {naoLidas > 0 && (
                    <button 
                      onClick={handleMarcarTodasComoLidas}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium whitespace-nowrap"
                    >
                      Marcar tudo
                    </button>
                  )}
                </div>

                <div className="max-h-56 sm:max-h-72 overflow-y-auto">
                  {notificacoes.length === 0 ? (
                    <div className="p-4 sm:p-8 text-center text-gray-400 text-xs sm:text-sm">
                      Nenhuma notificação
                    </div>
                  ) : (
                    notificacoes.map((notif) => (
                      <div 
                        key={notif.id}
                        onClick={() => handleMarcarComoLida(notif.id)}
                        className={`p-2 sm:p-4 border-b border-gray-50 flex gap-2 sm:gap-3 cursor-pointer transition-colors hover:bg-gray-50 ${!notif.lida ? 'bg-emerald-50/30' : ''}`}
                      >
                        {/* Indicador de Tipo */}
                        <div className="mt-0.5 flex-shrink-0">
                          {notif.tipo === 'success' && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 block"></span>
                          )}
                          {notif.tipo === 'warning' && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 block"></span>
                          )}
                          {notif.tipo === 'info' && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 block"></span>
                          )}
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-1">
                            <h4 className={`text-xs ${!notif.lida ? 'font-semibold text-gray-800' : 'text-gray-600'} truncate`}>
                              {notif.titulo}
                            </h4>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">{notif.data}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 leading-tight line-clamp-2">{notif.mensagem}</p>
                        </div>

                        {/* Botão de excluir individual */}
                        <button 
                          onClick={(e) => handleExcluirNotificacao(notif.id, e)}
                          className="text-gray-300 hover:text-gray-500 flex-shrink-0"
                          title="Remover"
                        >
                          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Info do usuário logado - Responsivo */}
          <div className="hidden sm:flex items-center gap-2 lg:gap-3">
            <div className="text-right hidden lg:block">
              <p className="font-semibold text-sm text-gray-800">{usuarioInfo.nome}</p>
              {usuarioInfo.email && (
                <p className="text-xs text-gray-400 -mt-0.5">{usuarioInfo.email}</p>
              )}
              <p className="text-xs text-gray-500">{usuarioInfo.descricao}</p>
            </div>
            {/* Avatar ou Foto */}
            {urlFoto ? (
              <img
                src={urlFoto}
                alt={`Foto de ${usuarioInfo.nome}`}
                className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className={`w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 ${usuarioInfo.corAvatar} rounded-full flex items-center justify-center text-white font-bold text-xs`}>
                {usuarioInfo.iniciais}
              </div>
            )}
          </div>

          {/* Botão de logout */}
          <button 
            onClick={handleLogout}
            className="p-1.5 sm:p-2 text-gray-500 hover:text-red-600 transition-colors"
            title="Sair"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const Header = ({ usuario }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [dropdownAberto, setDropdownAberto] = useState(false);
  
  // Mock de notificações padrão (aluno e professor)
  const [notificacoes, setNotificacoes] = useState([
    {
      id: 1,
      titulo: 'Atendimento Confirmado',
      mensagem: 'Seu agendamento com o Prof. Roberto Santos foi confirmado para amanhã às 14:00.',
      data: 'Há 5 min',
      lida: false,
      tipo: 'success'
    },
    {
      id: 2,
      titulo: 'Novo Horário Disponível',
      mensagem: 'A Prof. Maria Oliveira adicionou novos horários de atendimento de Estrutura de Dados.',
      data: 'Há 1 hora',
      lida: false,
      tipo: 'info'
    },
    {
      id: 3,
      titulo: 'Documento Pendente',
      mensagem: 'Lembre-se de anexar seu histórico acadêmico na solicitação de orientação.',
      data: 'Ontem',
      lida: true,
      tipo: 'warning'
    }
  ]);

  // Informações do usuário logado
  const usuarioInfo = usuario || {
    nome: "Ana Carolina Silva",
    descricao: "Aluno - Mat. 20231145678",
    iniciais: "AC",
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
    localStorage.removeItem('usuario');
    navigate('/login');
  }

  function marcarComoLida(id) {
    setNotificacoes(prev =>
      prev.map(n => (n.id === id ? { ...n, lida: true } : n))
    );
  }

  function marcarTodasComoLidas() {
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
  }

  function excluirNotificacao(id, e) {
    e.stopPropagation();
    setNotificacoes(prev => prev.filter(n => n.id !== id));
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Barra de busca */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar disciplinas, professores, atendimentos..."
              className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
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

        {/* Lado direito com notificações, usuário e logout */}
        <div className="flex items-center gap-6">
          {/* Central de Notificações Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setDropdownAberto(!dropdownAberto)}
              className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {naoLidas > 0 && (
                <span className="absolute top-1 right-1 min-w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1">
                  {naoLidas}
                </span>
              )}
            </button>

            {dropdownAberto && (
              <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden transition-all transform origin-top-right">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">Notificações</h3>
                  {naoLidas > 0 && (
                    <button 
                      onClick={marcarTodasComoLidas}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto">
                  {notificacoes.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">
                      Nenhuma notificação por aqui.
                    </div>
                  ) : (
                    notificacoes.map((notif) => (
                      <div 
                        key={notif.id}
                        onClick={() => marcarComoLida(notif.id)}
                        className={`p-4 border-b border-gray-50 flex gap-3 cursor-pointer transition-colors hover:bg-gray-50 ${!notif.lida ? 'bg-emerald-50/30' : ''}`}
                      >
                        {/* Indicador de Tipo */}
                        <div className="mt-0.5">
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
                        <div className="flex-1">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className={`text-xs ${!notif.lida ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                              {notif.titulo}
                            </h4>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap">{notif.data}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 leading-normal">{notif.mensagem}</p>
                        </div>

                        {/* Botão de excluir individual */}
                        <button 
                          onClick={(e) => excluirNotificacao(notif.id, e)}
                          className="text-gray-300 hover:text-gray-500 self-center"
                          title="Remover"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* Info do usuário logado */}
          <div className="flex items-center gap-3">
            <div className="text-right">
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
                className="w-9 h-9 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className={`w-9 h-9 ${usuarioInfo.corAvatar} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                {usuarioInfo.iniciais}
              </div>
            )}
          </div>

          {/* Botão de logout */}
          <button 
            onClick={handleLogout}
            className="p-2 text-gray-500 hover:text-red-600 transition-colors"
            title="Sair"
          >
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

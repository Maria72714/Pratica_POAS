import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ itensMenu }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Se não passar itens, usa os itens padrão do aluno
  const itens = itensMenu || [
    {
      icone: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
      texto: "Início",
      link: "/"
    },
    {
      icone: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      texto: "Meus Agendamentos",
      link: "/agendamentos"
    },
    {
      icone: "M12 6v6m0 0v6m0-6h6m-6 0H6",
      texto: "Solicitar Atendimento",
      link: "/solicitar-atendimento"
    },
    {
      icone: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      texto: "Histórico",
      link: "/"
    }
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-emerald-900 text-white rounded-lg flex items-center justify-center shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-72 bg-emerald-900 min-h-screen flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* logo e info do campus */}
        <div className="p-4 sm:p-6 border-b border-emerald-800">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Logo mobile - cores normais */}
            <img src="/images/pratiCA_logo_vetorizada (1).png" alt="Logo Prática" className="lg:hidden w-9 h-auto flex-shrink-0 object-contain" />
            
            {/* Logo desktop - branca */}
            <img src="/images/logo_branca_pratica_vetorizada.png" alt="Logo Prática" className="hidden lg:block w-10 h-auto flex-shrink-0 object-contain" />
            
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate">pratiCA</h1>
              <p className="text-emerald-200 text-xs sm:text-sm mt-0.5">Centro de Aprendizagem</p>
            </div>
          </div>
          <p className="text-emerald-300 text-xs mt-1 sm:mt-2">IFRN - Campus Caicó</p>
        </div>

        {/* menu de navegacao */}
        <nav className="flex-1 p-2 sm:p-4">
          <ul className="space-y-1 sm:space-y-2">
            {itens.map((item, index) => {
              const isAtivo = location.pathname === item.link;

              return (
                <li key={index}>
                  <Link
                    to={item.link || '#'}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-colors ${isAtivo
                        ? 'bg-emerald-800 text-white'
                        : 'text-emerald-50 hover:bg-emerald-800'
                      }`}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icone} />
                    </svg>
                    <span className="truncate" dangerouslySetInnerHTML={{ __html: item.texto }}></span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* rodapé com nome do instituto */}
        <div className="p-2 sm:p-4 border-t border-emerald-800">
          <p className="text-emerald-300 text-xs text-center leading-relaxed">
            Instituto Federal de Educação, Ciência e Tecnologia do Rio Grande do Norte
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

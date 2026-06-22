import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ itensMenu }) => {
  const location = useLocation();

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
      link: "/"
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
    <aside className="w-72 bg-emerald-900 min-h-screen flex flex-col">
      {/* logo e info do campus */}
      <div className="p-6 border-b border-emerald-800">
        <h1 className="text-2xl font-bold text-white">pratiCA</h1>
        <p className="text-emerald-200 text-sm mt-1">Centro de Aprendizagem</p>
        <p className="text-emerald-300 text-xs mt-2">IFRN - Campus Caicó</p>
      </div>

      {/* menu de navegacao */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {itens.map((item, index) => {
            // Verifica se a rota atual é igual ao link do item para marcá-lo como ativo
            const isAtivo = location.pathname === item.link;

            return (
              <li key={index}>
                <Link
                  to={item.link || '#'}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isAtivo 
                      ? 'bg-emerald-800 text-white' 
                      : 'text-emerald-50 hover:bg-emerald-800'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icone} />
                  </svg>
                  <span dangerouslySetInnerHTML={{ __html: item.texto }}></span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* rodapé com nome do instituto */}
      <div className="p-4 border-t border-emerald-800">
        <p className="text-emerald-300 text-xs text-center leading-relaxed">
          Instituto Federal de Educação, Ciência e Tecnologia do Rio Grande do Norte
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;

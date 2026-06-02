import React from 'react';

const Sidebar = () => {
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
        <ul className="space-y-1">
          {/* item do menu ativo (pagina atual) - bg-emerald-800 deixa destacado */}
           
          <li>
            <a
              href="#"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-800 text-white font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Início
            </a>
          </li>
          {/* itens do menu inativos - hover:bg-emerald-800 muda a cor quando passa o mouse */}
          <li>
            <a
              href="#"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-emerald-100 hover:bg-emerald-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Meus Agendamentos
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-emerald-100 hover:bg-emerald-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Solicitar Atendimento
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-emerald-100 hover:bg-emerald-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Histórico
            </a>
          </li>
        </ul>
      </nav>

      {/* footer com nome do instituto */}
      <div className="p-4 border-t border-emerald-800">
        <p className="text-emerald-300 text-xs text-center leading-relaxed">
          Instituto Federal de Educação, Ciência e Tecnologia do Rio Grande do Norte
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;

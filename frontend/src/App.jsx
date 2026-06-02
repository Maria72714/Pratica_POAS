import React from 'react';
// importando os componentes que criamos
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* barra lateral de navegacao */}
      <Sidebar />
      {/* area principal do site - ocupa o restante da tela */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* cabecalho com busca e info do usuario */}
        <Header />
        {/* conteudo principal - o dashboard */}
        <Dashboard />
      </div>
    </div>
  );
}

export default App;

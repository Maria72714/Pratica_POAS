import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SolicitacaoAtendimento = () => {
  const navigate = useNavigate();
  const dadosStorage = localStorage.getItem('usuario');
  const usuarioLogado = dadosStorage ? JSON.parse(dadosStorage) : null;
  const isApprovedTai = usuarioLogado?.tai_status === 'APROVADO';

  const [tipo, setTipo] = useState('TAI');

  // Se o aluno não for TAI aprovado, ele não pode solicitar atendimento individual
  if (!isApprovedTai) {
    return (
      <div className="flex-1 bg-gray-50 overflow-y-auto p-8 font-sans">
        <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-amber-100 border border-amber-300 rounded-full flex items-center justify-center mx-auto text-amber-700 text-2xl">
            ℹ️
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Acesso Restrito a Alunos TAI</h1>
            <p className="text-gray-600 text-sm leading-relaxed max-w-lg mx-auto">
              Os alunos <strong>TAL (regulares)</strong> não realizam abertura de novos pedidos individuais de atendimento. Você deve participar diretamente dos <strong>Horários de Atendimento (CA)</strong> disponibilizados pelos professores no painel principal.
            </p>
          </div>
          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Ver Horários de CA Disponíveis →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        {/* Banner */}
        <div className="bg-emerald-900 text-white px-8 py-8 rounded-xl mb-8 shadow-sm">
          <h1 className="text-2xl font-bold mb-1">Solicitação de Atendimento TAI</h1>
          <p className="text-emerald-100 text-sm">
            Agende um acompanhamento individualizado com nossos tutores e professores (Exclusivo para Aluno TAI Homologado).
          </p>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form className="space-y-6">
            {/* Tipo de Tutoria */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Tipo de Atendimento</h2>
              <div className="grid grid-cols-1 gap-4">
                <label className="cursor-pointer border border-emerald-500 bg-emerald-50 rounded-xl p-4 flex flex-col transition-all">
                  <div className="flex items-center mb-2">
                    <input 
                      type="radio" 
                      name="tipoTutoria" 
                      value="TAI" 
                      checked={true} 
                      readOnly
                      className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500" 
                    />
                    <span className="ml-3 font-semibold text-emerald-800">TAI - Tutoria de Aprendizagem Inclusiva</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-7">
                    Para estudantes com Necessidades Educacionais Específicas (NAPNE) homologados pelo Administrador.
                  </p>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Disciplina */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Disciplina
                </label>
                <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-800" defaultValue="">
                  <option value="" disabled>Selecione uma disciplina...</option>
                  <option value="poo">Programação Orientada a Objetos</option>
                  <option value="bd">Banco de Dados</option>
                  <option value="mat">Matemática Aplicada</option>
                </select>
              </div>

              {/* Data Preferencial */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Preferencial
                </label>
                <input 
                  type="date" 
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800"
                />
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Qual sua dúvida ou necessidade específica?
              </label>
              <textarea 
                rows="4" 
                placeholder="Descreva brevemente o motivo da solicitação de atendimento TAI para que o tutor/professor possa se preparar..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-gray-800"
              ></textarea>
            </div>

            {/* Botões */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-4">
              <button 
                type="button" 
                onClick={() => navigate('/')}
                className="px-6 py-2.5 text-gray-600 font-medium hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm cursor-pointer"
              >
                Confirmar Solicitação TAI
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SolicitacaoAtendimento;

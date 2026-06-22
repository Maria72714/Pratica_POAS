import React, { useState } from 'react';

const SolicitacaoAtendimento = () => {
  const [tipo, setTipo] = useState('TAL');

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto p-8">
      <div className="max-w-3xl mx-auto">
        {/* Banner */}
        <div className="bg-emerald-900 text-white px-8 py-8 rounded-xl mb-8">
          <h1 className="text-2xl font-bold mb-1">Solicitação de Atendimento</h1>
          <p className="text-emerald-100 text-sm">
            Agende um acompanhamento acadêmico com nossos tutores e professores.
          </p>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form className="space-y-6">
            {/* Tipo de Tutoria */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Tipo de Atendimento</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`cursor-pointer border rounded-xl p-4 flex flex-col ${tipo === 'TAL' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <div className="flex items-center mb-2">
                    <input 
                      type="radio" 
                      name="tipoTutoria" 
                      value="TAL" 
                      checked={tipo === 'TAL'} 
                      onChange={() => setTipo('TAL')}
                      className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500" 
                    />
                    <span className={`ml-3 font-semibold ${tipo === 'TAL' ? 'text-emerald-800' : 'text-gray-800'}`}>TAL</span>
                  </div>
                  <p className="text-sm text-gray-500 ml-7">
                    Tutoria de Aprendizagem e Laboratório: destinado aos alunos em geral para reforço em disciplinas.
                  </p>
                </label>

                <label className={`cursor-pointer border rounded-xl p-4 flex flex-col ${tipo === 'TAI' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <div className="flex items-center mb-2">
                    <input 
                      type="radio" 
                      name="tipoTutoria" 
                      value="TAI" 
                      checked={tipo === 'TAI'} 
                      onChange={() => setTipo('TAI')}
                      className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500" 
                    />
                    <span className={`ml-3 font-semibold ${tipo === 'TAI' ? 'text-emerald-800' : 'text-gray-800'}`}>TAI</span>
                  </div>
                  <p className="text-sm text-gray-500 ml-7">
                    Tutoria de Aprendizagem Inclusiva: para estudantes com Necessidades Educacionais Específicas (NAPNE).
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
                <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white" defaultValue="">
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Qual sua dúvida ou necessidade? (Opcional)
              </label>
              <textarea 
                rows="4" 
                placeholder="Descreva brevemente o motivo do atendimento para que o tutor possa se preparar..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              ></textarea>
            </div>

            {/* Botões */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-4">
              <button type="button" className="px-6 py-2.5 text-gray-600 font-medium hover:text-gray-800 transition-colors">
                Cancelar
              </button>
              <button type="button" className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm">
                Confirmar Solicitação
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SolicitacaoAtendimento;

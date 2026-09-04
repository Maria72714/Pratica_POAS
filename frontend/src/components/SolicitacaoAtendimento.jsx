import React, { useState } from 'react';

const SolicitacaoTAI = () => {
  const [suporte, setSuporte] = useState('');

  const opcoesSuporte = [
    {
      id: 'libras',
      title: 'Intérprete de Libras',
      desc: 'Para alunos com deficiência auditiva / surdez',
    },
    {
      id: 'braille',
      title: 'Apoio Braille / Audiodescrição',
      desc: 'Para alunos com deficiência visual / cegueira',
    },
    {
      id: 'pedagogico',
      title: 'Acompanhamento Pedagógico',
      desc: 'Dislexia, dislalia e transtornos de aprendizagem',
    },
    {
      id: 'mobilidade',
      title: 'Apoio à Mobilidade',
      desc: 'Cadeirantes e deficiência motora',
    },
    {
      id: 'transtornos',
      title: 'Suporte para Transtornos',
      desc: 'TDA/TDAH, autismo (TEA) e similares',
    },
    {
      id: 'outro',
      title: 'Outro tipo de suporte',
      desc: 'Descreva nas observações abaixo',
    },
  ];

  return (
    <div className="flex-1 bg-gray-50 min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Banner Superior Verde Escuro */}
        <div className="bg-[#004d34] text-white p-6 rounded-xl shadow-sm">
          <h1 className="text-2xl font-bold mb-1">Solicitação TAI</h1>
          <p className="text-emerald-100 text-sm">
            Tutoria de Aprendizagem Inclusiva — atendimento especializado com mediador NAPNE.
          </p>
        </div>

        {/* Banner Informativo Roxo (Com ícone SVG limpo) */}
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-start gap-3 text-purple-900 text-sm">
          <svg className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>
            Qualquer aluno pode solicitar atendimento inclusivo (TAI). A aprovação fica a cargo da{' '}
            <strong className="font-semibold">coordenação / NAPNE</strong>, que verificará sua elegibilidade e designará um mediador especializado.
          </p>
        </div>

        {/* Card do Formulário */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            
            {/* Seção Qual tipo de suporte você precisa? */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-4">
                Qual tipo de suporte você precisa? <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {opcoesSuporte.map((opcao) => (
                  <label
                    key={opcao.id}
                    className={`cursor-pointer border rounded-xl p-4 flex items-start gap-3 transition-all ${
                      suporte === opcao.id
                        ? 'border-purple-500 ring-1 ring-purple-500 bg-purple-50/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipoSuporte"
                      value={opcao.id}
                      checked={suporte === opcao.id}
                      onChange={() => setSuporte(opcao.id)}
                      className="mt-1 w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">{opcao.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{opcao.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Grid Disciplina e Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* Disciplina */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium text-gray-700">Disciplina (opcional)</label>
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    ✓ disciplinas do seu curso
                  </span>
                </div>
                <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white">
                  <option value="">Selecione (opcional)</option>
                  <option value="poo">Programação Orientada a Objetos</option>
                  <option value="bd">Banco de Dados</option>
                </select>
              </div>

              {/* Data Preferencial */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Preferencial (opcional)
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descreva sua necessidade (opcional)
              </label>
              <textarea
                rows="3"
                placeholder="Informe detalhes para que o mediador possa se preparar adequadamente..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
              ></textarea>
            </div>

            {/* Botões de Ação */}
            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                className="px-6 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#8b3dff] text-white text-sm font-medium rounded-lg hover:bg-[#7a2eff] transition-colors shadow-sm"
              >
                Confirmar Solicitação
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default SolicitacaoTAI;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { atualizarPnee } from '../services/api';

const Perfil = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [usuario, setUsuario] = useState(null);
  const [pneeForm, setPneeForm] = useState({ necessidades_especiais: false, tipo_necessidade: '', laudo: null });
  const [salvandoPnee, setSalvandoPnee] = useState(false);
  const [pneeMsg, setPneeMsg] = useState(null);

  useEffect(() => {
    const dados = localStorage.getItem('usuario') || localStorage.getItem('suap_user');
    if (dados) {
      const parsed = JSON.parse(dados);
      setUsuario(parsed);
      setPneeForm((f) => ({
        ...f,
        necessidades_especiais: !!parsed.necessidades_especiais,
        tipo_necessidade: parsed.tipo_necessidade || '',
      }));
    }
  }, []);

  const handleSair = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleSalvarPnee = async () => {
    if (!usuario?.matricula) return;
    setSalvandoPnee(true);
    setPneeMsg(null);
    try {
      const fd = new FormData();
      fd.append('necessidades_especiais', String(pneeForm.necessidades_especiais));
      if (pneeForm.tipo_necessidade) fd.append('tipo_necessidade', pneeForm.tipo_necessidade);
      if (pneeForm.laudo) fd.append('laudo', pneeForm.laudo);
      const atualizado = await atualizarPnee(usuario.matricula, fd);
      setUsuario(atualizado);
      setPneeMsg({ ok: true, texto: 'Status PNEE atualizado com sucesso.' });
    } catch (err) {
      setPneeMsg({ ok: false, texto: err.message || 'Não foi possível atualizar o status.' });
    } finally {
      setSalvandoPnee(false);
    }
  };

  const isMediador = usuario?.tipo === 'mediador';
  const isProfessor = usuario?.tipo === 'professor' || usuario?.tipo_vinculo === 'professor';
  const isAluno = !isMediador && !isProfessor && (usuario?.is_aluno || usuario?.tipo_vinculo === 'Aluno');
  const pneeAtivo = !!(usuario?.necessidades_especiais);
  const papelFormatado = isMediador ? 'Mediador' : (isProfessor ? 'Professor' : (usuario?.tipo_vinculo || usuario?.tipo || 'Aluno'));

  const iniciais = usuario?.nome
    ? usuario.nome.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : (isMediador ? 'MD' : 'U');

  const bannerBg = isMediador
    ? 'bg-gradient-to-r from-[#4a1575] via-[#5b1f86] to-[#6b259d]'
    : (isProfessor ? 'bg-emerald-800' : 'bg-[#004d34]');

  const avatarBg = isMediador
    ? 'bg-purple-800'
    : (isProfessor ? 'bg-emerald-800' : 'bg-[#1d4d38]');

  return (
    <div className="flex-1 bg-gray-100 min-h-screen p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Cabeçalho da Página */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isMediador ? 'Informações do seu perfil de Mediador' : 'Informações da sua conta no sistema'}
          </p>
        </div>

        {/* Card do Perfil / Banner */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Banner Superior */}
          <div className={`${bannerBg} h-32 w-full`}></div>

          {/* Conteúdo do Perfil */}
          <div className="px-6 pb-6 pt-0 relative">
            <div className="flex justify-between items-end -mt-12 mb-4">
              
              {/* Avatar com Iniciais ou Foto */}
              <div className="relative">
                <div className={`w-24 h-24 rounded-2xl ${avatarBg} border-4 border-white flex items-center justify-center text-white text-2xl font-bold shadow-md overflow-hidden`}>
                  {usuario?.foto ? (
                    <img src={usuario.foto} alt="Foto de Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <span>{iniciais}</span>
                  )}
                </div>
              </div>

              {/* Badge de Vínculo */}
              <span className={`font-semibold text-xs px-3 py-1 rounded-full border ${isMediador ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {papelFormatado}
              </span>
            </div>

            {/* Nome e Email Cadastrado */}
            <h2 className="text-xl font-bold text-gray-800 mb-0.5">{usuario?.nome || papelFormatado}</h2>
            <p className="text-sm text-gray-500 font-medium">
              {usuario?.email || 'E-mail não informado'}
            </p>
          </div>
        </div>

        {/* Tabela / Lista de Dados da Conta */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          <div className="p-4 sm:px-6 flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Identificação / Matrícula</span>
            <span className="font-bold text-gray-800">{usuario?.matricula || 'Cadastro Local'}</span>
          </div>

          <div className="p-4 sm:px-6 flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Campus</span>
            <span className="font-bold text-gray-800">{usuario?.campus || 'Caicó'}</span>
          </div>

          <div className="p-4 sm:px-6 flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Tipo de vínculo</span>
            <span className="font-bold text-gray-800">{papelFormatado}</span>
          </div>

          <div className="p-4 sm:px-6 flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Área de Atuação / Modalidade</span>
            <span className="font-bold text-gray-800">{isMediador ? 'Mediação Inclusiva (NAPNE)' : (usuario?.modalidade || 'Presencial')}</span>
          </div>
        </div>

        {/* Alerta Informativo */}
        <div className={`border rounded-xl p-4 flex items-start gap-3 text-xs ${isMediador ? 'bg-purple-50/60 border-purple-200/60 text-purple-800' : 'bg-blue-50/60 border-blue-200/60 text-blue-700'}`}>
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="leading-relaxed">
            {isMediador 
              ? 'Perfil cadastrado na plataforma pratiCA para acompanhamento e suporte inclusivo aos estudantes.' 
              : 'Seus dados de conta e credenciais estão integrados à plataforma pratiCA.'}
          </p>
        </div>

        {/* Status PNEE do Aluno */}
        {isAluno && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-sm">Necessidade Educacional Específica (PNEE)</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {pneeAtivo
                    ? 'Você está registrado como PNEE e pode solicitar Centros de Aprendizagem (CA).'
                    : 'Somente alunos PNEE podem solicitar CA. Declare abaixo e, se possível, anexe o laudo.'}
                </p>
              </div>
              <span className={`shrink-0 font-semibold text-xs px-3 py-1 rounded-full border ${pneeAtivo ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {pneeAtivo ? 'PNEE ativo' : 'Não PNEE'}
              </span>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={pneeForm.necessidades_especiais}
                onChange={(e) => setPneeForm((f) => ({ ...f, necessidades_especiais: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-emerald-700 focus:ring-emerald-600"
              />
              Sou aluno PNEE (necessidade educacional específica)
            </label>

            {pneeForm.necessidades_especiais && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Tipo de necessidade (opcional)"
                  value={pneeForm.tipo_necessidade}
                  onChange={(e) => setPneeForm((f) => ({ ...f, tipo_necessidade: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setPneeForm((f) => ({ ...f, laudo: e.target.files?.[0] || null }))}
                  className="w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-700 file:text-white file:text-xs file:font-semibold hover:file:bg-emerald-800"
                />
                <p className="text-[11px] text-gray-400">Laudo em PDF, PNG ou JPG (opcional). O Mediador pode validá-lo depois.</p>
              </div>
            )}

            {pneeMsg && (
              <p className={`text-xs font-medium ${pneeMsg.ok ? 'text-emerald-700' : 'text-red-600'}`}>
                {pneeMsg.texto}
              </p>
            )}

            <button
              onClick={handleSalvarPnee}
              disabled={salvandoPnee}
              className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-colors"
            >
              {salvandoPnee ? 'Salvando...' : 'Salvar status PNEE'}
            </button>
          </div>
        )}

        {/* Botão de Complemento de Perfil para Professor */}
        {isProfessor && (
          <button
            onClick={() => navigate('/professor/completar-perfil')}
            className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <span>📚 Editar / Vincular Minhas Disciplinas e Turmas</span>
          </button>
        )}

        {/* Botões de Ação Inferiores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 px-4 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>

          <button
            onClick={handleSair}
            className="w-full py-3 px-4 border border-red-200 rounded-xl bg-white hover:bg-red-50 text-red-600 text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair da conta
          </button>
        </div>

      </div>
    </div>
  );
};

export default Perfil;
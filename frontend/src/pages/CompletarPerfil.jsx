import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CompletarPerfil() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);

  // Estados do formulário
  const [emailEscolar, setEmailEscolar] = useState('');
  const [curriculos, setCurriculos] = useState([]);
  const [cursoSelecionado, setCursoSelecionado] = useState('');
  const [anoLetivo, setAnoLetivo] = useState('1º Ano');
  
  // Estados TAI (Aluno)
  const [isTaiClaimed, setIsTaiClaimed] = useState(false);
  const [laudoFile, setLaudoFile] = useState(null);
  const [laudoPreviewName, setLaudoPreviewName] = useState('');

  // Estados Professor
  const [disciplinasSelecionadas, setDisciplinasSelecionadas] = useState([]);
  const [turmasSelecionadas, setTurmasSelecionadas] = useState([]);

  // Geral
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  useEffect(() => {
    const dadosStorage = localStorage.getItem('usuario');
    if (!dadosStorage) {
      navigate('/login');
      return;
    }
    const usr = JSON.parse(dadosStorage);
    setUsuario(usr);
    setEmailEscolar(usr.email_escolar || usr.email || '');
    if (usr.curso) setCursoSelecionado(usr.curso);

    fetch('http://localhost:8000/api/curriculos')
      .then((res) => res.json())
      .then((data) => {
        setCurriculos(data);
        if (data.length > 0 && !usr.curso) {
          setCursoSelecionado(data[0].nome);
        }
      })
      .catch((err) => {
        console.error('Erro ao carregar matrizes curriculares:', err);
      });
  }, [navigate]);

  if (!usuario) return null;

  const isProfessor = usuario.tipo_vinculo && (
    usuario.tipo_vinculo.toLowerCase().includes('servidor') || 
    usuario.tipo_vinculo.toLowerCase().includes('professor') ||
    usuario.role === 'professor'
  );

  const cursoAtual = curriculos.find((c) => c.nome === cursoSelecionado) || curriculos[0];
  const disciplinasDoCurso = cursoAtual?.anos?.flatMap((a) => a.disciplinas) || [];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLaudoFile(file);
      setLaudoPreviewName(file.name);
    }
  };

  const toggleDisciplina = (disc) => {
    if (disciplinasSelecionadas.includes(disc)) {
      setDisciplinasSelecionadas(disciplinasSelecionadas.filter((d) => d !== disc));
    } else {
      setDisciplinasSelecionadas([...disciplinasSelecionadas, disc]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailLower = emailEscolar.trim().toLowerCase();
    
    if (!isProfessor && !emailLower.endsWith('@escolar.ifrn.edu.br')) {
      setMensagem({
        tipo: 'erro',
        texto: 'O email escolar do aluno deve terminar obrigatoriamente com @escolar.ifrn.edu.br (exemplo: usuario@escolar.ifrn.edu.br).'
      });
      setLoading(false);
      return;
    }

    if (isProfessor && !emailLower.endsWith('@ifrn.edu.br') && !emailLower.endsWith('@escolar.ifrn.edu.br')) {
      setMensagem({
        tipo: 'erro',
        texto: 'O email do professor deve terminar com @ifrn.edu.br ou @escolar.ifrn.edu.br.'
      });
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('matricula', usuario.matricula);
      formData.append('email_escolar', emailEscolar);
      formData.append('curso', cursoSelecionado);

      if (!isProfessor) {
        formData.append('ano_letivo', anoLetivo);
        formData.append('is_tai_claimed', isTaiClaimed ? 'true' : 'false');
        if (isTaiClaimed && laudoFile) {
          formData.append('laudo', laudoFile);
        }
      } else {
        formData.append('disciplinas', JSON.stringify(disciplinasSelecionadas));
        formData.append('turmas', JSON.stringify(turmasSelecionadas));
      }

      const response = await fetch('http://localhost:8000/api/perfil/completar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erro ao salvar informações do perfil.');
      }

      const resData = await response.json();
      
      const usuarioAtualizado = {
        ...usuario,
        ...resData.usuario,
        perfil_preenchido: true,
      };
      localStorage.setItem('usuario', JSON.stringify(usuarioAtualizado));

      setMensagem({ tipo: 'sucesso', texto: 'Informações salvas com sucesso! Redirecionando...' });
      
      setTimeout(() => {
        if (isProfessor) {
          navigate('/professor');
        } else {
          navigate('/');
        }
      }, 1200);
    } catch (err) {
      console.error(err);
      setMensagem({ tipo: 'erro', texto: err.message || 'Erro ao salvar. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const iniciais = usuario.nome
    ? usuario.nome.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  const urlFoto = usuario.foto
    ? (usuario.foto.startsWith('http') ? usuario.foto : `https://suap.ifrn.edu.br${usuario.foto}`)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-2xl w-full bg-white border border-gray-200 rounded-2xl shadow-xl p-6 sm:p-8">
        
        {/* Topo / Header */}
        <div className="flex items-center space-x-4 border-b border-gray-100 pb-6 mb-6">
          {urlFoto ? (
            <img
              src={urlFoto}
              alt={usuario.nome}
              className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-xl flex items-center justify-center shadow-sm">
              {iniciais}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Complementação de Perfil
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Olá, <strong className="text-gray-800">{usuario.nome}</strong> ({isProfessor ? 'Professor' : 'Aluno'}) — complete suas informações acadêmicas para acessar a plataforma.
            </p>
          </div>
        </div>

        {/* Mensagens de Alerta */}
        {mensagem.texto && (
          <div
            className={`p-4 rounded-xl mb-6 text-sm font-medium border ${
              mensagem.tipo === 'sucesso'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {mensagem.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Email Escolar */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email Escolar / Institucional <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={emailEscolar}
              onChange={(e) => setEmailEscolar(e.target.value)}
              placeholder="exemplo@aluno.ifrn.edu.br ou exemplo@ifrn.edu.br"
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
            />
          </div>

          {/* Seleção de Curso */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Curso Técnico / Graduação <span className="text-red-500">*</span>
            </label>
            <select
              value={cursoSelecionado}
              onChange={(e) => setCursoSelecionado(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
            >
              {curriculos.map((c) => (
                <option key={c.id || c.nome} value={c.nome}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          {/* ÁREA DO ALUNO */}
          {!isProfessor && (
            <>
              {/* Seleção do Ano Letivo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ano Letivo Atual <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {['1º Ano', '2º Ano', '3º Ano', '4º Ano'].map((ano) => (
                    <button
                      type="button"
                      key={ano}
                      onClick={() => setAnoLetivo(ano)}
                      className={`py-2.5 px-4 rounded-lg border text-sm font-medium transition-all ${
                        anoLetivo === ano
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                          : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400'
                      }`}
                    >
                      {ano}
                    </button>
                  ))}
                </div>
              </div>

              {/* Seção Aluno TAI & Laudo */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-5 space-y-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="taiCheck"
                    checked={isTaiClaimed}
                    onChange={(e) => setIsTaiClaimed(e.target.checked)}
                    className="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="taiCheck" className="cursor-pointer">
                    <span className="block text-sm font-bold text-gray-900">
                      Sou Aluno TAI (Tutoria / Atendimento Individualizado / Necessidades Especiais)
                    </span>
                    <span className="block text-xs text-gray-600 mt-0.5 leading-relaxed">
                      Marque esta opção se necessita de acompanhamento TAI. Sua solicitação será enviada para validação do Administrador. Enquanto aguarda, você acessa e solicita atendimentos normalmente.
                    </span>
                  </label>
                </div>

                {/* File Upload do Laudo */}
                {isTaiClaimed && (
                  <div className="pt-3 border-t border-emerald-200/80">
                    <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
                      Anexar Laudo Médico ou Comprovante (PDF ou Imagem)
                    </label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl cursor-pointer bg-white hover:bg-emerald-50/50 transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-8 h-8 mb-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="mb-1 text-xs text-gray-700">
                            <span className="font-semibold text-emerald-700">Clique para selecionar</span> ou arraste o laudo
                          </p>
                          <p className="text-[11px] text-gray-500">Arquivos em formato PDF, PNG ou JPG</p>
                        </div>
                        <input
                          type="file"
                          accept="application/pdf,image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {laudoPreviewName && (
                      <div className="mt-2.5 p-2 bg-emerald-100/70 border border-emerald-300 rounded-lg flex items-center justify-between text-xs text-emerald-900">
                        <span className="font-medium truncate">📎 Arquivo: {laudoPreviewName}</span>
                        <span className="text-emerald-700 font-bold">Pronto</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ÁREA DO PROFESSOR */}
          {isProfessor && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Selecione as Disciplinas que você leciona neste curso:
                </label>
                <div className="max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl p-3 space-y-1.5 shadow-inner">
                  {disciplinasDoCurso.length === 0 ? (
                    <p className="text-xs text-gray-500">Selecione um curso para visualizar as matérias disponíveis.</p>
                  ) : (
                    disciplinasDoCurso.map((disc, idx) => {
                      const selected = disciplinasSelecionadas.includes(disc);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleDisciplina(disc)}
                          className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer text-xs font-medium transition-all ${
                            selected
                              ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                              : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span>{disc}</span>
                          <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${selected ? 'bg-emerald-600 text-white font-bold' : 'border border-gray-300'}`}>
                            {selected ? '✓' : ''}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Botão de Submissão */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span>Salvando informações...</span>
            ) : (
              <span>Concluir Cadastro e Acessar →</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

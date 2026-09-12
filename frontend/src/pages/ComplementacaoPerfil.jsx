import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { completarPerfil } from '../services/api';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@escolar\.ifrn\.edu\.br$/;

// Espelha CURSOS_TURMAS do backend — cursos e seus códigos de turma
const CURSOS_TURMAS = [
  { id: 'informatica_internet', nome: 'Informática para Internet', codigos: ['1M', '2M', '1V', '2V'] },
  { id: 'eletrotecnica',        nome: 'Eletrotécnica',             codigos: ['1M', '1V'] },
  { id: 'vestuario',            nome: 'Vestuário',                 codigos: ['1M', '1V'] },
  { id: 'textil',               nome: 'Têxtil',                    codigos: ['1M', '1V'] },
];

const TURNO_LABEL = { M: 'Matutino', V: 'Vespertino' };

function anoIngressoDaMatricula(matricula) {
  if (!matricula || matricula.length < 4) return null;
  const ano = parseInt(matricula.slice(0, 4), 10);
  return isNaN(ano) ? null : ano;
}

export default function ComplementacaoPerfil() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState(null);
  const [email, setEmail]     = useState('');
  const [turmaId, setTurmaId] = useState('');
  const [isTai, setIsTai]     = useState(false);
  const [laudo, setLaudo]     = useState(null);
  const [erro, setErro]       = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const dados = localStorage.getItem('usuario') || localStorage.getItem('suap_user');
    if (!dados) { navigate('/login', { replace: true }); return; }
    const parsed = JSON.parse(dados);
    if (parsed.perfil_completo) { navigate('/', { replace: true }); return; }
    setUsuario(parsed);
    setEmail(parsed.email?.endsWith('@escolar.ifrn.edu.br') ? parsed.email : '');
  }, [navigate]);

  const anoIngresso = useMemo(
    () => (usuario ? anoIngressoDaMatricula(usuario.matricula) : null),
    [usuario]
  );

  // Gera todas as turmas a exibir: { id, label, turno }
  const todasTurmas = useMemo(() => {
    if (!anoIngresso) return [];
    return CURSOS_TURMAS.flatMap((curso) =>
      curso.codigos.map((cod) => {
        const turnoLetra = cod.slice(-1);
        return {
          id: `${curso.id}_${anoIngresso}_${cod}`,
          label: `${curso.nome} ${anoIngresso}.1 ${cod}`,
          turno: turnoLetra,
          turnoLabel: TURNO_LABEL[turnoLetra] || turnoLetra,
          cod,
          cursoNome: curso.nome,
        };
      })
    );
  }, [anoIngresso]);

  // Agrupa por turno para exibição
  const turmasPorTurno = useMemo(() => {
    const grupos = {};
    for (const t of todasTurmas) {
      if (!grupos[t.turno]) grupos[t.turno] = [];
      grupos[t.turno].push(t);
    }
    return grupos;
  }, [todasTurmas]);

  function handleLaudoChange(e) {
    const file = e.target.files?.[0];
    if (file) setLaudo(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');

    if (!EMAIL_REGEX.test(email.trim().toLowerCase())) {
      setErro('Use um e-mail terminado em @escolar.ifrn.edu.br');
      return;
    }
    if (!turmaId) {
      setErro('Selecione sua turma.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('email', email.trim().toLowerCase());
      formData.append('turma_id', turmaId);
      formData.append('necessidades_especiais', isTai ? 'true' : 'false');
      if (usuario.foto) formData.append('foto', usuario.foto);
      if (isTai && laudo) formData.append('laudo', laudo);

      await completarPerfil(usuario.matricula, formData);
      localStorage.setItem('suap_access_token', 'suap-oauth');
      localStorage.setItem('suap_token_expiry', String(Date.now() + 24 * 60 * 60 * 1000));
      navigate('/', { replace: true });
    } catch (err) {
      // Se o usuário não foi encontrado no banco, a sessão do SUAP está desatualizada
      if (err.message?.includes('não encontrado') || err.message?.includes('not found')) {
        localStorage.removeItem('usuario');
        localStorage.removeItem('suap_user');
        localStorage.removeItem('suap_access_token');
        localStorage.removeItem('suap_token_expiry');
        navigate('/login', { replace: true });
        return;
      }
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!usuario) return null;

  const urlFoto = usuario.foto
    ? usuario.foto.startsWith('http') ? usuario.foto : `https://suap.ifrn.edu.br${usuario.foto}`
    : null;

  const turmaSelecionada = todasTurmas.find((t) => t.id === turmaId) || null;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-gray-100 p-8">

        {/* Cabeçalho */}
        <div className="flex items-center gap-4 mb-6">
          {urlFoto ? (
            <img src={urlFoto} alt={usuario.nome} className="w-16 h-16 rounded-full object-cover border-2 border-emerald-100" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-emerald-700 flex items-center justify-center text-white text-xl font-bold">
              {usuario.nome?.charAt(0) || 'A'}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">Complementação de Perfil</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Olá, <strong>{usuario.nome}</strong> ({usuario.tipo_vinculo || 'Aluno'}) — complete suas informações acadêmicas para acessar a plataforma.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Email Escolar / Institucional <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@escolar.ifrn.edu.br"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Somente e-mails @escolar.ifrn.edu.br são aceitos.</p>
          </div>

          {/* Turma */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Turma <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-3">
              Selecione a turma em que você está matriculado. O ano ({anoIngresso}) foi identificado automaticamente pela sua matrícula.
            </p>

            {/* Matutino */}
            {turmasPorTurno['M'] && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Matutino</p>
                <div className="flex flex-wrap gap-2">
                  {turmasPorTurno['M'].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTurmaId(t.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all text-left ${
                        turmaId === t.id
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-400'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Vespertino */}
            {turmasPorTurno['V'] && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Vespertino</p>
                <div className="flex flex-wrap gap-2">
                  {turmasPorTurno['V'].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTurmaId(t.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all text-left ${
                        turmaId === t.id
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-400'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Confirmação */}
            {turmaSelecionada && (
              <div className="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-emerald-800">
                  Turma selecionada: <strong>{turmaSelecionada.label}</strong>
                </span>
              </div>
            )}
          </div>

          {/* TAI */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isTai}
                onChange={(e) => setIsTai(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
              />
              <div>
                <span className="text-sm font-semibold text-emerald-900">
                  Sou Aluno TAI (Tutoria / Atendimento Individualizado / Necessidades Especiais)
                </span>
                <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                  Marque esta opção se necessita de acompanhamento TAI. Sua solicitação será enviada para validação do Administrador. Enquanto aguarda, você acessa e solicita atendimentos normalmente.
                </p>
              </div>
            </label>

            {isTai && (
              <div>
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-2">
                  Anexar laudo médico ou comprovante (PDF ou imagem)
                </p>
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-emerald-300 rounded-xl cursor-pointer bg-white hover:bg-emerald-50/50 transition-colors">
                  <svg className="w-8 h-8 text-emerald-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-xs text-emerald-700 text-center px-4">
                    {laudo ? laudo.name : 'Clique para selecionar ou arraste o laudo. PDF, PNG ou JPG.'}
                  </span>
                  <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleLaudoChange} />
                </label>
              </div>
            )}
          </div>

          {!isTai && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800">
              Apenas alunos TAI podem solicitar Centros de Aprendizagem (CA). Você poderá acessar a plataforma normalmente, mas a solicitação de CA ficará indisponível.
            </div>
          )}

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">{erro}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? 'Salvando...' : 'Concluir Cadastro e Acessar →'}
          </button>
        </form>
      </div>
    </div>
  );
}

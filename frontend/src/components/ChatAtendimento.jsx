import React, { useState, useEffect, useRef } from 'react';
import { buscarMensagens, enviarMensagem, marcarMensagensComoLidas, resolverUsuarioId } from '../services/chat';

const POLL_INTERVAL = 6000; // 6 segundos de polling

function formatarHora(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatarData(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const hoje = new Date();
  if (
    d.getDate() === hoje.getDate() &&
    d.getMonth() === hoje.getMonth() &&
    d.getFullYear() === hoje.getFullYear()
  ) {
    return 'Hoje';
  }
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default function ChatAtendimento({
  atendimentoId,
  titulo = 'Chat do Atendimento',
  abertoInicial = true,
  onFechar = null
}) {
  const [usuarioLocal, setUsuarioLocal] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('usuario') || localStorage.getItem('suap_user') || '{}');
    } catch { return {}; }
  });

  const [autorId, setAutorId] = useState(() => usuarioLocal?.id || usuarioLocal?.matricula || null);
  const autorNome = usuarioLocal?.nome || 'Você';

  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [aberto, setAberto] = useState(abertoInicial);
  const [naoLidas, setNaoLidas] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const pollRef = useRef(null);

  // Se o usuário não tem id numérico salvo, tenta resolver pela matrícula
  useEffect(() => {
    if (!usuarioLocal?.id && usuarioLocal?.matricula) {
      resolverUsuarioId(usuarioLocal.matricula).then((res) => {
        if (res?.id) {
          setAutorId(res.id);
          const atualizado = { ...usuarioLocal, id: res.id };
          localStorage.setItem('usuario', JSON.stringify(atualizado));
          setUsuarioLocal(atualizado);
        }
      });
    }
  }, [usuarioLocal?.matricula]);

  const carregar = async () => {
    if (!atendimentoId) return;
    try {
      const dados = await buscarMensagens(atendimentoId);
      setMensagens(dados || []);
      const nl = (dados || []).filter(m => m.autor_id !== autorId && !m.lida).length;
      setNaoLidas(nl);
      setErro('');
    } catch (err) {
      console.warn('Erro ao carregar mensagens:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (!atendimentoId) return;
    setAberto(true); // Garante que abre quando o atendimentoId muda
    setCarregando(true);
    carregar();
    pollRef.current = setInterval(carregar, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [atendimentoId]);

  useEffect(() => {
    if (aberto) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      if (autorId && atendimentoId) {
        marcarMensagensComoLidas(atendimentoId, autorId).catch(() => {});
      }
      setNaoLidas(0);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [aberto, mensagens.length]);

  const handleEnviar = async (e) => {
    e.preventDefault();
    const idParaEnvio = autorId || usuarioLocal?.matricula;
    if (!texto.trim() || !idParaEnvio) return;
    setEnviando(true);
    setErro('');
    try {
      const nova = await enviarMensagem(atendimentoId, idParaEnvio, texto.trim());
      setMensagens(prev => [...prev, nova]);
      setTexto('');
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      setErro(err.message || 'Erro ao enviar mensagem');
    } finally {
      setEnviando(false);
    }
  };

  // Agrupa mensagens por data
  const grupos = mensagens.reduce((acc, m) => {
    const data = formatarData(m.criado_em);
    if (!acc[data]) acc[data] = [];
    acc[data].push(m);
    return acc;
  }, {});

  if (!atendimentoId) return null;

  const fecharChat = () => {
    setAberto(false);
    if (onFechar) onFechar();
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2 animate-in fade-in duration-200">
      {/* Painel de mensagens */}
      {aberto && (
        <div className="w-[340px] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden transition-all"
          style={{ height: '490px', maxHeight: '85vh' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 px-4 py-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-600/40 border border-emerald-400/30 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-bold truncate leading-tight">{titulo}</p>
                <p className="text-emerald-300 text-[10px]">Atendimento #{atendimentoId}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setAberto(false)}
                title="Minimizar chat"
                className="text-emerald-200 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={fecharChat}
                title="Fechar chat"
                className="text-emerald-200 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1 bg-gray-50" style={{ minHeight: '280px' }}>
            {mensagens.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8 text-gray-400">
                <svg className="w-10 h-10 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-xs font-medium text-gray-500">Nenhuma mensagem ainda.</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Inicie a conversa!</p>
              </div>
            ) : (
              Object.entries(grupos).map(([data, msgs]) => (
                <div key={data}>
                  {/* Separador de data */}
                  <div className="flex items-center gap-2 my-3">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-[10px] text-gray-400 font-medium px-2 bg-gray-50">{data}</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {msgs.map((m, i) => {
                    const isAutor = m.autor_id === autorId;
                    const showAutor = i === 0 || msgs[i - 1]?.autor_id !== m.autor_id;
                    return (
                      <div key={m.id} className={`flex flex-col mb-1 ${isAutor ? 'items-end' : 'items-start'}`}>
                        {showAutor && !isAutor && (
                          <span className="text-[10px] text-gray-400 font-medium ml-1 mb-0.5">{m.autor_nome}</span>
                        )}
                        <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-snug shadow-sm ${
                          isAutor
                            ? 'bg-emerald-600 text-white rounded-tr-sm'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm'
                        }`}>
                          {m.mensagem}
                        </div>
                        <span className={`text-[10px] mt-0.5 ${isAutor ? 'text-gray-400 mr-1' : 'text-gray-400 ml-1'}`}>
                          {formatarHora(m.criado_em)}
                          {isAutor && (
                            <span className="ml-1">{m.lida ? '✓✓' : '✓'}</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Erro */}
          {erro && (
            <div className="px-3 py-1 bg-red-50 border-t border-red-100">
              <p className="text-xs text-red-600">{erro}</p>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleEnviar}
            className="border-t border-gray-200 bg-white p-2 flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleEnviar(e);
                }
              }}
              placeholder="Digite uma mensagem..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
              style={{ maxHeight: '80px', overflowY: 'auto' }}
            />
            <button
              type="submit"
              disabled={enviando || !texto.trim()}
              className="shrink-0 w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors"
            >
              {enviando ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Botão flutuante */}
      <button
        onClick={() => setAberto(v => !v)}
        className="relative w-14 h-14 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 shadow-lg hover:shadow-xl text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        title="Abrir chat do atendimento"
      >
        {aberto ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {naoLidas > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                {naoLidas > 9 ? '9+' : naoLidas}
              </span>
            )}
          </>
        )}
      </button>
    </div>
  );
}

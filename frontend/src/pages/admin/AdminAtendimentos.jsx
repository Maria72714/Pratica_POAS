import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../services/httpClient';
import ChatAtendimento from '../../components/ChatAtendimento';
import PageShell from '../../components/ui/PageShell';
import PageHeader from '../../components/ui/PageHeader';

function formatarData(iso) {
  if (!iso) return '—';
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

async function buscarAtendimentosAdmin() {
  try {
    const res = await apiFetch('/atendimentos/admin/todos');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default function AdminAtendimentos() {
  const [atendimentos, setAtendimentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [chatAtendimentoId, setChatAtendimentoId] = useState(null);
  const [chatTitulo, setChatTitulo] = useState('Chat do Atendimento');

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        setErro('');
        const dados = await buscarAtendimentosAdmin();
        if (ativo) setAtendimentos(Array.isArray(dados) ? dados : []);
      } catch (e) {
        if (ativo) setErro(e.message || 'Não foi possível carregar os atendimentos.');
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  const abrirChat = (atendimento) => {
    setChatAtendimentoId(atendimento.id);
    setChatTitulo(atendimento.assunto || atendimento.disciplina_nome || 'Atendimento');
  };

  return (
    <PageShell>
      <PageHeader
        role="admin"
        badge="Administração"
        title="Atendimentos"
        subtitle="Acompanhe todos os atendimentos da plataforma, acesse o chat e os links de CA Online."
      />

      <div className="space-y-4">
        {erro && (
          <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
            {erro}
          </div>
        )}

        {carregando ? (
          <p className="text-sm text-gray-500 py-8 text-center">Carregando atendimentos...</p>
        ) : atendimentos.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500 shadow-sm">
            <p className="font-semibold text-gray-800">Nenhum atendimento registrado.</p>
            <p className="text-xs text-gray-400 mt-1">
              Os atendimentos criados por professores aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {atendimentos.map((atend) => (
              <div
                key={atend.id}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Atendimento #{atend.id} • {atend.disciplina_nome}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        atend.status?.toUpperCase() === 'CANCELADO'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {atend.status}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-gray-100 text-gray-600">
                      {atend.tipo_atendimento}
                    </span>
                    {atend.tem_selo && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-50 text-slate-700 border border-slate-200">
                        Selo do Mediador
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-gray-800 break-words">{atend.assunto}</h3>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 pt-1">
                    <span>
                      Aluno:{' '}
                      <strong className="text-gray-700">{atend.aluno_nome || 'Não identificado'}</strong>
                      {atend.aluno_matricula ? ` (${atend.aluno_matricula})` : ''}
                    </span>
                    <span>
                      Professor: <strong className="text-gray-700">{atend.professor_nome || 'A definir'}</strong>
                    </span>
                    <span>
                      Data: <strong className="text-gray-700">{formatarData(atend.data_atendimento)}</strong>
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-end gap-2">
                  {atend.link_ca_online && (
                    <a
                      href={atend.link_ca_online}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      🌐 CA Online
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => abrirChat(atend)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                      chatAtendimentoId === atend.id
                        ? 'bg-slate-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-900 text-white'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    {chatAtendimentoId === atend.id ? 'Chat Aberto' : 'Abrir Chat'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {chatAtendimentoId && (
        <ChatAtendimento
          atendimentoId={chatAtendimentoId}
          titulo={chatTitulo}
          abertoInicial={true}
          onFechar={() => setChatAtendimentoId(null)}
        />
      )}
    </PageShell>
  );
}

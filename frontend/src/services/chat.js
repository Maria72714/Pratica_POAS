import { apiFetch, apiJson } from './httpClient';

const PREFIX = '/chat';

export async function resolverUsuarioId(matriculaOuId) {
  try {
    return await apiJson(`${PREFIX}/usuario-id/${encodeURIComponent(matriculaOuId)}`);
  } catch {
    return null;
  }
}

export async function buscarMensagens(atendimentoId) {
  if (!atendimentoId) return [];
  try {
    return await apiJson(`${PREFIX}/${atendimentoId}`);
  } catch (e) {
    if (String(e.message).includes('404')) return [];
    throw e;
  }
}

export async function enviarMensagem(atendimentoId, autorId, mensagem) {
  return apiJson(`${PREFIX}/`, {
    method: 'POST',
    body: JSON.stringify({
      atendimento_id: Number(atendimentoId),
      autor_id: autorId,
      mensagem,
    }),
  });
}

export async function marcarMensagensComoLidas(atendimentoId, leitorId) {
  try {
    return await apiJson(`${PREFIX}/${atendimentoId}/lidas?leitor_id=${leitorId}`, {
      method: 'PATCH',
    });
  } catch {
    return null;
  }
}

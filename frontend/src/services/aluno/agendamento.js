import { apiJson } from '../httpClient';

const PREFIX = '/atendimentos';

export async function buscarAtendimentos(matricula) {
  return apiJson(`${PREFIX}/aluno/${matricula}`);
}

export async function buscarAtendimentoPorId(id) {
  return apiJson(`${PREFIX}/${id}`);
}

export async function excluirAtendimento(atendimentoId) {
  return apiJson(`${PREFIX}/${atendimentoId}`, { method: 'DELETE' });
}

export async function editarAtendimento(atendimentoId, dadosAtualizados) {
  return apiJson(`${PREFIX}/${atendimentoId}`, {
    method: 'PATCH',
    body: JSON.stringify(dadosAtualizados),
  });
}

export async function cadastrarAtendimento(dados) {
  return apiJson(PREFIX, {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

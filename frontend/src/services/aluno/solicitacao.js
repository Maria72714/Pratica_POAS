import { apiJson } from '../httpClient';

const PREFIX = '/solicitacao';

export async function cadastrarSolicitacao(dados) {
  return apiJson(PREFIX, {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

export async function buscarSolicitacoes(matricula) {
  return apiJson(`${PREFIX}/aluno/${matricula}`);
}

export async function buscarSolicitacoesPendentes() {
  return apiJson(`${PREFIX}/pendentes`);
}

export async function selarSolicitacao(solicitacaoId, idMediador) {
  return apiJson(`${PREFIX}/${solicitacaoId}/selar`, {
    method: 'POST',
    body: JSON.stringify({ id_mediador: idMediador }),
  });
}

export async function removerSeloSolicitacao(solicitacaoId) {
  return apiJson(`${PREFIX}/${solicitacaoId}/remover-selo`, { method: 'POST' });
}

export async function decidirSolicitacao(solicitacaoId, status, idProfessor = null, idMediador = null) {
  return apiJson(`${PREFIX}/${solicitacaoId}/avaliar`, {
    method: 'POST',
    body: JSON.stringify({
      status,
      id_professor: idProfessor,
      id_mediador: idMediador,
    }),
  });
}

export async function editarSolicitacao(solicitacaoId, dadosAtualizados) {
  return apiJson(`${PREFIX}/${solicitacaoId}`, {
    method: 'PATCH',
    body: JSON.stringify(dadosAtualizados),
  });
}

export async function excluirSolicitacao(solicitacaoId) {
  return apiJson(`${PREFIX}/${solicitacaoId}`, { method: 'DELETE' });
}

export async function buscarSolicitacaoPorId(id) {
  return apiJson(`${PREFIX}/${id}`);
}

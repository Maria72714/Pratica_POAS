import { apiJson } from "./httpClient";

const PREFIX = "/atendimentos";

/** Lista os CAs visíveis ao usuário logado (mural, filtrado por papel no backend). */
export function buscarMuralCA() {
  return apiJson(`${PREFIX}/mural`);
}

/** Detalhes completos de um CA (alunos, avaliação, contagem de comentários). */
export function buscarDetalhesCA(atendimentoId) {
  return apiJson(`${PREFIX}/${atendimentoId}/detalhes`);
}

/** Comentários públicos do CA. */
export function buscarComentariosCA(atendimentoId) {
  return apiJson(`${PREFIX}/${atendimentoId}/comentarios`);
}

export function criarComentarioCA(atendimentoId, mensagem) {
  return apiJson(`${PREFIX}/${atendimentoId}/comentarios`, {
    method: "POST",
    body: JSON.stringify({ mensagem }),
  });
}

export function excluirComentarioCA(atendimentoId, comentarioId) {
  return apiJson(`${PREFIX}/${atendimentoId}/comentarios/${comentarioId}`, {
    method: "DELETE",
  });
}

/** Média e (para professor responsável/admin) a lista de avaliações. */
export function buscarAvaliacoesCA(atendimentoId) {
  return apiJson(`${PREFIX}/${atendimentoId}/avaliacao`);
}

/** Registra a avaliação do aluno (somente após o CA ser concluído). */
export function avaliarCA(atendimentoId, nota, comentario) {
  return apiJson(`${PREFIX}/${atendimentoId}/avaliacao`, {
    method: "POST",
    body: JSON.stringify({ nota, comentario }),
  });
}

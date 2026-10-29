import { apiJson } from '../httpClient';

const prefix = (matricula) => `/professores/${matricula}/horarios`;

export async function buscarHorariosProfessor(matricula) {
  return apiJson(prefix(matricula));
}

export async function adicionarHorarioProfessor(matricula, dados) {
  return apiJson(prefix(matricula), {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

export async function removerHorarioProfessor(matricula, horarioId) {
  return apiJson(`${prefix(matricula)}/${horarioId}`, { method: 'DELETE' });
}

export async function alternarHorarioProfessor(matricula, horarioId) {
  return apiJson(`${prefix(matricula)}/${horarioId}/toggle`, { method: 'PATCH' });
}

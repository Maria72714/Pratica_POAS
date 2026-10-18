import { apiJson } from '../httpClient';

export async function buscarAtendimentosProfessor(professorMatricula) {
  return apiJson(`/atendimentos/professor/${professorMatricula}`);
}

export async function cadastrarAtendimentoProfessor(dados) {
  return apiJson('/atendimentos/professor', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

export async function buscarPerfilProfessor(matricula) {
  return apiJson(`/professores/perfil/${matricula}`);
}

import { API_BASE, apiFetch, apiJson, clearAccessToken, setAccessToken } from './httpClient';

function mesclarPerfilUsuario(existing, data) {
  const camposSuap = ['foto', 'nome_completo', 'tipo_vinculo', 'is_aluno'];
  const merged = { ...existing, ...data, perfil_completo: true };
  for (const campo of camposSuap) {
    if (!merged[campo] && existing[campo]) {
      merged[campo] = existing[campo];
    }
  }
  return merged;
}

function salvarUsuarioLocal(usuario) {
  localStorage.setItem('usuario', JSON.stringify(usuario));
  localStorage.setItem('suap_user', JSON.stringify(usuario));
}

export function logoutUsuario() {
  localStorage.removeItem('usuario');
  localStorage.removeItem('suap_user');
  clearAccessToken();
}

export async function loginLocal(matricula, senha) {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matricula, senha }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Erro ao fazer login');
  }

  if (data.access_token) {
    setAccessToken(data.access_token);
  }

  return data;
}

export async function fetchCursos() {
  return apiJson('/cursos');
}

export async function fetchDisciplinas(cursoId, anoLetivo) {
  return apiJson(`/cursos/${cursoId}/${encodeURIComponent(anoLetivo)}/disciplinas`);
}

export async function fetchTurmas(anoIngresso) {
  const path = anoIngresso ? `/turmas?ano_ingresso=${anoIngresso}` : '/turmas';
  return apiJson(path);
}

export async function fetchTurmaSugestao(matricula, turno) {
  const res = await apiFetch(`/turmas/sugestao/${matricula}?turno=${turno}`);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchPerfilAluno(matricula) {
  return apiJson(`/alunos/perfil/${matricula}`);
}

export async function completarPerfil(matricula, formData) {
  const res = await apiFetch(`/alunos/perfil/${matricula}`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || 'Erro ao salvar perfil');
  const existing = JSON.parse(localStorage.getItem('usuario') || localStorage.getItem('suap_user') || '{}');
  const merged = mesclarPerfilUsuario(existing, data);
  salvarUsuarioLocal(merged);
  return merged;
}

export async function solicitarAcessoMediador(payload) {
  const response = await fetch(`${API_BASE}/usuarios/mediador/solicitar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || 'Erro ao enviar solicitação');
  return data;
}

export async function fetchNotificacoes(matriculaOuId) {
  const res = await apiFetch(`/notificacoes/${encodeURIComponent(matriculaOuId)}`);
  if (!res.ok) return [];
  return res.json();
}

export async function marcarNotificacaoComoLida(notificacaoId) {
  return apiJson(`/notificacoes/${notificacaoId}/ler`, { method: 'PUT' });
}

export async function marcarTodasNotificacoesComoLidas(matriculaOuId) {
  return apiJson(`/notificacoes/ler-todas/${encodeURIComponent(matriculaOuId)}`, { method: 'PUT' });
}

export async function deletarNotificacao(notificacaoId) {
  return apiJson(`/notificacoes/${notificacaoId}`, { method: 'DELETE' });
}

export async function fetchLaudosPnee() {
  return apiJson('/alunos/laudos');
}

export async function avaliarLaudoPnee(alunoId, aprovado) {
  return apiJson(`/alunos/${alunoId}/avaliar-laudo`, {
    method: 'PATCH',
    body: JSON.stringify({ aprovado }),
  });
}

export { salvarUsuarioLocal, setAccessToken, API_BASE };

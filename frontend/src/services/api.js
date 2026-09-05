const API_BASE = 'http://localhost:8000/api';

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
  localStorage.removeItem('suap_access_token');
  localStorage.removeItem('suap_token_expiry');
}

export async function loginLocal(matricula, senha) {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matricula, senha }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao fazer login');
  }

  return response.json();
}

export async function fetchCursos() {
  const res = await fetch(`${API_BASE}/cursos`);
  if (!res.ok) throw new Error('Erro ao carregar cursos');
  return res.json();
}

export async function fetchDisciplinas(cursoId, anoLetivo) {
  const res = await fetch(`${API_BASE}/cursos/${cursoId}/${encodeURIComponent(anoLetivo)}/disciplinas`);
  if (!res.ok) throw new Error('Erro ao carregar disciplinas');
  return res.json();
}

export async function fetchPerfilAluno(matricula) {
  const res = await fetch(`${API_BASE}/alunos/perfil/${matricula}`);
  if (!res.ok) throw new Error('Erro ao carregar perfil');
  return res.json();
}

export async function completarPerfil(matricula, formData) {
  const res = await fetch(`${API_BASE}/alunos/perfil/${matricula}`, {
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

export { salvarUsuarioLocal };

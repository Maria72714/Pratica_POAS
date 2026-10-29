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

export async function fetchDisciplinasLocais() {
  // Disciplinas cadastradas no banco local do pratiCA (não depende de SUAP)
  return apiJson('/disciplinas');
}

function normalizarDisciplinas(disciplinas) {
  if (!Array.isArray(disciplinas)) return [];
  // Pode ser array de strings ou de objetos {nome: "..."}
  return disciplinas.map(d => (typeof d === 'string' ? d : d?.nome)).filter(Boolean);
}

function salvarDisciplinasLocal(disciplinas) {
  try {
    const raw = localStorage.getItem('usuario') || localStorage.getItem('suap_user');
    if (!raw) return;
    const usuario = JSON.parse(raw);
    usuario.disciplinas = disciplinas;
    salvarUsuarioLocal(usuario);
  } catch (_) { /* ignorar erro de parse */ }
}

export async function fetchDisciplinasSuap() {
  /**
   * Disciplinas do usuário logado, vindas do SUAP.
   * 1) Re-sincroniza no backend, que usa o token do SUAP guardado no login.
   * 2) Se o backend não responder, usa o cache salvo no login.
   * Retorna array de strings com os nomes das disciplinas.
   */
  try {
    const data = await apiJson('/suap/minhas-disciplinas');
    const lista = normalizarDisciplinas(data?.disciplinas);
    if (lista.length > 0) {
      salvarDisciplinasLocal(lista);
      return lista;
    }
  } catch (_) { /* sem token SUAP válido: usa o cache local */ }

  try {
    const raw = localStorage.getItem('usuario') || localStorage.getItem('suap_user');
    if (raw) return normalizarDisciplinas(JSON.parse(raw)?.disciplinas);
  } catch (_) { /* ignorar erro de parse */ }

  return [];
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

export async function atualizarPnee(matricula, formData) {
  const res = await apiFetch(`/alunos/perfil/${matricula}/pnee`, {
    method: 'PATCH',
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || 'Erro ao atualizar status PNEE');
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

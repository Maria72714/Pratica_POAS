// Em dev, usa caminho relativo para aproveitar o proxy do Vite (funciona também
// no celular, sem CORS). Em produção, defina VITE_API_URL no .env do frontend.
export const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function getAccessToken() {
  return localStorage.getItem('access_token') || localStorage.getItem('suap_access_token');
}

export function setAccessToken(token) {
  if (!token) return;
  localStorage.setItem('access_token', token);
  localStorage.setItem('suap_access_token', token);
}

export function clearAccessToken() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('suap_access_token');
  localStorage.removeItem('suap_token_expiry');
}

export async function apiFetch(path, options = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = path.startsWith('http') ? path : `${API_BASE}${normalizedPath}`;

  const headers = { ...(options.headers || {}) };
  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const isFormData = options.body instanceof FormData;
  if (!isFormData && options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    clearAccessToken();
    localStorage.removeItem('usuario');
    localStorage.removeItem('suap_user');
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  }

  return response;
}

export async function apiJson(path, options = {}) {
  const response = await apiFetch(path, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data.detail;
    const message =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d) => d.msg || JSON.stringify(d)).join(', ')
          : data.message || 'Erro na requisição';
    throw new Error(message);
  }
  return data;
}

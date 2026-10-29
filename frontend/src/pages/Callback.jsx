import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/suapAuth';
import { API_BASE, setAccessToken } from '../services/httpClient';
import { salvarUsuarioLocal } from '../services/api';

function formatarErro(e) {
  if (typeof e?.detail === 'string') return e.detail;
  if (e?.message === 'Failed to fetch') {
    return 'Não foi possível conectar ao backend. Verifique se o servidor está rodando em http://localhost:8000.';
  }
  if (e?.message) return e.message;
  return 'Erro ao autenticar. Tente novamente.';
}

export default function Callback() {
  const navigate = useNavigate();
  const [erro, setErro] = useState(null);
  const processado = useRef(false);

  useEffect(() => {
    if (processado.current) return;
    processado.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code) {
      setErro('Código de autorização não encontrado na URL.');
      return;
    }

    fetch(`${API_BASE}/auth/suap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return Promise.reject(data);
        return data;
      })
      .then((usuario) => {
        if (usuario.access_token) {
          setAccessToken(usuario.access_token);
        }
        salvarUsuarioLocal(usuario);
        localStorage.setItem('suap_token_expiry', String(Date.now() + 24 * 60 * 60 * 1000));

        const vinculo = (usuario.tipo_vinculo || usuario.tipo || usuario.tipo_usuario || '').toLowerCase();
        const isAluno = Boolean(usuario.is_aluno || vinculo.includes('aluno') || usuario.tipo_usuario === 'aluno');
        const isProfessor = !isAluno && (
          vinculo.includes('professor') ||
          vinculo.includes('docente') ||
          vinculo.includes('servidor') ||
          usuario.tipo_usuario === 'professor'
        );

        let destino = '/';
        if (usuario.tipo_usuario === 'admin') {
          destino = '/admin';
        } else if (isAluno) {
          destino = (!usuario.perfil_completo) ? '/aluno/completar-perfil' : '/';
        } else if (isProfessor) {
          destino = '/professor';
        } else if (usuario.tipo_usuario === 'mediador') {
          destino = '/mediador';
        }

        navigate(destino, { replace: true });
      })
      .catch((e) => {
        console.error(e);
        setErro(formatarErro(e));
      });
  }, [navigate]);

  if (erro) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 font-sans">
        <p className="text-red-600 text-lg font-bold">Erro na Autenticação</p>
        <p className="text-slate-600 mt-4 max-w-md text-center">{erro}</p>
        <div className="flex flex-col gap-3 mt-8">
          <button
            type="button"
            onClick={login}
            className="px-6 py-2.5 bg-emerald-700 text-white rounded-lg font-semibold hover:bg-emerald-800"
          >
            Tentar Novamente no SUAP
          </button>
          <a href="/login" className="text-emerald-700 text-center underline text-sm">
            Ir para a página de Login local
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center text-slate-600">
      Autenticando...
    </div>
  );
}

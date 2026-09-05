import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/suapAuth';

const API_URL = 'http://localhost:8000/api/auth/suap';

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

    fetch(API_URL, {
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
        localStorage.setItem('usuario', JSON.stringify(usuario));
        localStorage.setItem('suap_user', JSON.stringify(usuario));
        localStorage.setItem('suap_access_token', 'suap-oauth');
        localStorage.setItem('suap_token_expiry', String(Date.now() + 24 * 60 * 60 * 1000));

        const isProfessor = (usuario.tipo_vinculo || '').toLowerCase().includes('professor');
        const isAluno = usuario.is_aluno || (usuario.tipo_vinculo || '').toLowerCase().includes('aluno');

        let destino = '/';
        if (isProfessor) destino = '/professor';
        else if (isAluno && !usuario.perfil_completo) destino = '/complementar-perfil';

        navigate(destino, { replace: true });
      })
      .catch((e) => {
        console.error(e);
        setErro(formatarErro(e));
      });
  }, [navigate]);

  if (erro) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
        <p style={{ color: 'red', fontSize: '18px', fontWeight: 'bold' }}>Erro na Autenticação</p>
        <p style={{ color: '#555', margin: '20px 0' }}>{erro}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={login}
            style={{ padding: '10px 24px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#047857', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
          >
            Tentar Novamente no SUAP
          </button>
          <a href="/login" style={{ color: '#047857', textDecoration: 'underline' }}>
            Ir para a página de Login local
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <p>Autenticando...</p>
    </div>
  );
}

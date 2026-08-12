import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:8000/api/auth/suap';

export default function Callback() {
  const navigate = useNavigate();
  const [erro, setErro] = useState(null);

  useEffect(() => {
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
      .then((res) => {
        if (!res.ok) return res.json().then((e) => Promise.reject(e));
        return res.json();
      })
      .then((usuario) => {
        localStorage.setItem('usuario', JSON.stringify(usuario));
        navigate('/');
      })
      .catch((e) => {
        console.error(e);
        setErro(e?.detail ?? 'Erro ao autenticar. Tente novamente.');
      });
  }, [navigate]);

  if (erro) {
    const CLIENT_ID = '6IPsGy1xSQlxdmEydLEfygqTVwoH06vkxdCwyZQa';
    const REDIRECT_URI = 'http://localhost:5173/callback';
    const SUAP_AUTH_URL =
      `https://suap.ifrn.edu.br/o/authorize/?response_type=code` +
      `&client_id=${CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

    return (
      <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
        <p style={{ color: 'red', fontSize: '18px', fontWeight: 'bold' }}>Erro na Autenticação</p>
        <p style={{ color: '#555', margin: '20px 0' }}>{erro}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          <a href={SUAP_AUTH_URL}>
            <button style={{ padding: '10px 24px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#047857', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
              Tentar Novamente no SUAP
            </button>
          </a>
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

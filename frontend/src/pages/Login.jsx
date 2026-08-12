import React from 'react';

const CLIENT_ID   = '6IPsGy1xSQlxdmEydLEfygqTVwoH06vkxdCwyZQa';
const REDIRECT_URI = 'http://localhost:5173/callback';

const SUAP_AUTH_URL =
  `https://suap.ifrn.edu.br/o/authorize/?response_type=code` +
  `&client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

export default function Login() {
  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Sistema POAS – IFRN Caicó</h1>
      <p>Faça login com sua conta institucional para continuar.</p>
      <a href={SUAP_AUTH_URL}>
        <button style={{ padding: '10px 24px', fontSize: '16px', cursor: 'pointer' }}>
          Entrar com SUAP
        </button>
      </a>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardAuth() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const dados = localStorage.getItem('usuario') || localStorage.getItem('suap_user');
    if (!dados) {
      navigate('/login');
      return;
    }
    setUsuario(JSON.parse(dados));
  }, [navigate]);

  function sair() {
    logout();
    navigate('/login', { replace: true });
  }

  if (!usuario) return null;

  return (
    <div style={{ maxWidth: '480px', margin: '60px auto', fontFamily: 'sans-serif' }}>
      <h2>Bem-vindo(a)!</h2>

      {usuario.foto && (
        <img
          src={usuario.foto}
          alt="Foto do perfil"
          style={{ width: '120px', borderRadius: '50%', display: 'block', marginBottom: '16px' }}
        />
      )}

      <p><strong>Nome usual:</strong> {usuario.nome}</p>
      <p><strong>Nome completo:</strong> {usuario.nome_completo}</p>
      <p><strong>Matrícula:</strong> {usuario.matricula}</p>
      <p><strong>E-mail:</strong> {usuario.email}</p>
      <p><strong>Tipo de vínculo:</strong> {usuario.tipo_vinculo}</p>

      <button
        onClick={sair}
        style={{ marginTop: '24px', padding: '8px 20px', cursor: 'pointer' }}
      >
        Sair
      </button>
    </div>
  );
}

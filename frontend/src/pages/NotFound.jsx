/**
 * NotFound.jsx — Página 404 responsiva para desktop e mobile
 * Mostra pets da ONG e formulário de doação de fotos
 * Design mobile: cartão único centralizado
 * Design desktop: layout dividido
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  const [pet, setPet] = useState(null);
  
  // Estados para o formulário
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [nomePet, setNomePet] = useState('');
  const [fotoPet, setFotoPet] = useState(null);
  const [enviadoComSucesso, setEnviadoComSucesso] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useEffect(() => {
    // Busca os pets reais do banco de dados (backend)
    fetch('http://localhost:8000/api/pets/')
      .then(response => response.json())
      .then(data => {
        if (data && data.length > 0) {
          // Sorteia um pet aleatório da lista real
          const petSorteado = data[Math.floor(Math.random() * data.length)];
          setPet({
            id: petSorteado.id,
            nome: petSorteado.nome,
            imagem: `http://localhost:8000${petSorteado.imagem_url}`,
            adotado: false,
            usuario_foto: petSorteado.nome_usuario
          });
        } else {
          // Fallback caso o banco esteja vazio
          setPet({
            nome: 'Amigo Misterioso',
            imagem: 'https://images.unsplash.com/photo-1537151608804-ea6d152a5598?q=80&w=600&auto=format&fit=crop',
            adotado: false,
            usuario_foto: 'Equipe da ONG'
          });
        }
      })
      .catch(error => {
        console.error("Erro ao buscar pets:", error);
        // Fallback em caso de erro na API
        setPet({
          nome: 'Amigo Misterioso',
          imagem: 'https://images.unsplash.com/photo-1537151608804-ea6d152a5598?q=80&w=600&auto=format&fit=crop',
          adotado: false,
          usuario_foto: 'Equipe da ONG'
        });
      });
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFotoPet(e.target.files[0]);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fotoPet) return;

    const formData = new FormData();
    formData.append('nome', nomePet);
    formData.append('nome_usuario', nomeUsuario);
    formData.append('foto', fotoPet);

    try {
      const response = await fetch('http://localhost:8000/api/pets/', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setEnviadoComSucesso(true);
        setNomeUsuario('');
        setNomePet('');
        setFotoPet(null);
        setTimeout(() => setEnviadoComSucesso(false), 5000);
      } else {
        alert("Erro ao enviar a foto. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro de conexão com o servidor.");
    }
  };

  if (!pet) return null;

  return (
    <>
      {/* Layout Mobile - Visível apenas em telas pequenas */}
      <div className="lg:hidden min-h-screen bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 p-4 flex flex-col justify-center relative">
        {/* Botão de voltar no canto superior esquerdo */}
        <div className="absolute top-6 left-6 z-10">
          <Link 
            to="/" 
            className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg hover:bg-white/30 transition-all"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        </div>

        {/* Cartão principal centralizado */}
        <div className="w-full max-w-sm mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10">
          
          {/* Imagem do pet no topo */}
          <div className="relative h-48 bg-gradient-to-br from-emerald-100 to-emerald-200">
            <img 
              src={pet.imagem} 
              alt={`Foto do ${pet.nome}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-sm font-semibold text-emerald-800">{pet.nome}</span>
            </div>
          </div>

          {/* Conteúdo do cartão */}
          <div className="p-8">
            {/* Número 404 e título */}
            <div className="text-center mb-6">
              <h1 className="text-6xl font-black text-emerald-600 mb-2">404</h1>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Ops! Você se perdeu
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                A página que você procura não existe, mas o(a) <strong className="text-emerald-700">{pet.nome}</strong> está aqui para fazer companhia!
              </p>
            </div>

            {/* QR Code para doação */}
            <div className="bg-emerald-50 rounded-2xl p-4 mb-6 border border-emerald-100">
              <div className="flex items-center gap-4">
                <div className="bg-white p-2 rounded-xl shadow-sm">
                  <img 
                    src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=doacao-ong" 
                    alt="QR Code para Doação"
                    className="w-16 h-16"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-emerald-800 text-sm mb-1">Ajude a ONG!</h3>
                  <p className="text-xs text-emerald-600 leading-relaxed">
                    Aproveite para ajudar os amigos do(a) {pet.nome} com qualquer valor.
                  </p>
                </div>
              </div>
            </div>

            {/* Botão de voltar */}
            <Link 
              to="/" 
              className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-200 shadow-lg mb-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Voltar ao Início</span>
            </Link>

            {/* Link para enviar foto */}
            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">
                Foto por: <span className="font-semibold text-gray-700">{pet.usuario_foto}</span>
              </p>
              <button 
                onClick={() => setMostrarFormulario(!mostrarFormulario)}
                className="text-sm text-emerald-600 font-semibold hover:text-emerald-700 underline"
              >
                Envie uma foto do seu pet!
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Layout Desktop - Visível apenas em telas grandes */}
      <div className="hidden lg:flex min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 items-center justify-center p-4 relative">
        
        {/* Container principal com cantos arredondados */}
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-row relative z-10">

          {/* Painel Esquerdo - Imagem do Pet */}
          <div className="w-1/2 relative bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center p-8 group">
            <img 
              src={pet.imagem} 
              alt={`Foto do ${pet.nome}`}
              className="w-full h-auto object-cover rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-105 max-h-96"
            />
            <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
              <span className="text-sm font-bold text-emerald-800">{pet.nome}</span>
            </div>
            
            {/* Botão de voltar no canto superior esquerdo */}
            <div className="absolute top-6 left-6">
              <Link 
                to="/" 
                className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg hover:bg-white/30 transition-all"
              >
                <svg className="w-6 h-6 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Painel Direito - Informações */}
          <div className="w-1/2 p-14 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
              
              {/* Número 404 e título */}
              <div className="flex items-center space-x-4 mb-6">
                <span className="text-7xl font-black text-emerald-600">404</span>
                <div className="h-16 w-1 bg-emerald-200 rounded-full"></div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 leading-tight mb-2">
                    Ops! Você se perdeu
                  </h1>
                  <p className="text-gray-600 text-lg">
                    A página que você procura não existe.
                  </p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-8 text-base leading-relaxed">
                Mas o(a) <strong className="text-emerald-700">{pet.nome}</strong> está aqui para te fazer companhia e alegrar seu dia!
              </p>

              {/* QR Code para doação */}
              <div className="bg-emerald-50 rounded-2xl p-6 mb-8 border border-emerald-100 flex items-center space-x-6">
                <div className="shrink-0 bg-white p-3 rounded-xl shadow-sm">
                  <img 
                    src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=doacao-ong" 
                    alt="QR Code para Doação"
                    className="w-20 h-20"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-800 mb-2 text-lg">Ajude a ONG!</h3>
                  <p className="text-sm text-emerald-600 leading-relaxed">
                    Aproveite o desvio para ajudar os amigos do(a) {pet.nome} com qualquer valor. Escaneie o QR Code para doar via PIX.
                  </p>
                </div>
              </div>

              {/* Botão de voltar */}
              <Link 
                to="/" 
                className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 active:bg-black text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 group mb-6"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Voltar ao Início</span>
                <svg className="w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              {/* Créditos da foto */}
              <div className="pt-6 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-500 mb-3">
                  Foto enviada por: <span className="font-semibold text-gray-700">{pet.usuario_foto}</span>
                </p>
                <button 
                  onClick={() => setMostrarFormulario(!mostrarFormulario)}
                  className="text-sm text-emerald-600 font-semibold hover:text-emerald-700 underline transition-colors"
                >
                  Quer ver o seu pet favorito aqui? Envie uma foto!
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center text-emerald-300 text-xs">
          © 2026 IFRN Campus Caicó — pratiCA. Todos os direitos reservados.
        </p>
      </div>
      {/* Formulário de Envio de Fotos - Responsivo */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 relative max-h-[90vh] overflow-y-auto">
            
            {/* Botão de fechar */}
            <button 
              onClick={() => setMostrarFormulario(false)}
              className="absolute top-6 right-6 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Cabeçalho do formulário */}
            <div className="text-center mb-8 pr-12">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-3">Quer ver o seu pet favorito aqui?</h2>
              <p className="text-gray-600 leading-relaxed">
                Envie uma foto de um dos animais da instituição para aparecer nesta página e alegrar outros visitantes!
              </p>
            </div>

            {/* Conteúdo do formulário */}
            {enviadoComSucesso ? (
              <div className="bg-emerald-100 border border-emerald-200 text-emerald-800 p-6 rounded-2xl text-center">
                <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Foto enviada com sucesso!</h3>
                <p className="text-sm">
                  Ela passará por uma rápida aprovação e logo poderá aparecer aqui para alegrar outros visitantes.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Campos de texto */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Seu Nome</label>
                    <input 
                      type="text" 
                      required
                      value={nomeUsuario}
                      onChange={(e) => setNomeUsuario(e.target.value)}
                      placeholder="Como quer ser chamado?"
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder-gray-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nome do Pet</label>
                    <input 
                      type="text" 
                      required
                      value={nomePet}
                      onChange={(e) => setNomePet(e.target.value)}
                      placeholder="Ex: Rex, Bolinha, Luna..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder-gray-400 transition-all"
                    />
                  </div>
                </div>

                {/* Upload de foto */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Foto do Pet</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-emerald-500 transition-colors bg-gray-50/50">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="mb-4">
                      <label htmlFor="file-upload" className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-6 rounded-2xl transition-colors inline-block">
                        Selecionar Arquivo
                        <input id="file-upload" name="file-upload" type="file" accept="image/png, image/jpeg" className="sr-only" onChange={handleFileChange} required />
                      </label>
                    </div>
                    <p className="text-sm text-gray-500">PNG, JPG até 5MB</p>
                    {fotoPet && (
                      <p className="text-sm font-semibold text-emerald-700 mt-3 bg-emerald-50 border border-emerald-100 rounded-xl py-2 px-4 inline-block">
                        ✅ {fotoPet.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Botão de envio */}
                <button 
                  type="submit"
                  className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Enviar Foto para Aprovação
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
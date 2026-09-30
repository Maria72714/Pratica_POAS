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
            imagem: `http://localhost:8000${petSorteado.imagem_url}`, // Aponta para a imagem no backend
            adotado: false, // Pode adicionar isso no banco depois se quiser
            usuario_foto: petSorteado.nome_usuario
          });
        } else {
          // Fallback caso o banco esteja vazio
          setPet({
            nome: 'Amigo Misterioso',
            imagem: 'https://images.unsplash.com/photo-1537151608804-ea6d152a5598?q=80&w=600&auto=format&fit=crop', // Imagem padrão
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
    <div className="min-h-screen bg-emerald-50 flex flex-col items-center py-10 px-6 text-emerald-900 font-sans">
      
      {/* Container Principal do Erro 404 */}
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-emerald-100 mb-10">
        
        {/* Lado esquerdo: Imagem do Pet */}
        <div className="md:w-1/2 relative bg-emerald-100 flex items-center justify-center p-8 group">
          <img 
            src={pet.imagem} 
            alt={`Foto do ${pet.nome}`}
            className="w-full h-auto object-cover rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-105"
            style={{ maxHeight: '400px' }}
          />
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-emerald-800 shadow-sm">
            Pet: <span className="font-bold">{pet.nome}</span>
          </div>
        </div>

        {/* Lado direito: Informações de Erro e Doação */}
        <div className="md:w-1/2 p-10 flex flex-col justify-center">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-5xl font-black text-emerald-600">404</span>
            <div className="h-10 w-1 bg-emerald-200 rounded-full"></div>
            <h1 className="text-2xl font-bold text-gray-800 leading-tight">
              Ops! Você se perdeu.
            </h1>
          </div>
          
          <p className="text-gray-600 mb-8 mt-4">
            A página que você está procurando não existe. Mas o(a) <strong className="text-emerald-700">{pet.nome}</strong> está aqui para te fazer companhia!
          </p>

          <div className="bg-emerald-50 rounded-2xl p-6 mb-8 border border-emerald-100 flex items-center space-x-6">
            <div className="shrink-0 bg-white p-2 rounded-xl shadow-sm">
              {/* QR Code Fictício - Em produção usaremos um de verdade (Pix) */}
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=doacao-ong" 
                alt="QR Code para Doação"
                className="w-20 h-20"
              />
            </div>
            <div>
              <h3 className="font-bold text-emerald-800 mb-1">Ajude a ONG!</h3>
              <p className="text-sm text-emerald-600">
                Aproveite o desvio para ajudar os amigos do(a) {pet.nome} com qualquer valor. Escaneie o QR Code.
              </p>
            </div>
          </div>

          <div className="flex justify-center w-full mt-2">
            <Link 
              to="/" 
              className="w-full sm:w-2/3 px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors text-center shadow-md"
            >
              Voltar ao Início
            </Link>
          </div>

          {/* Créditos da Foto */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center flex flex-col items-center">
            <p className="text-sm text-gray-500 mb-4">
              Foto enviada por: <span className="font-semibold text-gray-700">{pet.usuario_foto}</span>
            </p>
            <button 
              onClick={() => setMostrarFormulario(!mostrarFormulario)}
              className="text-sm text-emerald-600 font-semibold hover:text-emerald-700 underline"
            >
              Quer ver o seu pet favorito aqui? Envie uma foto!
            </button>
          </div>
        </div>
      </div>

      {/* Formulário de Envio de Fotos */}
      {mostrarFormulario && (
        <div className="max-w-4xl w-full bg-white rounded-3xl shadow-md p-8 border border-emerald-100 transition-all">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Quer ver o seu pet favorito aqui?</h2>
          <p className="text-gray-600 mt-2">Envie uma foto de um dos animais da instituição para aparecer nesta página.</p>
        </div>

        {enviadoComSucesso ? (
          <div className="bg-emerald-100 text-emerald-800 p-4 rounded-xl text-center font-semibold">
            Foto enviada com sucesso! Ela passará por uma rápida aprovação e logo poderá aparecer aqui.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seu Nome</label>
                <input 
                  type="text" 
                  required
                  value={nomeUsuario}
                  onChange={(e) => setNomeUsuario(e.target.value)}
                  placeholder="Como quer ser chamado?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Pet</label>
                <input 
                  type="text" 
                  required
                  value={nomePet}
                  onChange={(e) => setNomePet(e.target.value)}
                  placeholder="Ex: Rex, Bolinha..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1">Foto do Pet (Preferência sem fundo)</label>
              <div className="flex-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-emerald-500 transition-colors bg-gray-50 relative">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500 px-1">
                      <span>Selecione um arquivo</span>
                      <input id="file-upload" name="file-upload" type="file" accept="image/png, image/jpeg" className="sr-only" onChange={handleFileChange} required />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG até 5MB</p>
                  {fotoPet && (
                    <p className="text-sm font-semibold text-emerald-700 mt-2">
                      Arquivo selecionado: {fotoPet.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <button 
                type="submit"
                className="w-full px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 transition-colors"
              >
                Enviar Foto para Aprovação
              </button>
            </div>
          </form>
        )}
      </div>
      )}

    </div>
  );
}

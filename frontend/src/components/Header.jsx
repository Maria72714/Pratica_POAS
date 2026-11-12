import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faBell,
  faMagnifyingGlass,
  faXmark,
  faRightFromBracket,
  faArrowUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import {
  fetchNotificacoes,
  marcarNotificacaoComoLida,
  marcarTodasNotificacoesComoLidas,
  deletarNotificacao,
} from "../services/api";

function formatarDataNotificacao(iso) {
  if (!iso) return "";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  const agora = new Date();
  const diffMs = agora - data;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD} d`;
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

const Header = ({ usuario }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toggleSidebar } = useSidebar();
  const dropdownRef = useRef(null);
  const [dropdownAberto, setDropdownAberto] = useState(false);

  const [notificacoes, setNotificacoes] = useState([]);

  // Busca notificações reais vinculadas ao usuário no banco Neon
  useEffect(() => {
    const dados =
      localStorage.getItem("usuario") || localStorage.getItem("suap_user");
    const u = dados ? JSON.parse(dados) : usuario || {};
    const identificador = u.matricula || u.id || u.email;

    if (identificador) {
      fetchNotificacoes(identificador)
        .then((data) => {
          if (data && Array.isArray(data)) {
            setNotificacoes(data);
          }
        })
        .catch(() => {});
    }
  }, [usuario]);

  // Informações do usuário logado
  const usuarioInfo = usuario || {
    nome: "Usuário",
    descricao: "pratiCA",
    iniciais: "U",
    corAvatar: "bg-emerald-600",
    foto: null,
    email: null,
  };

  const urlFoto = usuarioInfo.foto
    ? usuarioInfo.foto.startsWith("http")
      ? usuarioInfo.foto
      : `https://suap.ifrn.edu.br${usuarioInfo.foto}`
    : null;

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  async function handleMarcarComoLida(id) {
    setNotificacoes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n)),
    );
    try {
      await marcarNotificacaoComoLida(id);
    } catch (err) {}
  }

  // Ao clicar numa notificação: marca como lida e navega para a página
  // relacionada (quando houver um link de destino definido pelo backend).
  async function handleNotificacaoClick(notif) {
    await handleMarcarComoLida(notif.id);
    if (notif.link_destino) {
      setDropdownAberto(false);
      navigate(notif.link_destino);
    }
  }

  async function handleMarcarTodasComoLidas() {
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
    const dados =
      localStorage.getItem("usuario") || localStorage.getItem("suap_user");
    const u = dados ? JSON.parse(dados) : usuario || {};
    const identificador = u.matricula || u.id || u.email;
    if (identificador) {
      try {
        await marcarTodasNotificacoesComoLidas(identificador);
      } catch (err) {}
    }
  }

  async function handleExcluirNotificacao(id, e) {
    e.stopPropagation();
    setNotificacoes((prev) => prev.filter((n) => n.id !== id));
    try {
      await deletarNotificacao(id);
    } catch (err) {}
  }

  return (
    <header className="bg-white border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Hambúrguer em mobile, logo checkmark no mobile/tablet */}
        <div className="flex items-center gap-2 lg:hidden">
          {/* Hambúrguer */}
          <button
            onClick={toggleSidebar}
            className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FontAwesomeIcon icon={faBars} className="w-6 h-6" />
          </button>

          {/* Logo checkmark mobile */}
          <img
            src="/images/pratiCA_logo_vetorizada (1).png"
            alt="Logo"
            className="w-8 h-8 object-contain"
          />
        </div>

        {/* Barra de busca - Oculta em mobile */}
        <div className="hidden sm:flex flex-1 max-w-md lg:max-w-xl">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full px-3 sm:px-4 py-2 pl-8 sm:pl-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-2 sm:left-3 top-2.5 h-4 w-4 text-gray-400"
            />
          </div>
        </div>

        {/* Lado direito com notificações, usuário e logout */}
        <div className="flex items-center gap-1 sm:gap-3 lg:gap-6">
          {/* Central de Notificações Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownAberto(!dropdownAberto)}
              className="relative p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
            >
              <FontAwesomeIcon
                icon={faBell}
                className="w-4 h-4 sm:w-5 sm:h-5"
              />
              {naoLidas > 0 && (
                <span className="absolute top-0 right-0 min-w-4 h-4 bg-red-500 rounded-full text-[8px] sm:text-[10px] font-bold text-white flex items-center justify-center px-0.5 sm:px-1">
                  {naoLidas}
                </span>
              )}
            </button>

            {dropdownAberto && (
              <div className="absolute right-0 mt-2 sm:mt-3 w-64 sm:w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden transition-all transform origin-top-right">
                <div className="p-2 sm:p-4 border-b border-gray-100 flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-gray-800 text-sm truncate">
                    Notificações
                  </h3>
                  {naoLidas > 0 && (
                    <button
                      onClick={handleMarcarTodasComoLidas}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium whitespace-nowrap"
                    >
                      Marcar tudo
                    </button>
                  )}
                </div>

                <div className="max-h-56 sm:max-h-72 overflow-y-auto">
                  {notificacoes.length === 0 ? (
                    <div className="p-4 sm:p-8 text-center text-gray-400 text-xs sm:text-sm">
                      Nenhuma notificação
                    </div>
                  ) : (
                    notificacoes.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificacaoClick(notif)}
                        className={`p-2 sm:p-4 border-b border-gray-50 flex gap-2 sm:gap-3 cursor-pointer transition-colors hover:bg-gray-50 ${!notif.lida ? "bg-emerald-50/30" : ""}`}
                        title={
                          notif.link_destino
                            ? "Clique para abrir a página relacionada"
                            : undefined
                        }
                      >
                        {/* Indicador de Tipo */}
                        <div className="mt-0.5 flex-shrink-0">
                          {notif.tipo === "success" && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 block"></span>
                          )}
                          {notif.tipo === "warning" && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 block"></span>
                          )}
                          {notif.tipo === "info" && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 block"></span>
                          )}
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-1">
                            <h4
                              className={`text-xs ${!notif.lida ? "font-semibold text-gray-800" : "text-gray-600"} truncate`}
                            >
                              {notif.titulo}
                            </h4>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">
                              {formatarDataNotificacao(notif.criado_em)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 leading-tight line-clamp-2">
                            {notif.mensagem}
                          </p>
                          {notif.link_destino && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 mt-1">
                              <FontAwesomeIcon
                                icon={faArrowUpRightFromSquare}
                                className="w-2.5 h-2.5"
                              />
                              Ver detalhes
                            </span>
                          )}
                        </div>

                        {/* Botão de excluir individual */}
                        <button
                          onClick={(e) => handleExcluirNotificacao(notif.id, e)}
                          className="text-gray-300 hover:text-gray-500 flex-shrink-0"
                          title="Remover"
                        >
                          <FontAwesomeIcon
                            icon={faXmark}
                            className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                          />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Info do usuário logado - Responsivo */}
          <div className="hidden sm:flex items-center gap-2 lg:gap-3">
            <div className="text-right hidden lg:block">
              <p className="font-semibold text-sm text-gray-800">
                {usuarioInfo.nome}
              </p>
              {usuarioInfo.email && (
                <p className="text-xs text-gray-400 -mt-0.5">
                  {usuarioInfo.email}
                </p>
              )}
              <p className="text-xs text-gray-500">{usuarioInfo.descricao}</p>
            </div>
            {/* Avatar ou Foto */}
            {urlFoto ? (
              <img
                src={urlFoto}
                alt={`Foto de ${usuarioInfo.nome}`}
                className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 ${usuarioInfo.corAvatar} rounded-full flex items-center justify-center text-white font-bold text-xs`}
              >
                {usuarioInfo.iniciais}
              </div>
            )}
          </div>

          {/* Botão de logout */}
          <button
            onClick={handleLogout}
            className="p-1.5 sm:p-2 text-gray-500 hover:text-red-600 transition-colors"
            title="Sair"
          >
            <FontAwesomeIcon
              icon={faRightFromBracket}
              className="w-4 h-4 sm:w-5 sm:h-5"
            />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

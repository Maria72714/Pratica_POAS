import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faCalendarDays,
  faPlus,
  faClockRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import { useSidebar } from "../context/SidebarContext";
import { getRoleTheme } from "../theme/roles";

const iconePadrao = faHouse;

const resolverIcone = (item) => {
  if (item?.icon) return item.icon;
  if (item?.icone && typeof item.icone === "object") return item.icone;
  return iconePadrao;
};

const Sidebar = ({ itensMenu, role = "aluno" }) => {
  const location = useLocation();
  const { isOpen, setIsOpen } = useSidebar();
  const theme = getRoleTheme(role);

  const itens = itensMenu || [
    { texto: "Início", link: "/", icon: faHouse },
    { texto: "Meus Agendamentos", link: "/agendamentos", icon: faCalendarDays },
    {
      texto: "Solicitar Atendimento",
      link: "/solicitar-atendimento",
      icon: faPlus,
    },
    { texto: "Histórico", link: "/historico", icon: faClockRotateLeft },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-40 w-72 ${theme.sidebar} min-h-screen flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className={`p-4 sm:p-6 border-b ${theme.sidebarBorder}`}>
          <div className="flex items-center gap-2 sm:gap-3">
            <img
              src="/images/logo_branca_pratica_vetorizada.png"
              alt="Logo Prática"
              className="w-8 sm:w-9 h-auto flex-shrink-0 object-contain"
            />
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                pratiCA
              </h1>
              <p className={`${theme.sidebarMuted} text-xs sm:text-sm mt-0.5`}>
                Centro de Aprendizagem
              </p>
            </div>
          </div>
          <p className={`${theme.sidebarSubtle} text-xs mt-1 sm:mt-2`}>
            IFRN - Campus Caicó
          </p>
        </div>

        <nav className="flex-1 p-2 sm:p-4">
          <ul className="space-y-1 sm:space-y-2">
            {itens.map((item, index) => {
              const isAtivo = location.pathname === item.link;

              return (
                <li key={index}>
                  <Link
                    to={item.link || "#"}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-colors ${
                      isAtivo ? theme.navActive : theme.navIdle
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={resolverIcone(item)}
                      className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                    />
                    <span
                      className="truncate"
                      dangerouslySetInnerHTML={{ __html: item.texto }}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={`p-2 sm:p-4 border-t ${theme.sidebarBorder}`}>
          <p
            className={`${theme.sidebarSubtle} text-xs text-center leading-relaxed`}
          >
            Instituto Federal de Educação, Ciência e Tecnologia do Rio Grande do
            Norte
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

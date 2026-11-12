/**
 * Indicador de carregamento padrão do pratiCA.
 *
 * Mostra a logo do sistema dentro de um anel de progresso discreto, para dar
 * feedback visual de que os dados estão sendo carregados e evitar a impressão
 * de travamento.
 *
 * Use em qualquer tela/componente que busque dados do backend.
 *
 * @param {string} texto - Mensagem exibida abaixo da animação.
 * @param {"sm" | "md"} tamanho - "md" para páginas/seções grandes, "sm" para
 *   áreas pequenas (cards, abas).
 * @param {boolean} telaInteira - Ocupa a altura visível da tela e centraliza o
 *   indicador (use em carregamentos de página inteira).
 * @param {string} minHeight - Classe de altura mínima (sobrepõe o padrão).
 * @param {string} corTexto - Classe de cor do texto.
 */
const LOGO_SRC = "/images/logo_branca_pratica_vetorizada.png";

const TAMANHOS = {
  sm: {
    gap: "gap-2",
    caixa: "w-12 h-12",
    anel: "border-2",
    disco: "w-9 h-9",
    logo: "w-6",
    texto: "text-xs",
  },
  md: {
    gap: "gap-4",
    caixa: "w-20 h-20",
    anel: "border-[3px]",
    disco: "w-14 h-14",
    logo: "w-9",
    texto: "text-sm",
  },
};

export default function Loading({
  texto = "Carregando",
  corTexto = "text-gray-500",
  tamanho = "md",
  telaInteira = false,
  className = "",
  minHeight,
}) {
  const t = TAMANHOS[tamanho] || TAMANHOS.md;
  // Em tela inteira descontamos o cabeçalho do app (~6rem) para centralizar
  // o indicador na área visível, sem gerar barra de rolagem desnecessária.
  const altura =
    minHeight ??
    (telaInteira ? "min-h-[calc(100dvh-6rem)]" : "min-h-[220px]");

  return (
    <div
      className={`flex w-full flex-col items-center justify-center ${t.gap} ${altura} ${className}`}
      role="status"
      aria-live="polite"
      aria-label={texto}
    >
      <div className={`relative flex items-center justify-center ${t.caixa}`}>
        {/* Anel de progresso discreto */}
        <span
          className={`absolute inset-0 rounded-full ${t.anel} border-gray-200 border-t-emerald-600 animate-pratica-ring`}
        />

        {/* Logo do sistema */}
        <span
          className={`flex items-center justify-center ${t.disco} rounded-full bg-emerald-600 animate-pratica-logo`}
        >
          <img
            src={LOGO_SRC}
            alt=""
            aria-hidden="true"
            draggable="false"
            className={`${t.logo} h-auto select-none`}
          />
        </span>
      </div>

      <p className={`font-medium tracking-wide ${corTexto} ${t.texto}`}>
        {texto}
      </p>
    </div>
  );
}

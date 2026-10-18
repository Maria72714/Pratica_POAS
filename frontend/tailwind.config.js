/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Cores customizadas por papel
      colors: {
        // Roles
        'role-aluno': '#10b981',       // emerald-600
        'role-professor': '#3b82f6',   // blue-500
        'role-mediador': '#d97706',    // amber-600
        'role-admin': '#1e293b',       // slate-800
      },
      // Espaçamento padrão
      spacing: {
        'page': '2rem',     // Padding padrão de página
        'section': '1.5rem', // Padding padrão de seção
      },
      // Border radius padrão
      borderRadius: {
        'card': '0.75rem',   // 12px - Cards, modals
        'button': '0.5rem',  // 8px - Botões
      },
      // Shadows padrão
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
      // Transições padrão
      transitionDuration: {
        'fast': '150ms',
        'base': '200ms',
        'slow': '300ms',
      },
    },
  },
  plugins: [],
}


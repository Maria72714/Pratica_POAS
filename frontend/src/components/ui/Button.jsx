import React from 'react';

/**
 * Componente Button reutilizável com variações
 * 
 * @param {string} variant - 'primary' | 'secondary' | 'ghost' | 'danger' (padrão: primary)
 * @param {string} size - 'sm' | 'md' | 'lg' (padrão: md)
 * @param {boolean} loading - Mostrar loading state
 * @param {boolean} disabled - Desabilitar botão
 * @param {JSX.Element} icon - Ícone à esquerda
 * @param {string} className - Classes adicionais
 * @param {function} onClick - Handler de clique
 * @param {string} children - Conteúdo do botão
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  className = '',
  onClick,
  children,
  type = 'button',
  ...props
}) {
  const baseStyles = 'font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 inline-flex items-center justify-center gap-2';
  
  const variantStyles = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 focus:ring-emerald-500',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50 focus:ring-slate-400',
    ghost: 'text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100 disabled:opacity-50 focus:ring-emerald-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:opacity-50 focus:ring-red-500',
  };
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  const fullClass = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;
  
  return (
    <button
      type={type}
      className={fullClass}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!loading && icon}
      {children}
    </button>
  );
}

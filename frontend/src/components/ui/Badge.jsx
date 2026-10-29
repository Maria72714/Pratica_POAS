import React from 'react';

/**
 * Componente Badge para labels, status, tipos
 * 
 * @param {string} variant - 'primary' | 'success' | 'warning' | 'error' | 'info' (padrão: primary)
 * @param {string} size - 'sm' | 'md' (padrão: sm)
 * @param {string} children - Conteúdo do badge
 * @param {string} className - Classes adicionais
 */
export default function Badge({
  variant = 'primary',
  size = 'sm',
  children,
  className = '',
}) {
  const variantStyles = {
    primary: 'bg-emerald-100 text-emerald-800',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    slate: 'bg-slate-100 text-slate-700',
  };
  
  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 rounded',
    md: 'text-sm px-3 py-1 rounded-md',
  };
  
  return (
    <span className={`font-semibold ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  );
}

/**
 * Variante de Badge com ícone
 */
export function BadgeWithIcon({ icon, variant = 'primary', children, onRemove }) {
  const variantStyles = {
    primary: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
    success: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
    warning: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
    error: 'bg-red-100 text-red-800 hover:bg-red-200',
    info: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  };
  
  return (
    <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded ${variantStyles[variant]} transition-colors`}>
      {icon}
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:opacity-70 transition-opacity ml-1"
          aria-label="Remover"
        >
          ✕
        </button>
      )}
    </div>
  );
}

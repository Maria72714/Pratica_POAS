import React from 'react';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * Componente Alert para mensagens de feedback
 * 
 * @param {string} type - 'success' | 'error' | 'warning' | 'info' (padrão: info)
 * @param {string} title - Título da mensagem
 * @param {string} message - Mensagem principal
 * @param {function} onClose - Handler para fechar
 * @param {boolean} dismissible - Mostrar botão de fechar (padrão: true)
 */
export default function Alert({
  type = 'info',
  title,
  message,
  onClose,
  dismissible = true,
}) {
  const styles = {
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      icon: <CheckCircle className="w-5 h-5" />,
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: <AlertCircle className="w-5 h-5" />,
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: <Info className="w-5 h-5" />,
    },
  };
  
  const style = styles[type];
  
  return (
    <div className={`rounded-lg border ${style.border} ${style.bg} ${style.text} px-4 py-3 flex gap-3 items-start`}>
      <div className="flex-shrink-0 mt-0.5">
        {style.icon}
      </div>
      
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {message && <p className={title ? 'text-sm mt-1' : ''}>{message}</p>}
      </div>
      
      {dismissible && onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:opacity-70 transition-opacity"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

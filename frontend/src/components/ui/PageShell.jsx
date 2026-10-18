import React from 'react';

/**
 * Container padrão das páginas autenticadas (margens e largura consistentes).
 */
export default function PageShell({ children, className = '' }) {
  return (
    <div className={`flex-1 bg-gray-50 min-h-full ${className}`}>
      <div className="mx-4 sm:mx-6 lg:mx-8 py-4 sm:py-6 space-y-6">{children}</div>
    </div>
  );
}

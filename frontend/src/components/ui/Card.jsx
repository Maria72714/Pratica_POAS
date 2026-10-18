import React from 'react';

/**
 * Componente Card - Container com border, shadow e padding
 */
export function Card({ className = '', children, ...props }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-sm p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * Header de Card com título
 */
export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`mb-4 flex items-start justify-between gap-4 ${className}`}>
      <div>
        {title && <h2 className="text-lg font-bold text-slate-800">{title}</h2>}
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/**
 * Conteúdo de Card
 */
export function CardContent({ children, className = '' }) {
  return <div className={`space-y-4 ${className}`}>{children}</div>;
}

/**
 * Footer de Card
 */
export function CardFooter({ children, className = '' }) {
  return <div className={`flex items-center justify-between gap-3 pt-4 border-t border-slate-100 ${className}`}>{children}</div>;
}

/**
 * Exemplo de uso completo:
 * 
 * <Card>
 *   <CardHeader
 *     title="Título"
 *     subtitle="Subtítulo"
 *     action={<Button variant="ghost">Ação</Button>}
 *   />
 *   <CardContent>
 *     <p>Conteúdo...</p>
 *   </CardContent>
 *   <CardFooter>
 *     <span>Informação</span>
 *     <Button>OK</Button>
 *   </CardFooter>
 * </Card>
 */

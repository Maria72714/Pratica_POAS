import React from 'react';
import { getRoleTheme } from '../../theme/roles';

export default function PageHeader({
  title,
  subtitle,
  role = 'aluno',
  actions = null,
  badge = null,
}) {
  const theme = getRoleTheme(role);

  return (
    <div
      className={`bg-gradient-to-r ${theme.headerGradient} text-white rounded-xl shadow-sm px-5 sm:px-8 py-6 sm:py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4`}
    >
      <div className="min-w-0">
        {badge && (
          <span className="inline-block mb-2 text-[11px] font-bold uppercase tracking-wide bg-white/15 px-2 py-0.5 rounded">
            {badge}
          </span>
        )}
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">{title}</h1>
        {subtitle && (
          <p className="mt-1.5 text-sm sm:text-base text-white/85 max-w-3xl">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

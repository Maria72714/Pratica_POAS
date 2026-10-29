export const ROLE_THEMES = {
  aluno: {
    id: 'aluno',
    label: 'Aluno',
    sidebar: 'bg-emerald-900',
    sidebarBorder: 'border-emerald-800',
    sidebarMuted: 'text-emerald-200',
    sidebarSubtle: 'text-emerald-300',
    navActive: 'bg-emerald-800 text-white',
    navIdle: 'text-emerald-50 hover:bg-emerald-800',
    headerGradient: 'from-emerald-800 to-emerald-900',
    accent: 'emerald',
    avatar: 'bg-emerald-600',
  },
  professor: {
    id: 'professor',
    label: 'Professor',
    sidebar: 'bg-emerald-900',
    sidebarBorder: 'border-emerald-800',
    sidebarMuted: 'text-emerald-200',
    sidebarSubtle: 'text-emerald-300',
    navActive: 'bg-emerald-800 text-white',
    navIdle: 'text-emerald-50 hover:bg-emerald-800',
    headerGradient: 'from-emerald-800 to-emerald-900',
    accent: 'emerald',
    avatar: 'bg-emerald-700',
  },
  mediador: {
    id: 'mediador',
    label: 'Mediador',
    sidebar: 'bg-violet-900',
    sidebarBorder: 'border-violet-800',
    sidebarMuted: 'text-violet-200',
    sidebarSubtle: 'text-violet-300',
    navActive: 'bg-violet-800 text-white',
    navIdle: 'text-violet-50 hover:bg-violet-800',
    headerGradient: 'from-violet-800 to-violet-900',
    accent: 'violet',
    avatar: 'bg-violet-700',
  },
  admin: {
    id: 'admin',
    label: 'Administrador',
    sidebar: 'bg-slate-900',
    sidebarBorder: 'border-slate-700',
    sidebarMuted: 'text-slate-300',
    sidebarSubtle: 'text-slate-400',
    navActive: 'bg-slate-700 text-white',
    navIdle: 'text-slate-100 hover:bg-slate-800',
    headerGradient: 'from-slate-800 to-slate-900',
    accent: 'slate',
    avatar: 'bg-slate-700',
  },
};

export function resolveRoleFromUser(user) {
  if (!user) return 'aluno';
  const tipo = (user.tipo || user.tipo_usuario || '').toLowerCase();
  if (tipo === 'admin') return 'admin';
  const vinculo = (user.tipo_vinculo || '').toLowerCase();
  if (user.is_aluno || vinculo.includes('aluno') || tipo === 'aluno') {
    return 'aluno';
  }
  if (tipo === 'mediador') return 'mediador';
  if (tipo === 'professor') return 'professor';
  if (vinculo.includes('prof') || vinculo.includes('docente') || vinculo.includes('servidor')) {
    return 'professor';
  }
  return 'aluno';
}

export function getRoleTheme(userOrRole) {
  const role = typeof userOrRole === 'string' ? userOrRole : resolveRoleFromUser(userOrRole);
  return ROLE_THEMES[role] || ROLE_THEMES.aluno;
}

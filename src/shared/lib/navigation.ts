export type NavigationItem = {
  href: string
  label: string
  shortLabel?: string
  icon: string
  end?: boolean
}

export const adminNavigation: NavigationItem[] = [
  { href: '/admin', label: 'Dashboard', icon: 'DB', end: true },
  { href: '/admin/alunos', label: 'Alunos', icon: 'AL' },
  { href: '/admin/check-ins', label: 'Check-ins', shortLabel: 'Check-in', icon: 'OK' },
  { href: '/admin/mensalidades', label: 'Mensalidades', shortLabel: 'Pix', icon: 'R$' },
  { href: '/admin/graduacao', label: 'Graduacao', shortLabel: 'Faixas', icon: 'FX' },
  { href: '/admin/configuracoes', label: 'Configuracoes', icon: 'CFG' }
]

export const studentNavigation: NavigationItem[] = [
  { href: '/aluno', label: 'Inicio', icon: 'IN', end: true },
  { href: '/aluno/check-in', label: 'Check-in', icon: 'OK' },
  { href: '/aluno/mensalidade', label: 'Mensalidade', shortLabel: 'Pix', icon: 'R$' },
  { href: '/aluno/graduacao', label: 'Graduacao', shortLabel: 'Faixa', icon: 'FX' },
  { href: '/aluno/perfil', label: 'Perfil', icon: 'EU' }
]

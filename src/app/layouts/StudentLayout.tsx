import { NavLink, Outlet } from 'react-router-dom'
import { LogoutButton } from '../../features/auth/LogoutButton'
import { studentNavigation } from '../../shared/lib/navigation'

export function StudentLayout() {
  return (
    <div className="app-shell student-shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">JJ</div>
        <div className="topbar-title">
          <strong>Area do aluno</strong>
          <span>Check-in, mensalidade e graduacao</span>
        </div>
        <LogoutButton />
      </header>

      <main className="content content-narrow">
        <Outlet />
      </main>

      <nav className="bottom-nav always" aria-label="Navegacao do aluno">
        {studentNavigation.map((item) => (
          <NavLink className="nav-item" key={item.href} to={item.href} end={item.end}>
            <span aria-hidden="true">{item.icon}</span>
            {item.shortLabel ?? item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

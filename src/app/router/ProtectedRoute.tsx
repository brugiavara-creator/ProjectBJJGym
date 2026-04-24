import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ErrorState, LoadingState } from '../../shared/components/StateViews'
import { useAuth } from '../providers/AuthContext'
import type { AppRole } from '../providers/authAccess'
import { canAccessRole } from '../providers/authAccess'

type ProtectedRouteProps = {
  allowedRoles: readonly AppRole[]
  children: ReactNode
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { isPlaceholderMode, profile, session, status } = useAuth()

  if (status === 'loading') {
    return <LoadingState title="Carregando acesso" description="Validando sessao e perfil da academia." />
  }

  if (!isPlaceholderMode && !session) {
    return (
      <ErrorState
        title="Sessao necessaria"
        description="Entre com sua conta para acessar a area da academia ou do aluno."
        action={<Link className="btn" to="/login">Entrar</Link>}
      />
    )
  }

  if (!canAccessRole({ allowedRoles, isPlaceholderMode, profile })) {
    return (
      <ErrorState
        title="Acesso indisponivel"
        description="Seu perfil ainda nao tem permissao para acessar esta area do Jiu-Jitsu."
      />
    )
  }

  return children
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthContext'
import { Button } from '../../shared/components/Button'

export function LogoutButton() {
  const navigate = useNavigate()
  const { isPlaceholderMode, session, signOut } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  if (isPlaceholderMode || !session) {
    return null
  }

  async function handleClick() {
    setIsSigningOut(true)
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <Button className="topbar-action" disabled={isSigningOut} onClick={handleClick} variant="secondary">
      {isSigningOut ? 'Saindo...' : 'Sair'}
    </Button>
  )
}

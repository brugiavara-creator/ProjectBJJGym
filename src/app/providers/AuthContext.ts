import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { AuthProfile } from './authAccess'

export type AuthStatus = 'loading' | 'ready'

export type AuthContextValue = {
  isPlaceholderMode: boolean
  profile: AuthProfile | null
  session: Session | null
  signOut: () => Promise<void>
  status: AuthStatus
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const value = useContext(AuthContext)

  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return value
}

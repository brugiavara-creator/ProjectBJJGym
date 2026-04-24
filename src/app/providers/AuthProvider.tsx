import type { Session } from '@supabase/supabase-js'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { hasSupabaseConfig, supabase } from '../../shared/lib/supabase'
import { AuthContext } from './AuthContext'
import type { AuthContextValue, AuthStatus } from './AuthContext'
import type { AuthProfile } from './authAccess'

const placeholderProfile: AuthProfile = {
  id: 'local-placeholder-admin',
  academyId: 'local-placeholder-academy',
  fullName: 'Equipe da academia',
  role: 'academy_admin'
}

type AcademyMemberRole = 'owner' | 'admin' | 'coach' | 'student'

function toAppRole(role: AcademyMemberRole): AuthProfile['role'] {
  if (role === 'owner' || role === 'admin') {
    return 'academy_admin'
  }

  if (role === 'coach') {
    return 'academy_staff'
  }

  return 'student'
}

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<AuthProfile | null>(hasSupabaseConfig ? null : placeholderProfile)
  const [status, setStatus] = useState<AuthStatus>(hasSupabaseConfig ? 'loading' : 'ready')

  useEffect(() => {
    if (!supabase) {
      return
    }

    const client = supabase
    let isActive = true

    async function loadAuth(nextSession: Session | null) {
      if (!isActive) {
        return
      }

      setStatus('loading')
      setSession(nextSession)

      if (!nextSession) {
        setProfile(null)
        setStatus('ready')
        return
      }

      const { data: profileData } = await client
        .from('profiles')
        .select('id, full_name')
        .eq('id', nextSession.user.id)
        .maybeSingle()

      const { data: memberData } = await client
        .from('academy_members')
        .select('academy_id, role')
        .eq('user_id', nextSession.user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (!isActive) {
        return
      }

      setProfile(
        profileData && memberData
          ? {
              id: profileData.id,
              academyId: memberData.academy_id,
              fullName: profileData.full_name,
              role: toAppRole(memberData.role as AcademyMemberRole)
            }
          : null
      )
      setStatus('ready')
    }

    client.auth.getSession().then(({ data }) => loadAuth(data.session))

    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      void loadAuth(nextSession)
    })

    return () => {
      isActive = false
      data.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      isPlaceholderMode: !hasSupabaseConfig,
      profile,
      session,
      signOut: async () => {
        if (supabase) {
          await supabase.auth.signOut()
        }

        setSession(null)
        setProfile(hasSupabaseConfig ? null : placeholderProfile)
      },
      status
    }),
    [profile, session, status]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

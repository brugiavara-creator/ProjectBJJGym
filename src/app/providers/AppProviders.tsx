import type { ReactNode } from 'react'
import { AuthProvider } from './AuthProvider'
import { QueryProvider } from './QueryProvider'

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  )
}

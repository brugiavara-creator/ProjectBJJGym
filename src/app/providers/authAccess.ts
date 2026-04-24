export type AppRole = 'academy_admin' | 'academy_staff' | 'student'

export type AuthProfile = {
  id: string
  academyId: string | null
  fullName: string | null
  role: AppRole
}

type CanAccessRoleInput = {
  allowedRoles: readonly AppRole[]
  isPlaceholderMode: boolean
  profile: AuthProfile | null
}

export function canAccessRole({ allowedRoles, isPlaceholderMode, profile }: CanAccessRoleInput) {
  if (isPlaceholderMode) {
    return true
  }

  if (!profile) {
    return false
  }

  return allowedRoles.includes(profile.role)
}

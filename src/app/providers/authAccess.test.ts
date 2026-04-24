import { describe, expect, it } from 'vitest'
import type { AuthProfile } from './authAccess'
import { canAccessRole } from './authAccess'

const adminProfile: AuthProfile = {
  id: 'profile-admin',
  academyId: 'academy-1',
  fullName: 'Professora Admin',
  role: 'academy_admin'
}

const studentProfile: AuthProfile = {
  id: 'profile-student',
  academyId: 'academy-1',
  fullName: 'Aluno Faixa Branca',
  role: 'student'
}

const staffProfile: AuthProfile = {
  id: 'profile-coach',
  academyId: 'academy-1',
  fullName: 'Instrutor auxiliar',
  role: 'academy_staff'
}

describe('canAccessRole', () => {
  it('libera os shells em modo local sem Supabase configurado', () => {
    expect(canAccessRole({ allowedRoles: ['student'], isPlaceholderMode: true, profile: null })).toBe(true)
  })

  it('permite perfil da academia na area admin', () => {
    expect(canAccessRole({ allowedRoles: ['academy_admin'], isPlaceholderMode: false, profile: adminProfile })).toBe(true)
  })

  it('bloqueia aluno na area admin', () => {
    expect(canAccessRole({ allowedRoles: ['academy_admin'], isPlaceholderMode: false, profile: studentProfile })).toBe(false)
  })

  it('bloqueia staff sem permissao administrativa no shell admin', () => {
    expect(canAccessRole({ allowedRoles: ['academy_admin'], isPlaceholderMode: false, profile: staffProfile })).toBe(false)
  })

  it('bloqueia acesso real quando o perfil ainda nao foi carregado', () => {
    expect(canAccessRole({ allowedRoles: ['student'], isPlaceholderMode: false, profile: null })).toBe(false)
  })
})

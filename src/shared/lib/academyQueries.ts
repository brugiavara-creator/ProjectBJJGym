import type { SupabaseClient } from '@supabase/supabase-js'
import type { AcademySettings, BjjBeltOption, CheckinRecord, PaymentRecord, StudentRecord } from '../domain/academy'
import { toAcademySettingsPayload, toStudentPayload } from '../domain/academy'
import type { AcademySettingsFormValues, StudentFormValues } from '../domain/academy'

function assertSupabase(client: SupabaseClient | null): asserts client is SupabaseClient {
  if (!client) {
    throw new Error('Supabase nao esta configurado.')
  }
}

function assertAcademyId(academyId: string | undefined): asserts academyId is string {
  if (!academyId) {
    throw new Error('Contexto da academia nao encontrado.')
  }
}

export async function fetchStudents(client: SupabaseClient | null, academyId: string | undefined) {
  assertSupabase(client)
  assertAcademyId(academyId)

  const { data, error } = await client
    .from('students')
    .select('id, academy_id, full_name, email, phone, belt_id, grau, next_due_date, status, created_at, bjj_belts(id, audience, name, rank, max_grau)')
    .eq('academy_id', academyId)
    .order('full_name', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []).map(toStudentRecord)
}

export async function fetchBjjBelts(client: SupabaseClient | null) {
  assertSupabase(client)

  const { data, error } = await client
    .from('bjj_belts')
    .select('id, audience, name, rank, max_grau')
    .order('audience', { ascending: true })
    .order('rank', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []) as BjjBeltOption[]
}

export async function saveStudent({
  academyId,
  client,
  studentId,
  values
}: {
  academyId: string | undefined
  client: SupabaseClient | null
  studentId?: string
  values: StudentFormValues
}) {
  assertSupabase(client)
  assertAcademyId(academyId)

  const payload = toStudentPayload(values, academyId)
  const request = studentId
    ? client.from('students').update(payload).eq('id', studentId).eq('academy_id', academyId)
    : client.from('students').insert(payload)
  const { error } = await request

  if (error) {
    throw error
  }
}

export async function fetchDashboardData(client: SupabaseClient | null, academyId: string | undefined) {
  assertSupabase(client)
  assertAcademyId(academyId)

  const [studentsResult, paymentsResult, checkinsResult] = await Promise.all([
    client
      .from('students')
      .select('id, academy_id, full_name, email, phone, belt_id, grau, next_due_date, status, bjj_belts(id, audience, name, rank, max_grau)')
      .eq('academy_id', academyId),
    client.from('payments').select('id, academy_id, amount, status, due_date, paid_at').eq('academy_id', academyId),
    client.from('checkins').select('id, academy_id, created_at').eq('academy_id', academyId)
  ])

  const error = studentsResult.error ?? paymentsResult.error ?? checkinsResult.error

  if (error) {
    throw error
  }

  return {
    checkins: (checkinsResult.data ?? []) as CheckinRecord[],
    payments: (paymentsResult.data ?? []) as PaymentRecord[],
    students: (studentsResult.data ?? []).map(toStudentRecord)
  }
}

export async function fetchAcademySettings(client: SupabaseClient | null, academyId: string | undefined) {
  assertSupabase(client)
  assertAcademyId(academyId)

  const { data, error } = await client
    .from('academies')
    .select('id, name, logo_url, primary_color, email, phone, address')
    .eq('id', academyId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as AcademySettings | null
}

export async function updateAcademySettings({
  academyId,
  client,
  values
}: {
  academyId: string | undefined
  client: SupabaseClient | null
  values: AcademySettingsFormValues
}) {
  assertSupabase(client)
  assertAcademyId(academyId)

  const { error } = await client.from('academies').update(toAcademySettingsPayload(values)).eq('id', academyId)

  if (error) {
    throw error
  }
}

type StudentRow = {
  id: string
  academy_id: string
  full_name: string
  email: string | null
  phone: string | null
  belt_id: string
  grau: number
  next_due_date: string | null
  status: StudentRecord['status']
  created_at?: string
  bjj_belts: BjjBeltOption | BjjBeltOption[] | null
}

function toStudentRecord(row: StudentRow): StudentRecord {
  const belt = Array.isArray(row.bjj_belts) ? row.bjj_belts[0] : row.bjj_belts

  return {
    academy_id: row.academy_id,
    belt_audience: belt?.audience ?? 'adult',
    belt_id: row.belt_id,
    belt_name: belt?.name ?? 'Branca',
    created_at: row.created_at,
    email: row.email,
    full_name: row.full_name,
    grau: row.grau,
    id: row.id,
    next_due_date: row.next_due_date,
    phone: row.phone,
    status: row.status
  }
}

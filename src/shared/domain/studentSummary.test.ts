import { describe, expect, it } from 'vitest'
import type { StudentRecord } from './academy'
import {
  buildStudentSummary,
  calculateGraduationProgress,
  formatBeltAndGrau,
  resolveStudentPaymentStatus,
  selectCurrentMensalidade,
  toStudentProfilePayload
} from './studentSummary'
import type { GraduationRuleRecord, StudentCheckinRecord, StudentPaymentRecord } from './studentSummary'

const student: StudentRecord = {
  academy_id: 'academy-1',
  belt_audience: 'adult',
  belt_id: 'belt-branca',
  belt_name: 'Branca',
  email: 'aluno@dojo.com',
  full_name: 'Aluno Faixa Branca',
  grau: 1,
  id: 'student-1',
  next_due_date: '2026-04-20',
  phone: null,
  status: 'active'
}

const payments: StudentPaymentRecord[] = [
  {
    academy_id: 'academy-1',
    amount: 180,
    due_date: '2026-05-10',
    id: 'paid-later',
    paid_at: '2026-05-01T10:00:00Z',
    status: 'paid',
    student_id: 'student-1'
  },
  {
    academy_id: 'academy-1',
    amount: 190,
    due_date: '2026-04-10',
    id: 'open-now',
    paid_at: null,
    status: 'pending',
    student_id: 'student-1'
  }
]

const checkins: StudentCheckinRecord[] = [
  { academy_id: 'academy-1', checked_in_at: '2026-04-01T10:00:00Z', id: 'checkin-1', status: 'valid', student_id: 'student-1' },
  { academy_id: 'academy-1', checked_in_at: '2026-04-02T10:00:00Z', id: 'checkin-2', status: 'valid', student_id: 'student-1' },
  { academy_id: 'academy-1', checked_in_at: '2026-04-03T10:00:00Z', id: 'checkin-3', status: 'cancelled', student_id: 'student-1' }
]

const rules: GraduationRuleRecord[] = [
  {
    academy_id: 'academy-1',
    active: true,
    belt_id: 'belt-branca',
    grau: 2,
    id: 'rule-1',
    minimum_days: 0,
    required_checkins: 4
  }
]

describe('student summary helpers', () => {
  it('formats faixa and grau using BJJ copy', () => {
    expect(formatBeltAndGrau('Azul', 1)).toBe('Faixa azul, 1 grau')
    expect(formatBeltAndGrau('Branca', 2)).toBe('Faixa branca, 2 graus')
  })

  it('selects the open mensalidade before paid history', () => {
    expect(selectCurrentMensalidade(payments)?.id).toBe('open-now')
  })

  it('marks pending mensalidade as vencida when due date is before today', () => {
    expect(
      resolveStudentPaymentStatus({ payment: payments[1], student, today: new Date('2026-04-24T12:00:00') })
    ).toBe('overdue')
  })

  it('calculates attendance-informed progress without counting cancelled check-ins', () => {
    expect(calculateGraduationProgress({ checkins, currentGrau: 1, rules })).toEqual({
      checkinsCount: 2,
      detail: '2 de 4 check-ins para o proximo grau. Promocao continua manual pela academia.',
      percent: 50
    })
  })

  it('builds the student home summary from payments, check-ins and graduation rules', () => {
    expect(buildStudentSummary({ checkins, payments, rules, student, today: new Date('2026-04-24T12:00:00') })).toMatchObject({
      beltLabel: 'Faixa branca, 1 grau',
      checkinsCount: 2,
      paymentStatus: 'overdue',
      paymentStatusLabel: 'Vencido',
      progressPercent: 50
    })
  })

  it('normalizes editable profile payload only', () => {
    expect(toStudentProfilePayload({ fullName: '  Aluna Silva  ', phone: '' })).toEqual({
      full_name: 'Aluna Silva',
      phone: null
    })
  })
})

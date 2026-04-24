import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../app/providers/AuthContext'
import { Button } from '../../shared/components/Button'
import { EmptyState, ErrorState, LoadingState } from '../../shared/components/StateViews'
import { PageHeader } from '../../shared/components/PageHeader'
import { getPaymentStatusLabel, isDateBeforeToday, studentFormSchema } from '../../shared/domain/academy'
import type { StudentFormValues, StudentRecord } from '../../shared/domain/academy'
import { fetchBjjBelts, fetchStudents, saveStudent } from '../../shared/lib/academyQueries'
import { supabase } from '../../shared/lib/supabase'

const emptyStudentValues: StudentFormValues = {
  beltId: '',
  grau: 0,
  email: '',
  fullName: '',
  mensalidadeDueDate: '',
  phone: '',
  status: 'active'
}

function toFormValues(student: StudentRecord): StudentFormValues {
  return {
    beltId: student.belt_id,
    grau: student.grau,
    email: student.email ?? '',
    fullName: student.full_name,
    mensalidadeDueDate: student.next_due_date ?? '',
    phone: student.phone ?? '',
    status: student.status
  }
}

export function StudentsPage() {
  const { isPlaceholderMode, profile } = useAuth()
  const academyId = profile?.academyId ?? undefined
  const queryClient = useQueryClient()
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null)
  const canUseSupabase = Boolean(supabase && academyId && !isPlaceholderMode)
  const studentsQuery = useQuery({
    enabled: canUseSupabase,
    queryFn: () => fetchStudents(supabase, academyId),
    queryKey: ['students', academyId]
  })
  const beltsQuery = useQuery({
    enabled: canUseSupabase,
    queryFn: () => fetchBjjBelts(supabase),
    queryKey: ['bjj-belts']
  })
  const form = useForm<StudentFormValues>({
    defaultValues: emptyStudentValues,
    resolver: zodResolver(studentFormSchema)
  })
  const mutation = useMutation({
    mutationFn: (values: StudentFormValues) =>
      saveStudent({ academyId, client: supabase, studentId: editingStudent?.id, values }),
    onSuccess: async () => {
      setEditingStudent(null)
      form.reset(emptyStudentValues)
      await queryClient.invalidateQueries({ queryKey: ['students', academyId] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard', academyId] })
    }
  })
  const deactivateMutation = useMutation({
    mutationFn: (student: StudentRecord) =>
      saveStudent({ academyId, client: supabase, studentId: student.id, values: { ...toFormValues(student), status: 'inactive' } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['students', academyId] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard', academyId] })
    }
  })

  function startEdit(student: StudentRecord) {
    setEditingStudent(student)
    form.reset(toFormValues(student))
  }

  function cancelEdit() {
    setEditingStudent(null)
    form.reset(emptyStudentValues)
  }

  const students = studentsQuery.data ?? []
  const belts = beltsQuery.data ?? []

  return (
    <section>
      <PageHeader
        eyebrow="Alunos"
        title="Cadastro de alunos de Jiu-Jitsu"
        description="Cadastre alunos com faixa, grau, contato e vencimento da mensalidade Pix."
        action={<Button onClick={cancelEdit}>Novo aluno</Button>}
      />

      {!canUseSupabase ? (
        <EmptyState
          title="Supabase ainda nao conectado"
          description="Quando VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY e o contexto da academia estiverem disponiveis, os alunos serao listados aqui."
        />
      ) : null}

      {canUseSupabase ? (
        <div className="split-grid">
          <form className="card form-card" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            <h2>{editingStudent ? 'Editar aluno' : 'Novo aluno'}</h2>

            <label className="field">
              <span>Nome do aluno</span>
              <input {...form.register('fullName')} placeholder="Ex.: Ana Silva" />
              {form.formState.errors.fullName ? <small>{form.formState.errors.fullName.message}</small> : null}
            </label>

            <div className="field-grid">
              <label className="field">
                <span>Faixa</span>
                <select {...form.register('beltId')}>
                  <option value="">Selecione uma faixa</option>
                  {belts.map((belt) => (
                    <option key={belt.id} value={belt.id}>
                      {belt.name} ({belt.audience === 'kids' ? 'infantil' : 'adulto'})
                    </option>
                  ))}
                </select>
                {form.formState.errors.beltId ? <small>{form.formState.errors.beltId.message}</small> : null}
              </label>

              <label className="field">
                <span>Grau</span>
                <input {...form.register('grau', { valueAsNumber: true })} inputMode="numeric" min={0} max={4} type="number" />
                {form.formState.errors.grau ? <small>{form.formState.errors.grau.message}</small> : null}
              </label>
            </div>

            <label className="field">
              <span>Vencimento da mensalidade</span>
              <input {...form.register('mensalidadeDueDate')} type="date" />
            </label>

            <div className="field-grid">
              <label className="field">
                <span>E-mail</span>
                <input {...form.register('email')} inputMode="email" placeholder="aluno@email.com" />
                {form.formState.errors.email ? <small>{form.formState.errors.email.message}</small> : null}
              </label>

              <label className="field">
                <span>Telefone</span>
                <input {...form.register('phone')} inputMode="tel" placeholder="(11) 99999-9999" />
                {form.formState.errors.phone ? <small>{form.formState.errors.phone.message}</small> : null}
              </label>
            </div>

            <label className="field">
              <span>Status</span>
              <select {...form.register('status')}>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </label>

            {mutation.error ? <p className="form-error">Nao foi possivel salvar o aluno. Verifique a tabela students.</p> : null}

            <div className="form-actions">
              <Button disabled={mutation.isPending} type="submit">
                {mutation.isPending ? 'Salvando...' : 'Salvar aluno'}
              </Button>
              {editingStudent ? (
                <Button disabled={mutation.isPending} onClick={cancelEdit} type="button" variant="secondary">
                  Cancelar
                </Button>
              ) : null}
            </div>
          </form>

          <div className="card list-card">
            <h2>Alunos cadastrados</h2>
            {studentsQuery.isLoading || beltsQuery.isLoading ? <LoadingState title="Carregando alunos" description="Buscando alunos e faixas da academia." /> : null}
            {studentsQuery.error || beltsQuery.error ? (
              <ErrorState title="Erro ao buscar alunos" description="Confira RLS, tabelas students/bjj_belts e contexto da academia." />
            ) : null}
            {!studentsQuery.isLoading && !studentsQuery.error && students.length === 0 ? (
              <EmptyState title="Nenhum aluno cadastrado" description="Cadastre o primeiro aluno da academia piloto." />
            ) : null}
            {students.length > 0 ? (
              <div className="student-list">
                {students.map((student) => (
                  <article className="student-row" key={student.id}>
                    <div>
                      <strong>{student.full_name}</strong>
                      <span>
                        Faixa {student.belt_name.toLowerCase()}, {student.grau} grau{student.grau === 1 ? '' : 's'}
                      </span>
                      <small>
                        {student.next_due_date
                          ? `${getPaymentStatusLabel(isDateBeforeToday(student.next_due_date) ? 'overdue' : 'pending')} desde ${student.next_due_date}`
                          : 'Mensalidade sem vencimento'}
                      </small>
                    </div>
                    <div className="row-actions">
                      <Button onClick={() => startEdit(student)} variant="secondary">
                        Editar
                      </Button>
                      {student.status === 'active' ? (
                        <Button
                          disabled={deactivateMutation.isPending}
                          onClick={() => deactivateMutation.mutate(student)}
                          variant="secondary"
                        >
                          Desativar
                        </Button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}

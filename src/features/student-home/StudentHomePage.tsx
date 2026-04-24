import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthContext'
import { PageHeader } from '../../shared/components/PageHeader'
import { StatCard } from '../../shared/components/StatCard'
import { EmptyState, ErrorState, LoadingState } from '../../shared/components/StateViews'
import { buildStudentSummary } from '../../shared/domain/studentSummary'
import { fetchLinkedStudentExperience } from '../../shared/lib/studentQueries'
import { supabase } from '../../shared/lib/supabase'

export function StudentHomePage() {
  const { isPlaceholderMode, profile } = useAuth()
  const academyId = profile?.academyId ?? undefined
  const canUseSupabase = Boolean(supabase && academyId && profile?.id && !isPlaceholderMode)
  const studentQuery = useQuery({
    enabled: canUseSupabase,
    queryFn: () => fetchLinkedStudentExperience({ academyId, client: supabase, profileId: profile?.id }),
    queryKey: ['student-experience', academyId, profile?.id]
  })
  const experience = studentQuery.data
  const summary = experience?.student
    ? buildStudentSummary({
        checkins: experience.checkins,
        payments: experience.payments,
        rules: experience.rules,
        student: experience.student
      })
    : null

  return (
    <section>
      <PageHeader
        eyebrow="Area do aluno"
        title={experience?.profile.full_name ? `Seu Jiu-Jitsu, ${experience.profile.full_name}` : 'Seu Jiu-Jitsu'}
        description="Veja mensalidade, faixa/grau, progresso e acesse o check-in do treino."
        action={<Link className="btn accent" to="/aluno/check-in">Fazer check-in</Link>}
      />

      {!canUseSupabase ? (
        <EmptyState
          title="Area do aluno em modo local"
          description="Configure Supabase e vincule o perfil do usuario a um aluno para exibir mensalidade, faixa/grau e check-ins reais."
        />
      ) : null}

      {studentQuery.isLoading ? <LoadingState title="Carregando aluno" description="Buscando seu perfil, mensalidade Pix e progresso de graduacao." /> : null}

      {studentQuery.error ? (
        <ErrorState title="Erro ao carregar area do aluno" description="Confira RLS e o vinculo entre profiles, academy_members e students." />
      ) : null}

      {canUseSupabase && !studentQuery.isLoading && !studentQuery.error && experience && !experience.student ? (
        <EmptyState
          title="Aluno ainda nao vinculado"
          description="Sua conta existe, mas ainda nao ha um registro em students vinculado ao seu profile_id nesta Academia de Jiu-Jitsu."
        />
      ) : null}

      {summary ? (
        <>
          <div className="stats-grid two">
            <StatCard
              label="Mensalidade"
              value={summary.paymentStatusLabel}
              tone={summary.paymentStatus === 'paid' ? 'success' : summary.paymentStatus === 'overdue' ? 'danger' : 'warning'}
              detail={summary.paymentDetail}
            />
            <StatCard label="Graduacao" value={summary.beltLabel} detail={summary.progressDetail} />
          </div>

          <div className="card next-card">
            <h2>Progresso informado por presencas</h2>
            <div className="progress-track" aria-label={`Progresso ${summary.progressPercent}%`}>
              <span style={{ width: `${summary.progressPercent}%` }} />
            </div>
            <p>{summary.progressDetail}</p>
            <p>Promocoes de grau e faixa continuam aprovadas manualmente pela academia.</p>
          </div>
        </>
      ) : null}
    </section>
  )
}

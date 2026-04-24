import { PageHeader } from '../../shared/components/PageHeader'

export function GraduationPage() {
  return (
    <section>
      <PageHeader
        eyebrow="Graduacao"
        title="Faixa, grau e progresso"
        description="Check-ins informam progresso, mas toda promocao de grau ou faixa continua manual pela academia."
      />
      <div className="card belt-preview">
        <span className="belt-bar belt-branca" aria-hidden="true" />
        <div>
          <strong>Faixa branca, 0 graus</strong>
          <p>Regras de graduacao serao configuraveis por academia.</p>
        </div>
      </div>
    </section>
  )
}

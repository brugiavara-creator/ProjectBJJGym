import { PageHeader } from '../../shared/components/PageHeader'

export function PaymentsPage() {
  return (
    <section>
      <PageHeader
        eyebrow="Mensalidade"
        title="Pix da mensalidade"
        description="O aluno visualiza QR Pix e copia-e-cola; status pago so muda apos webhook confiavel da Asaas."
      />
      <div className="card empty-state">Fluxo Asaas Pix sera implementado em Edge Function sem expor chave secreta no navegador.</div>
    </section>
  )
}

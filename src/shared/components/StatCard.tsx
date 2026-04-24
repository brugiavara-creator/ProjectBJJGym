type StatCardProps = {
  label: string
  value: string
  tone?: 'default' | 'success' | 'warning' | 'danger'
  detail: string
}

export function StatCard({ label, value, tone = 'default', detail }: StatCardProps) {
  return (
    <article className={`stat-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
}

import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../shared/components/Button'
import { EmptyState } from '../../shared/components/StateViews'
import { hasSupabaseConfig, supabase } from '../../shared/lib/supabase'

export function PasswordResetPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase) {
      return
    }

    setError(null)
    setIsSubmitting(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`
    })
    setIsSubmitting(false)

    if (resetError) {
      setError('Nao foi possivel enviar recuperacao. Confira o e-mail e tente novamente.')
      return
    }

    setIsSent(true)
  }

  return (
    <main className="auth-shell">
      <section className="auth-card card">
        <div className="brand-mark" aria-hidden="true">JJ</div>
        <span className="eyebrow">Recuperar acesso</span>
        <h1>Redefinir senha</h1>
        <p>Enviaremos um link de recuperacao para a conta usada na academia.</p>

        {!hasSupabaseConfig ? (
          <EmptyState
            title="Supabase nao configurado"
            description="Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para enviar e-mails de recuperacao de senha."
            action={<Link className="btn secondary" to="/login">Voltar ao login</Link>}
          />
        ) : (
          <form className="form-card" onSubmit={handleSubmit}>
            <label className="field">
              <span>E-mail</span>
              <input autoComplete="email" inputMode="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            {isSent ? <p className="form-success">Se a conta existir, o link de recuperacao foi enviado.</p> : null}
            <Button disabled={isSubmitting} isBlock type="submit">
              {isSubmitting ? 'Enviando...' : 'Enviar link de recuperacao'}
            </Button>
            <Link className="auth-link" to="/login">Voltar ao login</Link>
          </form>
        )}
      </section>
    </main>
  )
}

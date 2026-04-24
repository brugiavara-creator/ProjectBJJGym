# Supabase

Local-first Supabase workspace for the BJJ App MVP.

## Initial Migration

The initial schema lives in `supabase/migrations/20260424000100_bjj_mvp_foundation.sql` for Linear issues `BJJ-10` and `BJJ-13`.

Core tables:

- `academies`
- `profiles`
- `academy_members`
- `students`
- `bjj_belts`
- `training_sessions`
- `checkins`
- `payments`
- `asaas_customers`
- `asaas_payment_events`
- `expenses`
- `graduation_rules`
- `audit_logs`

## Local Commands

```bash
pnpm dlx supabase start
pnpm dlx supabase db reset
pnpm dlx supabase migration new bjj_mvp_schema
```

## Edge Function Secrets

QR check-in functions require these secrets in local/staging/production Supabase environments:

```bash
pnpm dlx supabase secrets set QR_TOKEN_SECRET="replace-with-long-random-secret"
```

The Supabase runtime provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for service-role operations. Never expose these values through `VITE_` browser environment variables.

## Security Rules

- RLS must protect academy-scoped data from the first usable migration.
- Client code can read allowed payment state, but cannot mark a mensalidade as paid.
- Webhook processing must be idempotent before Pix UI is considered complete.
- QR check-in creation must happen only after backend validation.
- Authenticated clients have no write policy for `asaas_payment_events` or `audit_logs`; backend/service role code must write those records.
- `payments.status = 'paid'` is blocked from authenticated client insert/update policies so Asaas webhook processing remains authoritative.

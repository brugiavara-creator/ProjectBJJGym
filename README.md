# BJJ App MVP

Mobile-first PWA for Brazilian Jiu-Jitsu academies, starting from the `ProjectBJJGYM.html` prototype as product and visual reference.

## Stack

- React + Vite + TypeScript
- pnpm
- Supabase local-first for auth, Postgres, RLS, storage, and edge functions
- Vercel for frontend deployment
- Asaas Pix in a later trusted backend integration

## Local Development

```bash
pnpm install
pnpm dev
```

Copy `.env.example` to `.env.local` and fill the local Supabase anon key after starting Supabase locally.

```bash
cp .env.example .env.local
```

## Verification

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## Supabase Local First

The `supabase/` folder is reserved for local migrations, seed data, and edge functions. The first schema migration belongs to Linear issue `BJJ-10`.

Expected local workflow once the Supabase CLI is installed:

```bash
pnpm dlx supabase start
pnpm dlx supabase migration new bjj_mvp_schema
```

Keep these constraints from the first migration:

- Every academy-owned table includes `academy_id`.
- Payment status is only updated by trusted server/webhook code.
- QR check-ins are validated server-side and block duplicates.
- Promotion actions create audit logs.
- RLS is part of the foundation, not a later hardening task.

## Prototype Reference

`ProjectBJJGYM.html` remains a self-contained prototype. Use it for UI language, visual tokens, and workflow reference only. Do not carry its `localStorage` data model into production code.

## Vercel

Vercel should use:

- Install command: `pnpm install`
- Build command: `pnpm build`
- Output directory: `dist`

Production environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Never expose Asaas secret keys through Vite environment variables.

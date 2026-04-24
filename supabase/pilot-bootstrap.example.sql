-- Optional pilot bootstrap for local/staging setup after an auth user exists.
--
-- Usage:
-- 1. Create the user through Supabase Auth first.
-- 2. Replace the psql variables below when running this file, for example:
--    psql "$DATABASE_URL" \
--      -v pilot_user_id='00000000-0000-0000-0000-000000000000' \
--      -v pilot_full_name='Nome do Admin' \
--      -v pilot_email='admin@example.com' \
--      -f supabase/pilot-bootstrap.example.sql
--
-- Do not commit real user IDs or personal data into seed files. This script is
-- intentionally separate from seed.sql because it creates user-linked records.

\set pilot_academy_id '11111111-1111-4111-8111-111111111111'

insert into public.profiles (id, full_name)
values (:'pilot_user_id'::uuid, :'pilot_full_name')
on conflict (id) do update
set full_name = excluded.full_name;

insert into public.academy_members (academy_id, user_id, role, status, joined_at)
values (:'pilot_academy_id'::uuid, :'pilot_user_id'::uuid, 'owner', 'active', now())
on conflict (academy_id, user_id) do update
set
  role = excluded.role,
  status = excluded.status,
  joined_at = coalesce(public.academy_members.joined_at, excluded.joined_at);

insert into public.students (
  academy_id,
  profile_id,
  full_name,
  email,
  status,
  belt_id,
  grau,
  mensalidade_due_day,
  next_due_date,
  created_by
)
select
  :'pilot_academy_id'::uuid,
  :'pilot_user_id'::uuid,
  :'pilot_full_name',
  nullif(:'pilot_email', ''),
  'active',
  belt.id,
  0,
  10,
  current_date,
  :'pilot_user_id'::uuid
from public.bjj_belts belt
where belt.audience = 'adult'
  and belt.name = 'Branca'
on conflict (academy_id, profile_id) do update
set
  full_name = excluded.full_name,
  email = excluded.email,
  status = excluded.status;

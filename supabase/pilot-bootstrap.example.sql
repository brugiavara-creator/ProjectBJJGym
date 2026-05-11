-- Optional pilot bootstrap for local/staging setup after an auth user exists.
--
-- Usage:
-- 1. Create the user through Supabase Auth first (see seed.sql for curl commands).
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

-- ============================================================
-- Student bootstrap example
--
-- A student user needs the SAME four records as an owner/admin:
--   1. auth.users          -> created via Supabase Auth API (curl)
--   2. public.profiles     -> links auth user to display name
--   3. public.academy_members (role = 'student', status = 'active')
--                          -> REQUIRED for login; this is the access-control source of truth
--   4. public.students (profile_id = auth_user_id)
--                          -> student data (belt, grau, due date)
--
-- Usage for a student:
--   psql "$DATABASE_URL" \
--     -v student_user_id='00000000-0000-0000-0000-000000000000' \
--     -v student_full_name='Nome do Aluno' \
--     -v student_email='aluno@example.com' \
--     -f supabase/pilot-bootstrap.example.sql
--
-- Then run the STUDENT section below (or copy it into a separate script).
-- ============================================================

--\set student_user_id '00000000-0000-0000-0000-000000000000'
--\set student_full_name 'Nome do Aluno'
--\set student_email 'aluno@example.com'
--\set pilot_academy_id '11111111-1111-4111-8111-111111111111'
--
--insert into public.profiles (id, full_name)
--values (:'student_user_id'::uuid, :'student_full_name')
--on conflict (id) do update
--set full_name = excluded.full_name;
--
--insert into public.academy_members (academy_id, user_id, role, status, joined_at)
--values (:'pilot_academy_id'::uuid, :'student_user_id'::uuid, 'student', 'active', now())
--on conflict (academy_id, user_id) do update
--set
--  role = excluded.role,
--  status = excluded.status,
--  joined_at = coalesce(public.academy_members.joined_at, excluded.joined_at);
--
--insert into public.students (
--  academy_id,
--  profile_id,
--  full_name,
--  email,
--  status,
--  belt_id,
--  grau,
--  mensalidade_due_day,
--  next_due_date,
--  created_by
--)
--select
--  :'pilot_academy_id'::uuid,
--  :'student_user_id'::uuid,
--  :'student_full_name',
--  nullif(:'student_email', ''),
--  'active',
--  belt.id,
--  0,
--  10,
--  current_date,
--  :'student_user_id'::uuid
--from public.bjj_belts belt
--where belt.audience = 'adult'
--  and belt.name = 'Branca'
--on conflict (academy_id, profile_id) do update
--set
--  full_name = excluded.full_name,
--  email = excluded.email,
--  status = excluded.status;

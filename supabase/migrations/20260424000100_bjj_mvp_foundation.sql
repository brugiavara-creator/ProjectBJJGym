-- BJJ-10 / BJJ-13 Wave 1 database foundation for the BJJ App MVP.
-- Client writes are intentionally conservative: trusted payment webhooks,
-- QR validation, audit logging, and paid status transitions must run with a
-- backend/service role.

create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.academies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  primary_color text,
  address text,
  phone text,
  email text,
  timezone text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academies_name_not_blank check (btrim(name) <> ''),
  constraint academies_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_not_blank check (btrim(full_name) <> '')
);

create table public.academy_members (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null,
  status text not null default 'active',
  invited_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academy_members_role_check check (role in ('owner', 'admin', 'coach', 'student')),
  constraint academy_members_status_check check (status in ('invited', 'active', 'inactive')),
  constraint academy_members_unique_user_per_academy unique (academy_id, user_id)
);

create table public.bjj_belts (
  id uuid primary key default gen_random_uuid(),
  audience text not null,
  name text not null,
  rank smallint not null,
  max_grau smallint not null default 4,
  created_at timestamptz not null default now(),
  constraint bjj_belts_audience_check check (audience in ('adult', 'kids')),
  constraint bjj_belts_max_grau_check check (max_grau between 0 and 4),
  constraint bjj_belts_adult_path_check check (
    (audience = 'adult' and name in ('Branca', 'Azul', 'Roxa', 'Marrom', 'Preta', 'Coral', 'Vermelha'))
    or (audience = 'kids' and name in ('Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde'))
  ),
  constraint bjj_belts_unique_name unique (audience, name),
  constraint bjj_belts_unique_rank unique (audience, rank)
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  birth_date date,
  guardian_name text,
  status text not null default 'active',
  belt_id uuid not null references public.bjj_belts(id),
  grau smallint not null default 0,
  mensalidade_due_day smallint,
  next_due_date date,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint students_full_name_not_blank check (btrim(full_name) <> ''),
  constraint students_status_check check (status in ('active', 'inactive', 'prospect')),
  constraint students_grau_check check (grau between 0 and 4),
  constraint students_mensalidade_due_day_check check (mensalidade_due_day is null or mensalidade_due_day between 1 and 31),
  constraint students_unique_profile_per_academy unique (academy_id, profile_id),
  constraint students_unique_id_academy unique (id, academy_id)
);

create unique index students_unique_email_per_academy
  on public.students (academy_id, lower(email))
  where email is not null;

create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  title text not null default 'Treino de Jiu-Jitsu',
  training_date date not null default current_date,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'scheduled',
  qr_token_hash text unique,
  qr_expires_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_sessions_title_not_blank check (btrim(title) <> ''),
  constraint training_sessions_status_check check (status in ('scheduled', 'open', 'closed', 'cancelled')),
  constraint training_sessions_time_order check (ends_at is null or starts_at is null or ends_at > starts_at),
  constraint training_sessions_qr_expiry_required check (qr_token_hash is null or qr_expires_at is not null),
  constraint training_sessions_unique_id_academy unique (id, academy_id)
);

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  training_session_id uuid not null,
  student_id uuid not null,
  checked_in_at timestamptz not null default now(),
  source text not null default 'qr',
  status text not null default 'valid',
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  corrected_by uuid references public.profiles(id) on delete set null,
  corrected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint checkins_source_check check (source in ('qr', 'manual', 'correction')),
  constraint checkins_status_check check (status in ('valid', 'cancelled')),
  constraint checkins_unique_student_session unique (training_session_id, student_id),
  constraint checkins_session_same_academy foreign key (training_session_id, academy_id)
    references public.training_sessions(id, academy_id) on delete cascade,
  constraint checkins_student_same_academy foreign key (student_id, academy_id)
    references public.students(id, academy_id) on delete cascade
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  student_id uuid not null,
  competence_month date not null,
  due_date date not null,
  amount numeric(12, 2) not null,
  status text not null default 'pending',
  paid_at timestamptz,
  asaas_payment_id text unique,
  pix_qr_code_payload text,
  pix_copy_paste text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_student_same_academy foreign key (student_id, academy_id)
    references public.students(id, academy_id) on delete cascade,
  constraint payments_amount_positive check (amount > 0),
  constraint payments_status_check check (status in ('pending', 'overdue', 'paid', 'cancelled', 'refunded')),
  constraint payments_paid_at_check check ((status = 'paid') = (paid_at is not null)),
  constraint payments_competence_month_first_day check (competence_month = date_trunc('month', competence_month)::date),
  constraint payments_unique_student_month unique (academy_id, student_id, competence_month)
);

create table public.asaas_customers (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  student_id uuid not null,
  asaas_customer_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint asaas_customers_student_same_academy foreign key (student_id, academy_id)
    references public.students(id, academy_id) on delete cascade,
  constraint asaas_customers_unique_student unique (academy_id, student_id)
);

create table public.asaas_payment_events (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid references public.academies(id) on delete set null,
  asaas_event_id text not null unique,
  asaas_payment_id text,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint asaas_payment_events_payload_object check (jsonb_typeof(payload) = 'object')
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  category text not null,
  description text not null,
  amount numeric(12, 2) not null,
  expense_date date not null default current_date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expenses_category_not_blank check (btrim(category) <> ''),
  constraint expenses_description_not_blank check (btrim(description) <> ''),
  constraint expenses_amount_positive check (amount > 0)
);

create table public.graduation_rules (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid references public.academies(id) on delete cascade,
  belt_id uuid not null references public.bjj_belts(id) on delete cascade,
  grau smallint not null,
  required_checkins integer not null default 0,
  minimum_days integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint graduation_rules_grau_check check (grau between 0 and 4),
  constraint graduation_rules_required_checkins_check check (required_checkins >= 0),
  constraint graduation_rules_minimum_days_check check (minimum_days >= 0)
);

create unique index graduation_rules_unique_scope
  on public.graduation_rules (coalesce(academy_id, '00000000-0000-0000-0000-000000000000'::uuid), belt_id, grau);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid references public.academies(id) on delete set null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_table text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_action_not_blank check (btrim(action) <> ''),
  constraint audit_logs_entity_table_not_blank check (btrim(entity_table) <> ''),
  constraint audit_logs_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index academy_members_academy_id_idx on public.academy_members (academy_id);
create index academy_members_user_id_idx on public.academy_members (user_id);
create index students_academy_id_idx on public.students (academy_id);
create index students_profile_id_idx on public.students (profile_id);
create index training_sessions_academy_date_idx on public.training_sessions (academy_id, training_date desc);
create index checkins_academy_checked_in_idx on public.checkins (academy_id, checked_in_at desc);
create index checkins_student_id_idx on public.checkins (student_id);
create index payments_academy_status_due_idx on public.payments (academy_id, status, due_date);
create index payments_student_id_idx on public.payments (student_id);
create index asaas_payment_events_payment_idx on public.asaas_payment_events (asaas_payment_id);
create index expenses_academy_date_idx on public.expenses (academy_id, expense_date desc);
create index audit_logs_academy_created_idx on public.audit_logs (academy_id, created_at desc);

create trigger set_academies_updated_at before update on public.academies
  for each row execute function public.set_updated_at();
create trigger set_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_academy_members_updated_at before update on public.academy_members
  for each row execute function public.set_updated_at();
create trigger set_students_updated_at before update on public.students
  for each row execute function public.set_updated_at();
create trigger set_training_sessions_updated_at before update on public.training_sessions
  for each row execute function public.set_updated_at();
create trigger set_checkins_updated_at before update on public.checkins
  for each row execute function public.set_updated_at();
create trigger set_payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();
create trigger set_asaas_customers_updated_at before update on public.asaas_customers
  for each row execute function public.set_updated_at();
create trigger set_expenses_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();
create trigger set_graduation_rules_updated_at before update on public.graduation_rules
  for each row execute function public.set_updated_at();

create or replace function public.current_user_has_academy_role(target_academy_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.academy_members member
    where member.academy_id = target_academy_id
      and member.user_id = auth.uid()
      and member.status = 'active'
      and member.role = any (allowed_roles)
  );
$$;

create or replace function public.current_user_is_academy_member(target_academy_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_has_academy_role(target_academy_id, array['owner', 'admin', 'coach', 'student']);
$$;

create or replace function public.current_user_is_academy_admin(target_academy_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_has_academy_role(target_academy_id, array['owner', 'admin']);
$$;

create or replace function public.current_user_is_academy_student(target_academy_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.students student
    where student.academy_id = target_academy_id
      and student.profile_id = auth.uid()
      and student.status = 'active'
  );
$$;

alter table public.academies enable row level security;
alter table public.profiles enable row level security;
alter table public.academy_members enable row level security;
alter table public.bjj_belts enable row level security;
alter table public.students enable row level security;
alter table public.training_sessions enable row level security;
alter table public.checkins enable row level security;
alter table public.payments enable row level security;
alter table public.asaas_customers enable row level security;
alter table public.asaas_payment_events enable row level security;
alter table public.expenses enable row level security;
alter table public.graduation_rules enable row level security;
alter table public.audit_logs enable row level security;

create policy academies_select_for_members_and_students
  on public.academies for select to authenticated
  using (public.current_user_is_academy_member(id) or public.current_user_is_academy_student(id));

create policy academies_update_for_admins
  on public.academies for update to authenticated
  using (public.current_user_is_academy_admin(id))
  with check (public.current_user_is_academy_admin(id));

create policy profiles_insert_own
  on public.profiles for insert to authenticated
  with check (id = auth.uid());

create policy profiles_select_own_or_academy_admin
  on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.academy_members member
      where member.user_id = profiles.id
        and public.current_user_is_academy_admin(member.academy_id)
    )
    or exists (
      select 1
      from public.students student
      where student.profile_id = profiles.id
        and public.current_user_is_academy_admin(student.academy_id)
    )
  );

create policy profiles_update_own
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy academy_members_select_own_or_admin
  on public.academy_members for select to authenticated
  using (user_id = auth.uid() or public.current_user_is_academy_admin(academy_id));

create policy academy_members_insert_for_admins
  on public.academy_members for insert to authenticated
  with check (public.current_user_is_academy_admin(academy_id));

create policy academy_members_update_for_admins
  on public.academy_members for update to authenticated
  using (public.current_user_is_academy_admin(academy_id))
  with check (public.current_user_is_academy_admin(academy_id));

create policy academy_members_delete_for_admins
  on public.academy_members for delete to authenticated
  using (public.current_user_is_academy_admin(academy_id));

create policy bjj_belts_select_authenticated
  on public.bjj_belts for select to authenticated
  using (true);

create policy students_select_for_staff_or_self
  on public.students for select to authenticated
  using (
    public.current_user_has_academy_role(academy_id, array['owner', 'admin', 'coach'])
    or profile_id = auth.uid()
  );

create policy students_insert_for_admins
  on public.students for insert to authenticated
  with check (public.current_user_is_academy_admin(academy_id));

create policy students_update_for_admins
  on public.students for update to authenticated
  using (public.current_user_is_academy_admin(academy_id))
  with check (public.current_user_is_academy_admin(academy_id));

create policy students_delete_for_admins
  on public.students for delete to authenticated
  using (public.current_user_is_academy_admin(academy_id));

create policy training_sessions_select_for_members_and_students
  on public.training_sessions for select to authenticated
  using (public.current_user_is_academy_member(academy_id) or public.current_user_is_academy_student(academy_id));

create policy training_sessions_insert_for_admins
  on public.training_sessions for insert to authenticated
  with check (
    public.current_user_is_academy_admin(academy_id)
    and qr_token_hash is null
    and qr_expires_at is null
  );

create policy training_sessions_update_for_admins
  on public.training_sessions for update to authenticated
  using (public.current_user_is_academy_admin(academy_id))
  with check (
    public.current_user_is_academy_admin(academy_id)
    and qr_token_hash is null
    and qr_expires_at is null
  );

create policy training_sessions_delete_for_admins
  on public.training_sessions for delete to authenticated
  using (public.current_user_is_academy_admin(academy_id));

create policy checkins_select_for_staff_or_self
  on public.checkins for select to authenticated
  using (
    public.current_user_has_academy_role(academy_id, array['owner', 'admin', 'coach'])
    or exists (
      select 1
      from public.students student
      where student.id = checkins.student_id
        and student.profile_id = auth.uid()
    )
  );

create policy payments_select_for_staff_or_self
  on public.payments for select to authenticated
  using (
    public.current_user_has_academy_role(academy_id, array['owner', 'admin', 'coach'])
    or exists (
      select 1
      from public.students student
      where student.id = payments.student_id
        and student.profile_id = auth.uid()
    )
  );

create policy payments_insert_for_admins_not_paid
  on public.payments for insert to authenticated
  with check (public.current_user_is_academy_admin(academy_id) and status <> 'paid');

create policy payments_update_for_admins_not_paid
  on public.payments for update to authenticated
  using (public.current_user_is_academy_admin(academy_id) and status <> 'paid')
  with check (public.current_user_is_academy_admin(academy_id) and status <> 'paid' and paid_at is null);

create policy payments_delete_for_admins_not_paid
  on public.payments for delete to authenticated
  using (public.current_user_is_academy_admin(academy_id) and status <> 'paid');

create policy asaas_customers_select_for_admins
  on public.asaas_customers for select to authenticated
  using (public.current_user_is_academy_admin(academy_id));

create policy asaas_payment_events_select_for_admins
  on public.asaas_payment_events for select to authenticated
  using (academy_id is not null and public.current_user_is_academy_admin(academy_id));

create policy expenses_select_for_admins
  on public.expenses for select to authenticated
  using (public.current_user_is_academy_admin(academy_id));

create policy expenses_insert_for_admins
  on public.expenses for insert to authenticated
  with check (public.current_user_is_academy_admin(academy_id));

create policy expenses_update_for_admins
  on public.expenses for update to authenticated
  using (public.current_user_is_academy_admin(academy_id))
  with check (public.current_user_is_academy_admin(academy_id));

create policy expenses_delete_for_admins
  on public.expenses for delete to authenticated
  using (public.current_user_is_academy_admin(academy_id));

create policy graduation_rules_select_for_members_and_students
  on public.graduation_rules for select to authenticated
  using (academy_id is null or public.current_user_is_academy_member(academy_id) or public.current_user_is_academy_student(academy_id));

create policy graduation_rules_insert_for_admins
  on public.graduation_rules for insert to authenticated
  with check (academy_id is not null and public.current_user_is_academy_admin(academy_id));

create policy graduation_rules_update_for_admins
  on public.graduation_rules for update to authenticated
  using (academy_id is not null and public.current_user_is_academy_admin(academy_id))
  with check (academy_id is not null and public.current_user_is_academy_admin(academy_id));

create policy graduation_rules_delete_for_admins
  on public.graduation_rules for delete to authenticated
  using (academy_id is not null and public.current_user_is_academy_admin(academy_id));

create policy audit_logs_select_for_admins
  on public.audit_logs for select to authenticated
  using (academy_id is not null and public.current_user_is_academy_admin(academy_id));

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.current_user_has_academy_role(uuid, text[]) to authenticated;
grant execute on function public.current_user_is_academy_member(uuid) to authenticated;
grant execute on function public.current_user_is_academy_admin(uuid) to authenticated;
grant execute on function public.current_user_is_academy_student(uuid) to authenticated;

comment on table public.bjj_belts is 'Global BJJ belt paths for adult and kids students. Promotions remain manually approved by academy admins.';
comment on table public.training_sessions is 'BJJ training sessions. QR tokens must be short-lived and validated by trusted backend code.';
comment on table public.checkins is 'One check-in per student per BJJ training session, enforced server-side by a unique constraint.';
comment on table public.payments is 'Mensalidade Pix payment state. Clients cannot set paid status; trusted Asaas webhook processing must do that.';
comment on table public.asaas_payment_events is 'Raw Asaas webhook events for idempotency and debugging. No authenticated client write policies are defined.';
comment on table public.audit_logs is 'Sensitive admin/payment/check-in/graduation actions. No authenticated client write policies are defined.';

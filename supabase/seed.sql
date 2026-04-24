-- Idempotent local seed for the BJJ App MVP Wave 1 foundation.
-- Keep this limited to pilot academy metadata, global BJJ belt paths, and
-- pilot-safe defaults that do not grant user access.

insert into public.academies (id, name, slug, timezone)
values (
  '11111111-1111-4111-8111-111111111111',
  'Academia Piloto de Jiu-Jitsu',
  'academia-piloto-jiu-jitsu',
  'America/Sao_Paulo'
)
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  timezone = excluded.timezone;

insert into public.bjj_belts (audience, name, rank, max_grau)
values
  ('adult', 'Branca', 1, 4),
  ('adult', 'Azul', 2, 4),
  ('adult', 'Roxa', 3, 4),
  ('adult', 'Marrom', 4, 4),
  ('adult', 'Preta', 5, 4),
  ('adult', 'Coral', 6, 0),
  ('adult', 'Vermelha', 7, 0),
  ('kids', 'Branca', 1, 4),
  ('kids', 'Cinza', 2, 4),
  ('kids', 'Amarela', 3, 4),
  ('kids', 'Laranja', 4, 4),
  ('kids', 'Verde', 5, 4)
on conflict (audience, name) do update
set
  rank = excluded.rank,
  max_grau = excluded.max_grau;

-- BJJ-11 pilot defaults: attendance-informed readiness thresholds for each
-- grau. These are academy-configurable signals only; faixa/grau promotions
-- remain manually approved by academy admins.
insert into public.graduation_rules (academy_id, belt_id, grau, required_checkins, minimum_days, active)
select
  '11111111-1111-4111-8111-111111111111'::uuid as academy_id,
  belt.id as belt_id,
  rule.grau,
  rule.required_checkins,
  rule.minimum_days,
  true as active
from public.bjj_belts belt
cross join lateral (
  values
    (0, case when belt.audience = 'kids' then 12 when belt.name = 'Branca' then 20 else 30 end, 30),
    (1, case when belt.audience = 'kids' then 16 when belt.name = 'Branca' then 25 else 35 end, 45),
    (2, case when belt.audience = 'kids' then 20 when belt.name = 'Branca' then 30 else 40 end, 60),
    (3, case when belt.audience = 'kids' then 24 when belt.name = 'Branca' then 35 else 45 end, 75)
) as rule(grau, required_checkins, minimum_days)
where belt.max_grau > 0
  and rule.grau < belt.max_grau
on conflict (coalesce(academy_id, '00000000-0000-0000-0000-000000000000'::uuid), belt_id, grau) do update
set
  required_checkins = excluded.required_checkins,
  minimum_days = excluded.minimum_days,
  active = excluded.active;

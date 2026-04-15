-- Structured research criteria (1–10 sliders) + aggregate view for founders.
-- Existing clarity_score (1–5) is kept; value_clarity_score is the primary “messaging” slider.

alter table public.research_responses
  add column if not exists usability_score smallint,
  add column if not exists scalability_score smallint,
  add column if not exists value_clarity_score smallint,
  add column if not exists desirability_score smallint,
  add column if not exists trust_score smallint;

update public.research_responses
set
  usability_score = coalesce(usability_score, 5),
  scalability_score = coalesce(scalability_score, 5),
  value_clarity_score = coalesce(
    value_clarity_score,
    greatest(1, least(10, (coalesce(clarity_score, 3) * 2)))
  ),
  desirability_score = coalesce(desirability_score, 5),
  trust_score = coalesce(trust_score, 5);

alter table public.research_responses
  alter column usability_score set default 5,
  alter column scalability_score set default 5,
  alter column value_clarity_score set default 5,
  alter column desirability_score set default 5,
  alter column trust_score set default 5;

alter table public.research_responses
  alter column usability_score set not null,
  alter column scalability_score set not null,
  alter column value_clarity_score set not null,
  alter column desirability_score set not null,
  alter column trust_score set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    where t.relname = 'research_responses' and c.conname = 'research_responses_usability_score_range'
  ) then
    alter table public.research_responses
      add constraint research_responses_usability_score_range check (usability_score between 1 and 10);
  end if;
  if not exists (
    select 1 from pg_constraint c join pg_class t on c.conrelid = t.oid
    where t.relname = 'research_responses' and c.conname = 'research_responses_scalability_score_range'
  ) then
    alter table public.research_responses
      add constraint research_responses_scalability_score_range check (scalability_score between 1 and 10);
  end if;
  if not exists (
    select 1 from pg_constraint c join pg_class t on c.conrelid = t.oid
    where t.relname = 'research_responses' and c.conname = 'research_responses_value_clarity_score_range'
  ) then
    alter table public.research_responses
      add constraint research_responses_value_clarity_score_range check (value_clarity_score between 1 and 10);
  end if;
  if not exists (
    select 1 from pg_constraint c join pg_class t on c.conrelid = t.oid
    where t.relname = 'research_responses' and c.conname = 'research_responses_desirability_score_range'
  ) then
    alter table public.research_responses
      add constraint research_responses_desirability_score_range check (desirability_score between 1 and 10);
  end if;
  if not exists (
    select 1 from pg_constraint c join pg_class t on c.conrelid = t.oid
    where t.relname = 'research_responses' and c.conname = 'research_responses_trust_score_range'
  ) then
    alter table public.research_responses
      add constraint research_responses_trust_score_range check (trust_score between 1 and 10);
  end if;
end $$;

create or replace view public.startup_research_criteria_aggregates
with (security_invoker = false) as
select
  startup_id,
  count(*)::bigint as response_count,
  round(avg(usability_score)::numeric, 1)       as avg_usability,
  round(avg(scalability_score)::numeric, 1)     as avg_scalability,
  round(avg(value_clarity_score)::numeric, 1) as avg_value_clarity,
  round(avg(desirability_score)::numeric, 1)   as avg_desirability,
  round(avg(trust_score)::numeric, 1)           as avg_trust,
  round(avg(clarity_score)::numeric, 1)         as avg_clarity_legacy
from public.research_responses
group by startup_id;

grant select on public.startup_research_criteria_aggregates to anon, authenticated, service_role;

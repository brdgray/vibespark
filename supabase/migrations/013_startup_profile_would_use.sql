-- Quick "would you use this?" on startup profiles (no Research Lab session required).
-- Metrics merge with lab responses: per (startup_id, user_id), lab answer wins over profile.

create table if not exists public.startup_profile_would_use (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  would_use text not null check (would_use in ('yes', 'maybe', 'no')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (startup_id, user_id)
);

create index if not exists idx_startup_profile_would_use_startup_id
  on public.startup_profile_would_use (startup_id);

drop trigger if exists trg_startup_profile_would_use_updated_at on public.startup_profile_would_use;
create trigger trg_startup_profile_would_use_updated_at
  before update on public.startup_profile_would_use
  for each row execute function public.update_updated_at_column();

alter table public.startup_profile_would_use enable row level security;

grant select, insert, update on public.startup_profile_would_use to authenticated;

create policy "startup_profile_would_use_select_own"
  on public.startup_profile_would_use for select
  using (auth.uid() = user_id);

create policy "startup_profile_would_use_insert_own_not_owner"
  on public.startup_profile_would_use for insert
  with check (
    auth.uid() = user_id
    and not public.is_startup_owner(auth.uid(), startup_id)
  );

create policy "startup_profile_would_use_update_own_not_owner"
  on public.startup_profile_would_use for update
  using (
    auth.uid() = user_id
    and not public.is_startup_owner(auth.uid(), startup_id)
  )
  with check (
    auth.uid() = user_id
    and not public.is_startup_owner(auth.uid(), startup_id)
  );

-- ---------------------------------------------------------------------------
-- Spark metrics: would-use counts = deduped union (Research Lab wins per user)
-- ---------------------------------------------------------------------------
create or replace view public.startup_spark_score_metrics
with (security_invoker = false) as
select
  s.id as startup_id,

  coalesce(v.support_count, 0)   as support_count,
  coalesce(sv.save_count, 0)     as save_count,
  r.avg_rating,
  coalesce(c.comment_count, 0)   as total_comments,
  coalesce(rr.response_count, 0) as total_research_responses,
  coalesce(wu.wu_yes, 0)         as would_use_yes,
  coalesce(wu.wu_maybe, 0)       as would_use_maybe,
  coalesce(wu.wu_no, 0)          as would_use_no,

  case
    when coalesce(wu.wu_total, 0) > 0
    then round(
           (coalesce(wu.wu_yes, 0)::numeric
            / coalesce(wu.wu_total, 1)::numeric) * 100::numeric,
           1)
    else 0::numeric
  end as would_use_pct,

  coalesce(act.activity_7d, 0) as activity_7d,

  round((
    least(
      ln(1::numeric + coalesce(act.activity_7d, 0)::numeric)
      / ln(101::numeric),
      1::numeric
    ) * 70::numeric
    +
    (
      least(
        ln(1::numeric + coalesce(v.support_count,   0)::numeric) / ln(101::numeric), 1::numeric) * 25::numeric
      + case
          when coalesce(wu.wu_total, 0) > 0
          then (coalesce(wu.wu_yes, 0)::numeric
                / coalesce(wu.wu_total, 1)::numeric) * 25::numeric
          else 0::numeric
        end
      + least(
          ln(1::numeric + coalesce(sv.save_count,     0)::numeric) / ln(101::numeric), 1::numeric) * 15::numeric
      + least(
          ln(1::numeric + coalesce(c.comment_count,   0)::numeric) / ln(101::numeric), 1::numeric) * 10::numeric
      + least(
          ln(1::numeric + coalesce(rr.response_count, 0)::numeric) / ln(101::numeric), 1::numeric) * 15::numeric
    ) * 0.3::numeric
  ), 1) as trending_score,

  round((
    least(
      ln(1::numeric + coalesce(v.support_count,   0)::numeric) / ln(101::numeric), 1::numeric) * 25::numeric
    + case
        when coalesce(wu.wu_total, 0) > 0
        then (coalesce(wu.wu_yes, 0)::numeric
              / coalesce(wu.wu_total, 1)::numeric) * 25::numeric
        else 0::numeric
      end
    + least(
        ln(1::numeric + coalesce(sv.save_count,     0)::numeric) / ln(101::numeric), 1::numeric) * 15::numeric
    + least(
        ln(1::numeric + coalesce(c.comment_count,   0)::numeric) / ln(101::numeric), 1::numeric) * 10::numeric
    + least(
        ln(1::numeric + coalesce(rr.response_count, 0)::numeric) / ln(101::numeric), 1::numeric) * 15::numeric
    + least(
        ln(1::numeric + coalesce(act.activity_7d,   0)::numeric) / ln(101::numeric), 1::numeric) * 10::numeric
  ), 1) as spark_score

from public.startups s

left join (
  select startup_id, count(*) as support_count
  from public.startup_votes
  where vote_type = 'support'
  group by startup_id
) v on v.startup_id = s.id

left join (
  select startup_id, count(*) as save_count
  from public.startup_saves
  group by startup_id
) sv on sv.startup_id = s.id

left join (
  select startup_id,
         round(avg(rating)::numeric, 1) as avg_rating
  from public.startup_ratings
  group by startup_id
) r on r.startup_id = s.id

left join (
  select startup_id, count(*) as comment_count
  from public.startup_comments
  where status = 'published'
  group by startup_id
) c on c.startup_id = s.id

left join (
  select
    startup_id,
    count(*)                                        as response_count,
    count(*) filter (where would_use = 'yes')       as yes_count,
    count(*) filter (where would_use = 'maybe')     as maybe_count,
    count(*) filter (where would_use = 'no')        as no_count
  from public.research_responses
  group by startup_id
) rr on rr.startup_id = s.id

left join (
  select
    startup_id,
    count(*)                                  as wu_total,
    count(*) filter (where would_use = 'yes')   as wu_yes,
    count(*) filter (where would_use = 'maybe') as wu_maybe,
    count(*) filter (where would_use = 'no')    as wu_no
  from (
    select distinct on (startup_id, user_id)
      startup_id,
      user_id,
      would_use
    from (
      select startup_id, user_id, would_use, 1 as ord, created_at from public.research_responses
      union all
      select startup_id, user_id, would_use, 2 as ord, created_at from public.startup_profile_would_use
    ) u
    order by startup_id, user_id, ord asc, created_at desc
  ) dedup
  group by startup_id
) wu on wu.startup_id = s.id

left join (
  select startup_id, count(*) as activity_7d
  from (
    select startup_id, created_at from public.startup_votes
      where created_at > now() - interval '7 days'
    union all
    select startup_id, created_at from public.startup_saves
      where created_at > now() - interval '7 days'
    union all
    select startup_id, created_at from public.startup_comments
      where created_at > now() - interval '7 days'
    union all
    select startup_id, created_at from public.research_responses
      where created_at > now() - interval '7 days'
    union all
    select startup_id, greatest(created_at, updated_at) as created_at from public.startup_profile_would_use
      where greatest(created_at, updated_at) > now() - interval '7 days'
  ) recent
  group by startup_id
) act on act.startup_id = s.id;

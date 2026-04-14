-- ============================================================
-- VibeSpark — Spark Score: rename view, history table, screenshots
-- ============================================================

-- 1. Rename signal_score → spark_score in the view
--    Drop old view first, then recreate under new name.
drop view if exists startup_signal_metrics;

create or replace view startup_spark_score_metrics as
select
  s.id as startup_id,

  coalesce(v.support_count, 0)   as support_count,
  coalesce(sv.save_count, 0)     as save_count,
  r.avg_rating,
  coalesce(c.comment_count, 0)   as total_comments,
  coalesce(rr.response_count, 0) as total_research_responses,
  coalesce(rr.yes_count, 0)      as would_use_yes,
  coalesce(rr.maybe_count, 0)    as would_use_maybe,
  coalesce(rr.no_count, 0)       as would_use_no,

  -- Would-use %
  case
    when coalesce(rr.response_count, 0) > 0
    then round(
           (coalesce(rr.yes_count, 0)::numeric
            / coalesce(rr.response_count, 1)::numeric) * 100::numeric,
           1)
    else 0::numeric
  end as would_use_pct,

  coalesce(act.activity_7d, 0) as activity_7d,

  -- Trending score  (70% recency + 30% spark)
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
          when coalesce(rr.response_count, 0) > 0
          then (coalesce(rr.yes_count, 0)::numeric
                / coalesce(rr.response_count, 1)::numeric) * 25::numeric
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

  -- Spark Score (composite 0-100)
  round((
    least(
      ln(1::numeric + coalesce(v.support_count,   0)::numeric) / ln(101::numeric), 1::numeric) * 25::numeric
    + case
        when coalesce(rr.response_count, 0) > 0
        then (coalesce(rr.yes_count, 0)::numeric
              / coalesce(rr.response_count, 1)::numeric) * 25::numeric
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
  ) * 100::numeric, 1) as spark_score

from startups s

left join (
  select startup_id, count(*) as support_count
  from startup_votes
  where vote_type = 'support'
  group by startup_id
) v on v.startup_id = s.id

left join (
  select startup_id, count(*) as save_count
  from startup_saves
  group by startup_id
) sv on sv.startup_id = s.id

left join (
  select startup_id,
         round(avg(rating)::numeric, 1) as avg_rating
  from startup_ratings
  group by startup_id
) r on r.startup_id = s.id

left join (
  select startup_id, count(*) as comment_count
  from startup_comments
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
  from research_responses
  group by startup_id
) rr on rr.startup_id = s.id

left join (
  select startup_id, count(*) as activity_7d
  from (
    select startup_id, created_at from startup_votes
      where created_at > now() - interval '7 days'
    union all
    select startup_id, created_at from startup_saves
      where created_at > now() - interval '7 days'
    union all
    select startup_id, created_at from startup_comments
      where created_at > now() - interval '7 days'
    union all
    select startup_id, created_at from research_responses
      where created_at > now() - interval '7 days'
  ) recent
  group by startup_id
) act on act.startup_id = s.id;

-- ============================================================
-- 2. Spark Score History — daily snapshot
-- ============================================================
create table if not exists startup_spark_score_history (
  id           uuid primary key default uuid_generate_v4(),
  startup_id   uuid not null references startups(id) on delete cascade,
  spark_score  int  not null default 0,
  recorded_date date not null default current_date,
  unique(startup_id, recorded_date)
);

create index if not exists idx_spark_history_startup
  on startup_spark_score_history(startup_id, recorded_date desc);

-- RLS
alter table startup_spark_score_history enable row level security;

create policy "spark_history_select_all" on startup_spark_score_history
  for select using (true);

create policy "spark_history_insert_admin" on startup_spark_score_history
  for insert with check (is_admin(auth.uid()));

-- pg_cron daily job (requires pg_cron extension enabled in Supabase project settings)
-- Run this separately in SQL editor if pg_cron is available:
-- select cron.schedule('record-spark-scores', '0 0 * * *', $$
--   insert into startup_spark_score_history (startup_id, spark_score, recorded_date)
--   select startup_id, spark_score::int, current_date
--   from startup_spark_score_metrics
--   on conflict (startup_id, recorded_date) do update set spark_score = excluded.spark_score;
-- $$);

-- Seed today's scores immediately
insert into startup_spark_score_history (startup_id, spark_score, recorded_date)
select startup_id, spark_score::int, current_date
from startup_spark_score_metrics
on conflict (startup_id, recorded_date) do update set spark_score = excluded.spark_score;

-- ============================================================
-- 3. Startup Screenshots table
-- ============================================================
create table if not exists startup_screenshots (
  id            uuid primary key default uuid_generate_v4(),
  startup_id    uuid not null references startups(id) on delete cascade,
  storage_path  text not null,
  display_order int  not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists idx_screenshots_startup
  on startup_screenshots(startup_id, display_order);

alter table startup_screenshots enable row level security;

create policy "screenshots_select_all" on startup_screenshots
  for select using (true);

create policy "screenshots_insert_owner_admin" on startup_screenshots
  for insert with check (
    is_admin(auth.uid()) or is_startup_owner(auth.uid(), startup_id)
  );

create policy "screenshots_delete_owner_admin" on startup_screenshots
  for delete using (
    is_admin(auth.uid()) or is_startup_owner(auth.uid(), startup_id)
  );

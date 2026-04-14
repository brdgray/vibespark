-- ============================================================
-- VibeSpark — Fix Spark Score scale (was 0-10000, should be 0-100)
-- The previous view multiplied the already-0-100 result by 100
-- again, inflating a single vote by 500+. This corrects that.
-- ============================================================

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

  -- Trending score (70% recency + 30% spark, capped at ~97)
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

  -- Spark Score (0-100): weights sum to 100, each component 0-1
  -- ln(1+n)/ln(101) normalises: n=0→0, n=1→~0.15, n=10→~0.48, n=100→1
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
  ), 1) as spark_score    -- ← removed the erroneous * 100 here

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

-- Refresh today's history snapshot with the corrected scores
insert into startup_spark_score_history (startup_id, spark_score, recorded_date)
select startup_id, spark_score::int, current_date
from startup_spark_score_metrics
on conflict (startup_id, recorded_date) do update set spark_score = excluded.spark_score;

-- ============================================================
-- VibeSpark — Analytics Views & Storage Buckets
-- ============================================================

-- Helper: log-normalize a count (0..1 scale, saturates ~100)
-- Uses ln(101::numeric) so all arithmetic stays numeric.

-- ============================================================
-- startup_signal_metrics view
-- ============================================================
create or replace view startup_signal_metrics as
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

  -- Trending score  (70 % recency + 30 % signal)
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

  -- Signal score  (composite 0-100)
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
  ) * 100::numeric, 1) as signal_score

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
-- startup_demographic_summary view
-- ============================================================
create or replace view startup_demographic_summary as
select
  rr.startup_id,
  rd.age_range,
  rd.profession,
  rd.persona_type,
  count(*) filter (where rr.would_use = 'yes')   as yes_count,
  count(*) filter (where rr.would_use = 'maybe')  as maybe_count,
  count(*) filter (where rr.would_use = 'no')     as no_count,
  count(*)                                         as total
from research_responses rr
join research_demographics rd on rd.user_id = rr.user_id
group by rr.startup_id, rd.age_range, rd.profession, rd.persona_type;

-- ============================================================
-- Storage buckets — create in Supabase dashboard → Storage:
--   startup-logos       (public: true)
--   startup-screenshots (public: true)
--   avatars             (public: true)
-- ============================================================

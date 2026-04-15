-- Founders may only SELECT incoming research_responses for startups they own
-- after giving structured feedback on at least 3 other startups' listings.
-- Aggregate views use security_invoker = false so anonymous users still see
-- public counts (RLS on the base table would otherwise hide all rows from anon).

-- ---------------------------------------------------------------------------
-- Helper: true when user has >=3 research_responses on startups they do not own
-- ---------------------------------------------------------------------------
create or replace function public.founder_research_giveback_met(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select count(*) >= 3
      from public.research_responses rr
      where rr.user_id = p_user_id
        and not exists (
          select 1 from public.startups s
          where s.id = rr.startup_id and s.created_by = p_user_id
        )
    ),
    false
  );
$$;

grant execute on function public.founder_research_giveback_met(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- research_responses SELECT
-- ---------------------------------------------------------------------------
drop policy if exists "resp_select_own_or_admin" on public.research_responses;

create policy "resp_select_own_or_admin" on public.research_responses
  for select using (
    auth.uid() = user_id
    or public.is_admin(auth.uid())
    or (
      public.is_startup_owner(auth.uid(), startup_id)
      and public.founder_research_giveback_met(auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Public aggregate views (invoker RLS would zero out research for everyone)
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
  coalesce(rr.yes_count, 0)      as would_use_yes,
  coalesce(rr.maybe_count, 0)    as would_use_maybe,
  coalesce(rr.no_count, 0)       as would_use_no,

  case
    when coalesce(rr.response_count, 0) > 0
    then round(
           (coalesce(rr.yes_count, 0)::numeric
            / coalesce(rr.response_count, 1)::numeric) * 100::numeric,
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
  ) recent
  group by startup_id
) act on act.startup_id = s.id;

create or replace view public.startup_demographic_summary
with (security_invoker = false) as
select
  rr.startup_id,
  rd.age_range,
  rd.profession,
  rd.persona_type,
  count(*) filter (where rr.would_use = 'yes')   as yes_count,
  count(*) filter (where rr.would_use = 'maybe')  as maybe_count,
  count(*) filter (where rr.would_use = 'no')     as no_count,
  count(*)                                         as total
from public.research_responses rr
join public.research_demographics rd on rd.user_id = rr.user_id
group by rr.startup_id, rd.age_range, rd.profession, rd.persona_type;

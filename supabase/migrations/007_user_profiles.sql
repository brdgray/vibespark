-- ============================================================
-- VibeSpark — User Profile Enhancements
-- Adds: username handles, bio, user score events, badges, triggers
-- ============================================================

-- ============================================================
-- 1. Extend profiles table
-- ============================================================

alter table profiles
  add column if not exists username text unique,
  add column if not exists bio text;

-- Enforce @handle format: lowercase alphanumeric + underscores, 3–20 chars
-- Only enforced when non-null
alter table profiles
  drop constraint if exists username_format;

alter table profiles
  add constraint username_format check (
    username is null or username ~ '^[a-z0-9_]{3,20}$'
  );

-- ============================================================
-- 2. User score events — append-only ledger of point awards
-- ============================================================

create table if not exists user_score_events (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  event_type text not null
    check (event_type in ('signup_bonus','research_feedback','vote','save','comment',
                          'vote_removed','save_removed','comment_removed')),
  points     int  not null,
  startup_id uuid references startups(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_score_events_user_id on user_score_events(user_id);

alter table user_score_events enable row level security;

create policy "score_events_read_own" on user_score_events
  for select using (auth.uid() = user_id);

create policy "score_events_insert_service" on user_score_events
  for insert with check (true);  -- triggers run as SECURITY DEFINER

-- ============================================================
-- 3. User badges
-- ============================================================

create table if not exists user_badges (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  badge_key  text not null
    check (badge_key in (
      'early_adopter','spark_giver','research_pro','insight_machine',
      'supporter','super_supporter','trendsetter','commentator'
    )),
  awarded_at timestamptz not null default now(),
  unique(user_id, badge_key)
);

create index if not exists idx_badges_user_id on user_badges(user_id);

alter table user_badges enable row level security;

create policy "badges_read_all" on user_badges
  for select using (true);

create policy "badges_insert_service" on user_badges
  for insert with check (true);

-- ============================================================
-- 4. user_scores view — live total per user
-- ============================================================

create or replace view user_scores as
  select
    user_id,
    coalesce(sum(points), 0)::int as total_score,
    count(*) filter (where points > 0) as total_events
  from user_score_events
  group by user_id;

-- ============================================================
-- 5. Trigger: award points and badges for research_responses
-- ============================================================

create or replace function trg_research_response_score()
returns trigger language plpgsql security definer as $$
declare
  feedback_count int;
begin
  if tg_op = 'INSERT' then
    insert into user_score_events (user_id, event_type, points, startup_id)
    values (new.user_id, 'research_feedback', 20, new.startup_id);

    select count(*) into feedback_count
      from research_responses where user_id = new.user_id;

    -- Badge: first feedback
    if feedback_count >= 1 then
      insert into user_badges (user_id, badge_key) values (new.user_id, 'spark_giver')
        on conflict do nothing;
    end if;
    -- Badge: 10 feedbacks
    if feedback_count >= 10 then
      insert into user_badges (user_id, badge_key) values (new.user_id, 'research_pro')
        on conflict do nothing;
    end if;
    -- Badge: 50 feedbacks
    if feedback_count >= 50 then
      insert into user_badges (user_id, badge_key) values (new.user_id, 'insight_machine')
        on conflict do nothing;
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_research_response_score on research_responses;
create trigger trg_research_response_score
  after insert on research_responses
  for each row execute function trg_research_response_score();

-- ============================================================
-- 6. Trigger: award/remove points for startup_votes
-- ============================================================

create or replace function trg_vote_score()
returns trigger language plpgsql security definer as $$
declare
  vote_count int;
begin
  if tg_op = 'INSERT' then
    insert into user_score_events (user_id, event_type, points, startup_id)
    values (new.user_id, 'vote', 5, new.startup_id);

    select count(*) into vote_count
      from startup_votes where user_id = new.user_id;

    if vote_count >= 10 then
      insert into user_badges (user_id, badge_key) values (new.user_id, 'supporter')
        on conflict do nothing;
    end if;
    if vote_count >= 50 then
      insert into user_badges (user_id, badge_key) values (new.user_id, 'super_supporter')
        on conflict do nothing;
    end if;

  elsif tg_op = 'DELETE' then
    -- Remove the most recent vote score event for this user + startup
    delete from user_score_events
    where id = (
      select id from user_score_events
      where user_id = old.user_id
        and event_type = 'vote'
        and startup_id = old.startup_id
      order by created_at desc
      limit 1
    );
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_vote_score on startup_votes;
create trigger trg_vote_score
  after insert or delete on startup_votes
  for each row execute function trg_vote_score();

-- ============================================================
-- 7. Trigger: award/remove points for startup_saves
-- ============================================================

create or replace function trg_save_score()
returns trigger language plpgsql security definer as $$
declare
  save_count int;
begin
  if tg_op = 'INSERT' then
    insert into user_score_events (user_id, event_type, points, startup_id)
    values (new.user_id, 'save', 2, new.startup_id);

    select count(*) into save_count
      from startup_saves where user_id = new.user_id;

    if save_count >= 10 then
      insert into user_badges (user_id, badge_key) values (new.user_id, 'trendsetter')
        on conflict do nothing;
    end if;

  elsif tg_op = 'DELETE' then
    delete from user_score_events
    where id = (
      select id from user_score_events
      where user_id = old.user_id
        and event_type = 'save'
        and startup_id = old.startup_id
      order by created_at desc
      limit 1
    );
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_save_score on startup_saves;
create trigger trg_save_score
  after insert or delete on startup_saves
  for each row execute function trg_save_score();

-- ============================================================
-- 8. Trigger: award/remove points for startup_comments
-- ============================================================

create or replace function trg_comment_score()
returns trigger language plpgsql security definer as $$
declare
  comment_count int;
begin
  if tg_op = 'INSERT' then
    insert into user_score_events (user_id, event_type, points, startup_id)
    values (new.user_id, 'comment', 3, new.startup_id);

    select count(*) into comment_count
      from startup_comments where user_id = new.user_id and status = 'published';

    if comment_count >= 10 then
      insert into user_badges (user_id, badge_key) values (new.user_id, 'commentator')
        on conflict do nothing;
    end if;

  elsif tg_op = 'DELETE' then
    delete from user_score_events
    where id = (
      select id from user_score_events
      where user_id = old.user_id
        and event_type = 'comment'
        and startup_id = old.startup_id
      order by created_at desc
      limit 1
    );
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_comment_score on startup_comments;
create trigger trg_comment_score
  after insert or delete on startup_comments
  for each row execute function trg_comment_score();

-- ============================================================
-- 9. Award signup bonus to all existing users (one-time backfill)
--    and ensure every user has the 'user' role
-- ============================================================

-- Give every existing profile a signup bonus if they don't have one yet
insert into user_score_events (user_id, event_type, points)
select id, 'signup_bonus', 10
from profiles
where id not in (
  select user_id from user_score_events where event_type = 'signup_bonus'
);

-- Backfill score events for existing research responses
insert into user_score_events (user_id, event_type, points, startup_id, created_at)
select user_id, 'research_feedback', 20, startup_id, created_at
from research_responses
where user_id not in (
  select distinct user_id from user_score_events where event_type = 'research_feedback'
)
on conflict do nothing;

-- Backfill score events for existing votes
insert into user_score_events (user_id, event_type, points, startup_id, created_at)
select user_id, 'vote', 5, startup_id, created_at
from startup_votes
where user_id not in (
  select distinct user_id from user_score_events where event_type = 'vote'
)
on conflict do nothing;

-- Backfill score events for existing saves
insert into user_score_events (user_id, event_type, points, startup_id, created_at)
select user_id, 'save', 2, startup_id, created_at
from startup_saves
where user_id not in (
  select distinct user_id from user_score_events where event_type = 'save'
)
on conflict do nothing;

-- Award spark_giver badge to anyone who has given feedback
insert into user_badges (user_id, badge_key)
select distinct user_id, 'spark_giver'
from research_responses
on conflict do nothing;

-- Award research_pro badge to anyone with 10+ feedbacks
insert into user_badges (user_id, badge_key)
select user_id, 'research_pro'
from (
  select user_id, count(*) as cnt from research_responses group by user_id
) x where cnt >= 10
on conflict do nothing;

-- Award supporter badge to anyone with 10+ votes
insert into user_badges (user_id, badge_key)
select user_id, 'supporter'
from (
  select user_id, count(*) as cnt from startup_votes group by user_id
) x where cnt >= 10
on conflict do nothing;

-- Award early_adopter badge to all current users (they're the first!)
insert into user_badges (user_id, badge_key)
select id, 'early_adopter' from profiles
on conflict do nothing;

-- Ensure every existing user has the 'user' role (multi-role support)
insert into user_roles (user_id, role)
select id, 'user' from profiles
on conflict (user_id, role) do nothing;

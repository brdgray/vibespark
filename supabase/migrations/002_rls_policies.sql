-- ============================================================
-- VibeSpark — Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table user_roles enable row level security;
alter table research_demographics enable row level security;
alter table startup_categories enable row level security;
alter table startup_stages enable row level security;
alter table startups enable row level security;
alter table startup_social_links enable row level security;
alter table startup_team_members enable row level security;
alter table startup_claim_requests enable row level security;
alter table startup_updates enable row level security;
alter table startup_votes enable row level security;
alter table startup_saves enable row level security;
alter table startup_comments enable row level security;
alter table startup_ratings enable row level security;
alter table research_requests enable row level security;
alter table research_responses enable row level security;
alter table promotions enable row level security;
alter table reports enable row level security;

-- Helper: check admin role
create or replace function is_admin(uid uuid)
returns boolean as $$
  select exists (
    select 1 from user_roles
    where user_id = uid and role = 'admin'
  );
$$ language sql security definer stable;

-- Helper: check startup owner
create or replace function is_startup_owner(uid uuid, sid uuid)
returns boolean as $$
  select exists (
    select 1 from startups
    where id = sid and created_by = uid
  );
$$ language sql security definer stable;

-- ============================================================
-- profiles
-- ============================================================
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

create policy "profiles_select_public" on profiles
  for select using (true);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

-- ============================================================
-- user_roles
-- ============================================================
create policy "user_roles_select_own" on user_roles
  for select using (auth.uid() = user_id or is_admin(auth.uid()));

create policy "user_roles_insert_admin" on user_roles
  for insert with check (is_admin(auth.uid()) or auth.uid() = user_id);

-- ============================================================
-- research_demographics
-- ============================================================
create policy "rd_select_own_or_admin" on research_demographics
  for select using (auth.uid() = user_id or is_admin(auth.uid()));

create policy "rd_insert_own" on research_demographics
  for insert with check (auth.uid() = user_id);

create policy "rd_update_own" on research_demographics
  for update using (auth.uid() = user_id);

-- ============================================================
-- startup_categories (public read, admin write)
-- ============================================================
create policy "categories_select_all" on startup_categories
  for select using (true);

create policy "categories_write_admin" on startup_categories
  for all using (is_admin(auth.uid()));

-- ============================================================
-- startup_stages (public read, admin write)
-- ============================================================
create policy "stages_select_all" on startup_stages
  for select using (true);

create policy "stages_write_admin" on startup_stages
  for all using (is_admin(auth.uid()));

-- ============================================================
-- startups
-- ============================================================
create policy "startups_select_verified" on startups
  for select using (
    verification_status = 'verified'
    or auth.uid() = created_by
    or is_admin(auth.uid())
  );

create policy "startups_insert_auth" on startups
  for insert with check (auth.uid() = created_by);

create policy "startups_update_owner_or_admin" on startups
  for update using (auth.uid() = created_by or is_admin(auth.uid()));

create policy "startups_delete_admin" on startups
  for delete using (is_admin(auth.uid()));

-- ============================================================
-- startup_social_links, startup_team_members
-- ============================================================
create policy "social_links_select" on startup_social_links
  for select using (true);

create policy "social_links_write_owner_admin" on startup_social_links
  for all using (
    is_admin(auth.uid()) or
    is_startup_owner(auth.uid(), startup_id)
  );

create policy "team_members_select" on startup_team_members
  for select using (is_public = true or is_admin(auth.uid()) or is_startup_owner(auth.uid(), startup_id));

create policy "team_members_write_owner_admin" on startup_team_members
  for all using (
    is_admin(auth.uid()) or
    is_startup_owner(auth.uid(), startup_id)
  );

-- ============================================================
-- startup_claim_requests
-- ============================================================
create policy "claims_select_own_or_admin" on startup_claim_requests
  for select using (auth.uid() = user_id or is_admin(auth.uid()));

create policy "claims_insert_auth" on startup_claim_requests
  for insert with check (auth.uid() = user_id);

create policy "claims_update_admin" on startup_claim_requests
  for update using (is_admin(auth.uid()));

-- ============================================================
-- startup_updates
-- ============================================================
create policy "updates_select" on startup_updates
  for select using (true);

create policy "updates_write_owner_admin" on startup_updates
  for all using (
    is_admin(auth.uid()) or
    is_startup_owner(auth.uid(), startup_id)
  );

-- ============================================================
-- startup_votes
-- ============================================================
create policy "votes_select" on startup_votes
  for select using (true);

create policy "votes_insert_own" on startup_votes
  for insert with check (auth.uid() = user_id);

create policy "votes_delete_own" on startup_votes
  for delete using (auth.uid() = user_id);

-- ============================================================
-- startup_saves
-- ============================================================
create policy "saves_select_own" on startup_saves
  for select using (auth.uid() = user_id);

create policy "saves_insert_own" on startup_saves
  for insert with check (auth.uid() = user_id);

create policy "saves_delete_own" on startup_saves
  for delete using (auth.uid() = user_id);

-- ============================================================
-- startup_comments
-- ============================================================
create policy "comments_select_published" on startup_comments
  for select using (status = 'published' or auth.uid() = user_id or is_admin(auth.uid()));

create policy "comments_insert_auth" on startup_comments
  for insert with check (auth.uid() = user_id);

create policy "comments_update_own_or_admin" on startup_comments
  for update using (auth.uid() = user_id or is_admin(auth.uid()));

create policy "comments_delete_admin" on startup_comments
  for delete using (is_admin(auth.uid()));

-- ============================================================
-- startup_ratings
-- ============================================================
create policy "ratings_select" on startup_ratings
  for select using (true);

create policy "ratings_insert_own" on startup_ratings
  for insert with check (auth.uid() = user_id);

create policy "ratings_update_own" on startup_ratings
  for update using (auth.uid() = user_id);

-- ============================================================
-- research_requests
-- ============================================================
create policy "rr_select_active" on research_requests
  for select using (is_active = true or is_admin(auth.uid()) or is_startup_owner(auth.uid(), startup_id));

create policy "rr_write_owner_admin" on research_requests
  for all using (
    is_admin(auth.uid()) or
    is_startup_owner(auth.uid(), startup_id)
  );

-- ============================================================
-- research_responses
-- ============================================================
create policy "resp_select_own_or_admin" on research_responses
  for select using (auth.uid() = user_id or is_admin(auth.uid()) or is_startup_owner(auth.uid(), startup_id));

create policy "resp_insert_own" on research_responses
  for insert with check (auth.uid() = user_id);

-- ============================================================
-- promotions
-- ============================================================
create policy "promo_select" on promotions
  for select using (status = 'active' or is_admin(auth.uid()) or is_startup_owner(auth.uid(), startup_id));

create policy "promo_write_admin" on promotions
  for all using (is_admin(auth.uid()));

create policy "promo_insert_owner" on promotions
  for insert with check (auth.uid() = created_by);

-- ============================================================
-- reports
-- ============================================================
create policy "reports_insert_auth" on reports
  for insert with check (auth.uid() = reported_by);

create policy "reports_select_admin" on reports
  for select using (is_admin(auth.uid()));

create policy "reports_update_admin" on reports
  for update using (is_admin(auth.uid()));

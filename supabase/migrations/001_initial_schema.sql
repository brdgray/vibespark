-- ============================================================
-- VibeSpark — Initial Schema Migration
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. profiles
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  is_research_participant boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 2. user_roles
-- ============================================================
create table if not exists user_roles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('user', 'startup_owner', 'admin')),
  created_at timestamptz not null default now(),
  unique(user_id, role)
);

-- ============================================================
-- 3. research_demographics
-- ============================================================
create table if not exists research_demographics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique not null references profiles(id) on delete cascade,
  age_range text not null,
  gender text,
  country text not null,
  profession text not null,
  industry text not null,
  persona_type text not null,
  technical_level text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 4. startup_categories
-- ============================================================
create table if not exists startup_categories (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  slug text unique not null
);

-- ============================================================
-- 5. startup_stages
-- ============================================================
create table if not exists startup_stages (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  slug text unique not null,
  sort_order int not null
);

-- ============================================================
-- 6. startups
-- ============================================================
create table if not exists startups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  tagline text not null,
  description text not null,
  website_url text not null,
  logo_path text,
  category_id uuid references startup_categories(id) on delete set null,
  stage_id uuid references startup_stages(id) on delete set null,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected', 'suspended')),
  founded_at date,
  location text,
  team_size int,
  pricing_model text,
  ai_stack text[],
  target_audience text,
  is_promoted boolean not null default false,
  is_featured boolean not null default false,
  created_by uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_startups_slug on startups(slug);
create index if not exists idx_startups_verification_status on startups(verification_status);
create index if not exists idx_startups_category_id on startups(category_id);
create index if not exists idx_startups_stage_id on startups(stage_id);
create index if not exists idx_startups_is_featured on startups(is_featured);
create index if not exists idx_startups_is_promoted on startups(is_promoted);

-- ============================================================
-- 7. startup_social_links
-- ============================================================
create table if not exists startup_social_links (
  id uuid primary key default uuid_generate_v4(),
  startup_id uuid not null references startups(id) on delete cascade,
  platform text not null,
  url text not null
);

-- ============================================================
-- 8. startup_team_members
-- ============================================================
create table if not exists startup_team_members (
  id uuid primary key default uuid_generate_v4(),
  startup_id uuid not null references startups(id) on delete cascade,
  name text not null,
  title text,
  linkedin_url text,
  is_public boolean not null default true
);

-- ============================================================
-- 9. startup_claim_requests
-- ============================================================
create table if not exists startup_claim_requests (
  id uuid primary key default uuid_generate_v4(),
  startup_id uuid not null references startups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references profiles(id)
);

-- ============================================================
-- 10. startup_updates
-- ============================================================
create table if not exists startup_updates (
  id uuid primary key default uuid_generate_v4(),
  startup_id uuid not null references startups(id) on delete cascade,
  title text not null,
  body text not null,
  created_by uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 11. startup_votes
-- ============================================================
create table if not exists startup_votes (
  id uuid primary key default uuid_generate_v4(),
  startup_id uuid not null references startups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  vote_type text not null default 'support' check (vote_type in ('support')),
  created_at timestamptz not null default now(),
  unique(startup_id, user_id, vote_type)
);

create index if not exists idx_startup_votes_startup_id on startup_votes(startup_id);
create index if not exists idx_startup_votes_user_id on startup_votes(user_id);

-- ============================================================
-- 12. startup_saves
-- ============================================================
create table if not exists startup_saves (
  id uuid primary key default uuid_generate_v4(),
  startup_id uuid not null references startups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(startup_id, user_id)
);

create index if not exists idx_startup_saves_startup_id on startup_saves(startup_id);

-- ============================================================
-- 13. startup_comments
-- ============================================================
create table if not exists startup_comments (
  id uuid primary key default uuid_generate_v4(),
  startup_id uuid not null references startups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  parent_comment_id uuid references startup_comments(id) on delete cascade,
  body text not null,
  status text not null default 'published' check (status in ('published', 'flagged', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_startup_comments_startup_id on startup_comments(startup_id);

-- ============================================================
-- 14. startup_ratings
-- ============================================================
create table if not exists startup_ratings (
  id uuid primary key default uuid_generate_v4(),
  startup_id uuid not null references startups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  unique(startup_id, user_id)
);

-- ============================================================
-- 15. research_requests
-- ============================================================
create table if not exists research_requests (
  id uuid primary key default uuid_generate_v4(),
  startup_id uuid not null references startups(id) on delete cascade,
  title text not null,
  prompt text,
  is_active boolean not null default true,
  created_by uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  ends_at timestamptz
);

-- ============================================================
-- 16. research_responses
-- ============================================================
create table if not exists research_responses (
  id uuid primary key default uuid_generate_v4(),
  research_request_id uuid not null references research_requests(id) on delete cascade,
  startup_id uuid not null references startups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  would_use text not null check (would_use in ('yes', 'maybe', 'no')),
  clarity_score int not null check (clarity_score between 1 and 5),
  problem_understanding text,
  missing_features text,
  friction_points text,
  target_user_guess text,
  created_at timestamptz not null default now(),
  unique(research_request_id, user_id)
);

create index if not exists idx_research_responses_startup_id on research_responses(startup_id);
create index if not exists idx_research_responses_request_id on research_responses(research_request_id);

-- ============================================================
-- 17. promotions
-- ============================================================
create table if not exists promotions (
  id uuid primary key default uuid_generate_v4(),
  startup_id uuid not null references startups(id) on delete cascade,
  promotion_type text not null check (promotion_type in ('featured', 'boosted', 'category_sponsor')),
  status text not null default 'pending' check (status in ('pending', 'active', 'expired', 'cancelled')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_by uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists idx_promotions_starts_at on promotions(starts_at);
create index if not exists idx_promotions_ends_at on promotions(ends_at);

-- ============================================================
-- 18. reports
-- ============================================================
create table if not exists reports (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null check (entity_type in ('startup', 'comment', 'user')),
  entity_id uuid not null,
  reported_by uuid not null references profiles(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- Trigger: auto-update updated_at
-- ============================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at_column();

create trigger trg_startups_updated_at
  before update on startups
  for each row execute function update_updated_at_column();

create trigger trg_startup_comments_updated_at
  before update on startup_comments
  for each row execute function update_updated_at_column();

create trigger trg_research_demographics_updated_at
  before update on research_demographics
  for each row execute function update_updated_at_column();

-- ============================================================
-- Trigger: auto-create profile on new user
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

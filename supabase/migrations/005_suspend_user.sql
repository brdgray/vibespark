-- ============================================================
-- VibeSpark — User suspension + feedback admin notes
-- ============================================================

-- 1. Add is_suspended to profiles
alter table profiles
  add column if not exists is_suspended boolean not null default false;

-- 2. Add admin_note to research_responses (for feedback quality review)
alter table research_responses
  add column if not exists admin_note text;

-- 3. Add flagged_by_admin boolean for quick filtering
alter table research_responses
  add column if not exists is_flagged boolean not null default false;

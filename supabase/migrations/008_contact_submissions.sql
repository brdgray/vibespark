-- ============================================================
-- 008_contact_submissions.sql
-- Public contact form submissions routed to admin inbox
-- ============================================================

create table if not exists contact_submissions (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  company text,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved', 'spam')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references profiles(id) on delete set null
);

create index if not exists idx_contact_submissions_status on contact_submissions(status);
create index if not exists idx_contact_submissions_created_at on contact_submissions(created_at desc);

alter table contact_submissions enable row level security;

-- Anyone can submit contact requests (for public contact page)
drop policy if exists "contact_insert_public" on contact_submissions;
create policy "contact_insert_public" on contact_submissions
  for insert with check (true);

-- Only admins can read/manage submissions
drop policy if exists "contact_select_admin" on contact_submissions;
create policy "contact_select_admin" on contact_submissions
  for select using (is_admin(auth.uid()));

drop policy if exists "contact_update_admin" on contact_submissions;
create policy "contact_update_admin" on contact_submissions
  for update using (is_admin(auth.uid()));

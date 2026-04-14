-- ============================================================
-- VibeSpark — Supabase Storage Buckets & RLS Policies
-- Run this in the Supabase SQL editor after enabling Storage
-- ============================================================

-- ============================================================
-- 1. Create buckets
-- ============================================================

-- Public bucket for startup logos (readable by anyone)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'startup-logos',
  'startup-logos',
  true,
  2097152,  -- 2 MB
  array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml']
)
on conflict (id) do nothing;

-- Public bucket for startup product screenshots
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'startup-screenshots',
  'startup-screenshots',
  true,
  5242880,  -- 5 MB
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do nothing;

-- Public bucket for user avatars
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-avatars',
  'user-avatars',
  true,
  1048576,  -- 1 MB
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do nothing;

-- ============================================================
-- 2. Storage RLS policies — startup-logos
-- ============================================================

-- Anyone can read logos
create policy "logos_public_read"
  on storage.objects for select
  using (bucket_id = 'startup-logos');

-- Authenticated users can upload logos (startup owner or admin)
create policy "logos_auth_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'startup-logos'
    and auth.role() = 'authenticated'
  );

-- Owners and admins can delete their logos
create policy "logos_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'startup-logos'
    and auth.uid() = owner::uuid
  );

-- ============================================================
-- 3. Storage RLS policies — startup-screenshots
-- ============================================================

create policy "screenshots_public_read"
  on storage.objects for select
  using (bucket_id = 'startup-screenshots');

create policy "screenshots_auth_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'startup-screenshots'
    and auth.role() = 'authenticated'
  );

create policy "screenshots_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'startup-screenshots'
    and auth.uid() = owner::uuid
  );

-- ============================================================
-- 4. Storage RLS policies — user-avatars
-- ============================================================

create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'user-avatars');

-- Users can only upload to their own folder (uid/filename)
create policy "avatars_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'user-avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'user-avatars'
    and auth.uid() = owner::uuid
  );

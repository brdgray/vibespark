-- Add inactive startup status so admins can temporarily hide startups from the live site.

alter table public.startups
  drop constraint if exists startups_verification_status_check;

alter table public.startups
  add constraint startups_verification_status_check
  check (verification_status in ('pending', 'verified', 'rejected', 'suspended', 'inactive'));

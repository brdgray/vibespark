-- Prevent founders from inserting research feedback on their own startups (RLS was only user_id = auth.uid()).

drop policy if exists "resp_insert_own" on public.research_responses;

create policy "resp_insert_own" on public.research_responses
  for insert with check (
    auth.uid() = user_id
    and not public.is_startup_owner(auth.uid(), startup_id)
  );

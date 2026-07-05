
drop policy if exists "Any authenticated can insert notification" on public.notifications;
create policy "User or admin inserts notification" on public.notifications
  for insert to authenticated
  with check (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

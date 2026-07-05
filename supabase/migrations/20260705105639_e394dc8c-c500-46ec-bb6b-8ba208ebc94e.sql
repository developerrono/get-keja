
-- Revoke public execute on internal trigger functions
revoke execute on function public.recalc_property_rating() from public, anon, authenticated;
revoke execute on function public.on_verification_approved() from public, anon, authenticated;

-- Tighten "with check (true)" policies
drop policy if exists "Participants update own message" on public.messages;
create policy "Sender updates own message" on public.messages
  for update to authenticated
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

drop policy if exists "Tenant or landlord updates visit" on public.visits;
create policy "Tenant or landlord updates visit" on public.visits
  for update to authenticated
  using (
    tenant_id = auth.uid()
    or exists (select 1 from public.properties p where p.id = property_id and p.landlord_id = auth.uid())
    or public.has_role(auth.uid(),'admin')
  )
  with check (
    tenant_id = auth.uid()
    or exists (select 1 from public.properties p where p.id = property_id and p.landlord_id = auth.uid())
    or public.has_role(auth.uid(),'admin')
  );

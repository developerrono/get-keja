
-- =========================================================
-- Extend roles & profiles
-- =========================================================
alter type public.app_role add value if not exists 'verified_landlord';

alter table public.profiles
  add column if not exists phone text,
  add column if not exists is_verified boolean not null default false,
  add column if not exists national_id text,
  add column if not exists business_name text,
  add column if not exists bio text,
  add column if not exists status text not null default 'active' check (status in ('active','suspended','deleted'));

-- =========================================================
-- PROPERTIES
-- =========================================================
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  cover_image text,
  images text[] not null default '{}',
  county text not null,
  estate text,
  address text,
  latitude double precision,
  longitude double precision,
  house_type text not null check (house_type in ('Bedsitter','Studio','1 Bedroom','2 Bedroom','3 Bedroom','4 Bedroom','Maisonette','Bungalow')),
  monthly_rent numeric(12,2) not null,
  bedrooms int not null default 1,
  bathrooms int not null default 1,
  area_sqm numeric(8,2),
  amenities text[] not null default '{}',
  house_rules text[] not null default '{}',
  nearby jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('draft','pending','active','hidden','rejected')),
  featured boolean not null default false,
  views_count int not null default 0,
  average_rating numeric(3,2) not null default 0,
  reviews_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.properties to anon;
grant select, insert, update, delete on public.properties to authenticated;
grant all on public.properties to service_role;
alter table public.properties enable row level security;

create policy "Public can view active properties" on public.properties
  for select to anon using (status = 'active');
create policy "Authenticated can view active or own properties" on public.properties
  for select to authenticated using (
    status = 'active' or landlord_id = auth.uid() or public.has_role(auth.uid(),'admin')
  );
create policy "Landlord can insert own property" on public.properties
  for insert to authenticated with check (landlord_id = auth.uid());
create policy "Landlord or admin can update property" on public.properties
  for update to authenticated using (landlord_id = auth.uid() or public.has_role(auth.uid(),'admin'))
  with check (landlord_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "Landlord or admin can delete property" on public.properties
  for delete to authenticated using (landlord_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create trigger properties_updated_at before update on public.properties
  for each row execute function public.touch_updated_at();

create index if not exists properties_landlord_idx on public.properties(landlord_id);
create index if not exists properties_status_idx on public.properties(status);
create index if not exists properties_county_idx on public.properties(county);

-- =========================================================
-- PROPERTY UNITS
-- =========================================================
create table if not exists public.property_units (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  label text not null,
  is_vacant boolean not null default true,
  monthly_rent numeric(12,2),
  bedrooms int,
  bathrooms int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.property_units to anon;
grant select, insert, update, delete on public.property_units to authenticated;
grant all on public.property_units to service_role;
alter table public.property_units enable row level security;

create policy "Public can view units of active properties" on public.property_units
  for select to anon using (
    exists (select 1 from public.properties p where p.id = property_id and p.status = 'active')
  );
create policy "Authenticated can view units" on public.property_units
  for select to authenticated using (
    exists (select 1 from public.properties p where p.id = property_id
      and (p.status = 'active' or p.landlord_id = auth.uid() or public.has_role(auth.uid(),'admin'))
    )
  );
create policy "Landlord or admin manages units" on public.property_units
  for all to authenticated using (
    exists (select 1 from public.properties p where p.id = property_id
      and (p.landlord_id = auth.uid() or public.has_role(auth.uid(),'admin')))
  ) with check (
    exists (select 1 from public.properties p where p.id = property_id
      and (p.landlord_id = auth.uid() or public.has_role(auth.uid(),'admin')))
  );

create trigger property_units_updated_at before update on public.property_units
  for each row execute function public.touch_updated_at();

-- =========================================================
-- TENANT PREFERENCES
-- =========================================================
create table if not exists public.tenant_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  counties text[] not null default '{}',
  estates text[] not null default '{}',
  min_budget numeric(12,2),
  max_budget numeric(12,2),
  house_types text[] not null default '{}',
  move_in_date date,
  needs_parking boolean not null default false,
  has_pets boolean not null default false,
  furnished_preference text check (furnished_preference in ('any','furnished','unfurnished')) default 'any',
  onboarding_completed boolean not null default false,
  onboarding_dismissed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.tenant_preferences to authenticated;
grant all on public.tenant_preferences to service_role;
alter table public.tenant_preferences enable row level security;
create policy "Tenant manages own preferences" on public.tenant_preferences
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger tenant_preferences_updated_at before update on public.tenant_preferences
  for each row execute function public.touch_updated_at();

-- =========================================================
-- FAVORITE COLLECTIONS + FAVORITES
-- =========================================================
create table if not exists public.favorite_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.favorite_collections to authenticated;
grant all on public.favorite_collections to service_role;
alter table public.favorite_collections enable row level security;
create policy "Owner manages own collections" on public.favorite_collections
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  collection_id uuid references public.favorite_collections(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, property_id)
);
grant select, insert, update, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;
alter table public.favorites enable row level security;
create policy "Owner manages own favorites" on public.favorites
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================================================
-- VISITS
-- =========================================================
create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  unit_id uuid references public.property_units(id) on delete set null,
  scheduled_at timestamptz not null,
  notes text,
  status text not null default 'pending' check (status in ('pending','approved','declined','cancelled','rescheduled','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.visits to authenticated;
grant all on public.visits to service_role;
alter table public.visits enable row level security;

create policy "Participant or admin can view visit" on public.visits
  for select to authenticated using (
    tenant_id = auth.uid()
    or exists (select 1 from public.properties p where p.id = property_id and p.landlord_id = auth.uid())
    or public.has_role(auth.uid(),'admin')
  );
create policy "Tenant creates own visit" on public.visits
  for insert to authenticated with check (tenant_id = auth.uid());
create policy "Tenant or landlord updates visit" on public.visits
  for update to authenticated using (
    tenant_id = auth.uid()
    or exists (select 1 from public.properties p where p.id = property_id and p.landlord_id = auth.uid())
    or public.has_role(auth.uid(),'admin')
  ) with check (true);
create policy "Tenant or landlord deletes visit" on public.visits
  for delete to authenticated using (
    tenant_id = auth.uid()
    or exists (select 1 from public.properties p where p.id = property_id and p.landlord_id = auth.uid())
    or public.has_role(auth.uid(),'admin')
  );

create trigger visits_updated_at before update on public.visits
  for each row execute function public.touch_updated_at();

-- =========================================================
-- CONVERSATIONS + MESSAGES
-- =========================================================
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references auth.users(id) on delete cascade,
  landlord_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (tenant_id, landlord_id, property_id)
);
grant select, insert, update, delete on public.conversations to authenticated;
grant all on public.conversations to service_role;
alter table public.conversations enable row level security;
create policy "Participants view conversations" on public.conversations
  for select to authenticated using (
    tenant_id = auth.uid() or landlord_id = auth.uid() or public.has_role(auth.uid(),'admin')
  );
create policy "Participant creates conversation" on public.conversations
  for insert to authenticated with check (tenant_id = auth.uid() or landlord_id = auth.uid());
create policy "Participant updates conversation" on public.conversations
  for update to authenticated using (tenant_id = auth.uid() or landlord_id = auth.uid())
  with check (tenant_id = auth.uid() or landlord_id = auth.uid());

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text,
  image_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
create policy "Participants view messages" on public.messages
  for select to authenticated using (
    exists (select 1 from public.conversations c where c.id = conversation_id
      and (c.tenant_id = auth.uid() or c.landlord_id = auth.uid() or public.has_role(auth.uid(),'admin')))
  );
create policy "Participants send messages" on public.messages
  for insert to authenticated with check (
    sender_id = auth.uid() and exists (
      select 1 from public.conversations c where c.id = conversation_id
        and (c.tenant_id = auth.uid() or c.landlord_id = auth.uid())
    )
  );
create policy "Participants update own message" on public.messages
  for update to authenticated using (
    exists (select 1 from public.conversations c where c.id = conversation_id
      and (c.tenant_id = auth.uid() or c.landlord_id = auth.uid()))
  ) with check (true);

create index if not exists messages_conversation_idx on public.messages(conversation_id, created_at desc);

-- =========================================================
-- REVIEWS
-- =========================================================
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  tenant_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text,
  photos text[] not null default '{}',
  status text not null default 'active' check (status in ('active','hidden','deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, tenant_id)
);
grant select on public.reviews to anon;
grant select, insert, update, delete on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "Public can view active reviews" on public.reviews
  for select to anon using (status = 'active');
create policy "Authenticated can view reviews" on public.reviews
  for select to authenticated using (
    status = 'active' or tenant_id = auth.uid() or public.has_role(auth.uid(),'admin')
  );
create policy "Tenant creates own review" on public.reviews
  for insert to authenticated with check (tenant_id = auth.uid());
create policy "Tenant or admin updates review" on public.reviews
  for update to authenticated using (tenant_id = auth.uid() or public.has_role(auth.uid(),'admin'))
  with check (tenant_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "Tenant or admin deletes review" on public.reviews
  for delete to authenticated using (tenant_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create trigger reviews_updated_at before update on public.reviews
  for each row execute function public.touch_updated_at();

-- =========================================================
-- REPORTS
-- =========================================================
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('property','user','review')),
  target_id uuid not null,
  category text not null check (category in ('fake_listing','scam','spam','incorrect_info','abuse','other')),
  description text,
  status text not null default 'open' check (status in ('open','investigating','dismissed','resolved')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.reports to authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;
create policy "Reporter or admin can view report" on public.reports
  for select to authenticated using (reporter_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "Any authenticated can report" on public.reports
  for insert to authenticated with check (reporter_id = auth.uid());
create policy "Admin updates report" on public.reports
  for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger reports_updated_at before update on public.reports
  for each row execute function public.touch_updated_at();

-- =========================================================
-- NOTIFICATIONS
-- =========================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "User views own notifications" on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy "User updates own notifications" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "User deletes own notifications" on public.notifications
  for delete to authenticated using (user_id = auth.uid());
create policy "Any authenticated can insert notification" on public.notifications
  for insert to authenticated with check (true);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);

-- =========================================================
-- LANDLORD VERIFICATIONS
-- =========================================================
create table if not exists public.landlord_verifications (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  national_id text not null,
  id_photo_url text,
  selfie_url text,
  business_name text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','info_requested')),
  admin_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.landlord_verifications to authenticated;
grant all on public.landlord_verifications to service_role;
alter table public.landlord_verifications enable row level security;
create policy "Landlord or admin views verification" on public.landlord_verifications
  for select to authenticated using (landlord_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "Landlord submits verification" on public.landlord_verifications
  for insert to authenticated with check (landlord_id = auth.uid());
create policy "Landlord updates pending verification, admin any" on public.landlord_verifications
  for update to authenticated using (
    (landlord_id = auth.uid() and status in ('pending','info_requested')) or public.has_role(auth.uid(),'admin')
  ) with check (
    (landlord_id = auth.uid() and status in ('pending','info_requested')) or public.has_role(auth.uid(),'admin')
  );
create trigger landlord_verifications_updated_at before update on public.landlord_verifications
  for each row execute function public.touch_updated_at();

-- =========================================================
-- ADMIN ANNOUNCEMENTS
-- =========================================================
create table if not exists public.admin_announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete set null,
  category text not null check (category in ('system','maintenance','emergency','update')),
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);
grant select on public.admin_announcements to anon;
grant select, insert, update, delete on public.admin_announcements to authenticated;
grant all on public.admin_announcements to service_role;
alter table public.admin_announcements enable row level security;
create policy "Anyone can view announcements" on public.admin_announcements
  for select using (true);
create policy "Admin manages announcements insert" on public.admin_announcements
  for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "Admin manages announcements update" on public.admin_announcements
  for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "Admin manages announcements delete" on public.admin_announcements
  for delete to authenticated using (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- AUDIT LOGS
-- =========================================================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "Admin views audit logs" on public.audit_logs
  for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "Admin writes audit logs" on public.audit_logs
  for insert to authenticated with check (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- Rating aggregation trigger
-- =========================================================
create or replace function public.recalc_property_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  pid uuid;
begin
  pid := coalesce(new.property_id, old.property_id);
  update public.properties p
    set average_rating = coalesce((select round(avg(rating)::numeric, 2) from public.reviews where property_id = pid and status = 'active'), 0),
        reviews_count  = (select count(*) from public.reviews where property_id = pid and status = 'active')
  where p.id = pid;
  return coalesce(new, old);
end;
$$;

drop trigger if exists reviews_recalc_rating on public.reviews;
create trigger reviews_recalc_rating
after insert or update or delete on public.reviews
for each row execute function public.recalc_property_rating();

-- =========================================================
-- Verification approval -> grant verified_landlord role
-- =========================================================
create or replace function public.on_verification_approved()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'approved' and (old.status is distinct from 'approved') then
    update public.profiles set is_verified = true where id = new.landlord_id;
    insert into public.user_roles (user_id, role)
      values (new.landlord_id, 'verified_landlord')
      on conflict do nothing;
    insert into public.notifications (user_id, type, title, body)
      values (new.landlord_id, 'verification_approved', 'Verification approved',
              'Your landlord account is now verified.');
  elsif new.status = 'rejected' and (old.status is distinct from 'rejected') then
    insert into public.notifications (user_id, type, title, body)
      values (new.landlord_id, 'verification_rejected', 'Verification rejected',
              coalesce(new.admin_notes, 'Please review your submission and try again.'));
  end if;
  return new;
end;
$$;

drop trigger if exists landlord_verifications_status on public.landlord_verifications;
create trigger landlord_verifications_status
after update on public.landlord_verifications
for each row execute function public.on_verification_approved();

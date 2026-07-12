-- HAVNORA core schema (applied 2026-07-12 to the shared "verith" project).
-- Note: profiles is namespaced havnora_profiles because the shared project
-- already had a profiles table. On a dedicated HAVNORA project, this file
-- can be run as-is; optionally rename havnora_profiles back to profiles.

create table public.havnora_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role text not null default 'buyer' check (role in ('buyer','seller','agent','manager','admin')),
  created_at timestamptz not null default now()
);
alter table public.havnora_profiles enable row level security;
create policy "havnora profiles self read" on public.havnora_profiles for select using (auth.uid() = id);
create policy "havnora profiles self update" on public.havnora_profiles for update using (auth.uid() = id);

create function public.handle_new_havnora_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.havnora_profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created_havnora after insert on auth.users
for each row execute function public.handle_new_havnora_user();

create table public.properties (
  id text primary key,
  title text not null,
  address text not null,
  city text not null,
  state text not null,
  zip text not null,
  neighborhood text,
  price integer not null check (price <= 800000),
  down_payment integer not null check (down_payment >= 30000),
  beds integer not null,
  baths numeric not null,
  sqft integer not null,
  lot numeric,
  type text not null,
  status text not null default 'For Sale',
  year_built integer,
  garage integer default 0,
  pool boolean default false,
  description text,
  features jsonb default '[]'::jsonb,
  images jsonb default '{}'::jsonb,
  walk_score integer,
  taxes integer,
  hoa integer default 0,
  featured boolean default false,
  created_at timestamptz not null default now()
);
alter table public.properties enable row level security;
create policy "properties public read" on public.properties for select using (true);

create table public.favorites (
  user_id uuid not null references public.havnora_profiles(id) on delete cascade,
  property_id text not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, property_id)
);
alter table public.favorites enable row level security;
create policy "favorites owner read" on public.favorites for select using (auth.uid() = user_id);
create policy "favorites owner insert" on public.favorites for insert with check (auth.uid() = user_id);
create policy "favorites owner delete" on public.favorites for delete using (auth.uid() = user_id);

create table public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.havnora_profiles(id) on delete cascade,
  name text not null,
  params jsonb not null default '{}'::jsonb,
  alerts boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.saved_searches enable row level security;
create policy "saved searches owner all" on public.saved_searches for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.havnora_profiles(id) on delete cascade,
  property_id text not null references public.properties(id) on delete cascade,
  viewing_date date not null,
  viewing_time text not null,
  status text not null default 'pending' check (status in ('pending','confirmed','completed','cancelled')),
  note text,
  created_at timestamptz not null default now()
);
alter table public.bookings enable row level security;
create policy "bookings owner read" on public.bookings for select using (auth.uid() = user_id);
create policy "bookings owner insert" on public.bookings for insert with check (auth.uid() = user_id);
create policy "bookings owner update" on public.bookings for update using (auth.uid() = user_id);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.havnora_profiles(id) on delete cascade,
  property_id text references public.properties(id) on delete set null,
  subject text,
  created_at timestamptz not null default now()
);
alter table public.conversations enable row level security;
create policy "conversations owner all" on public.conversations for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender text not null check (sender in ('user','manager')),
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
create policy "messages own conversation read" on public.messages for select
  using (exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid()));
create policy "messages own conversation insert" on public.messages for insert
  with check (
    sender = 'user'
    and exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid())
  );

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.havnora_profiles(id) on delete set null,
  property_id text references public.properties(id) on delete set null,
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);
alter table public.inquiries enable row level security;
create policy "inquiries anyone insert" on public.inquiries for insert with check (true);
create policy "inquiries owner read" on public.inquiries for select using (auth.uid() = user_id);

create index idx_properties_city on public.properties (city);
create index idx_properties_price on public.properties (price);
create index idx_bookings_user on public.bookings (user_id);
create index idx_messages_conversation on public.messages (conversation_id);

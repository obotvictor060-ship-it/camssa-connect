-- CAMSSA CONNECT initial database schema
-- Run in Supabase SQL Editor. Review and adapt before production.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  department text,
  matric_number text,
  whatsapp text,
  role text not null default 'student' check (role in ('student','editor','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  issuing_office text not null,
  category text default 'General',
  published boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.news_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  excerpt text,
  body text not null,
  image_url text,
  published boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  venue text,
  starts_at timestamptz,
  registration_url text,
  published boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  opportunity_type text not null default 'other',
  provider text,
  description text,
  deadline timestamptz,
  application_url text,
  published boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null,
  price numeric(12,2) not null check (price >= 0),
  description text not null,
  seller_name text not null,
  whatsapp text not null,
  image_url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('editor','admin')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Create a profile automatically for each new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.announcements enable row level security;
alter table public.news_posts enable row level security;
alter table public.events enable row level security;
alter table public.opportunities enable row level security;
alter table public.marketplace_listings enable row level security;

-- Profiles: users can read/update their own profile; staff can read all.
drop policy if exists "Profiles readable by owner or staff" on public.profiles;
create policy "Profiles readable by owner or staff" on public.profiles
for select using (auth.uid() = id or public.is_staff());

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id and role = (select role from public.profiles p where p.id = auth.uid()));

-- Public can read published content; staff can manage it.
do $$
declare t text;
begin
  foreach t in array array['announcements','news_posts','events','opportunities'] loop
    execute format('drop policy if exists "Public read published %1$s" on public.%1$I', t);
    execute format('create policy "Public read published %1$s" on public.%1$I for select using (published = true or public.is_staff())', t);
    execute format('drop policy if exists "Staff manage %1$s" on public.%1$I', t);
    execute format('create policy "Staff manage %1$s" on public.%1$I for all using (public.is_staff()) with check (public.is_staff())', t);
  end loop;
end $$;

-- Marketplace: public sees approved listings; sellers see their own; staff sees all.
drop policy if exists "Read approved or own listings" on public.marketplace_listings;
create policy "Read approved or own listings" on public.marketplace_listings
for select using (status = 'approved' or seller_id = auth.uid() or public.is_staff());

drop policy if exists "Authenticated users submit listings" on public.marketplace_listings;
create policy "Authenticated users submit listings" on public.marketplace_listings
for insert to authenticated
with check (seller_id = auth.uid() and status = 'pending');

drop policy if exists "Sellers update own pending listings" on public.marketplace_listings;
create policy "Sellers update own pending listings" on public.marketplace_listings
for update to authenticated
using (seller_id = auth.uid() and status in ('pending','rejected'))
with check (seller_id = auth.uid() and status in ('pending','rejected'));

drop policy if exists "Staff manage marketplace listings" on public.marketplace_listings;
create policy "Staff manage marketplace listings" on public.marketplace_listings
for all to authenticated
using (public.is_staff())
with check (public.is_staff());

-- Important: assign the first admin manually in Supabase SQL Editor after creating the account:
-- update public.profiles set role = 'admin' where id = 'AUTH_USER_UUID';
-- Do not expose a service-role key in the browser.

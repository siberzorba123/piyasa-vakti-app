-- Piyasa Vakti MVP database schema
-- Supabase SQL Editor içinde çalıştırılabilir.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  iban text,
  created_at timestamptz default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  nickname_in_group text,
  joined_at timestamptz default now(),
  unique(group_id, user_id)
);

create table if not exists public.availability (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week text not null check (day_of_week in ('mon','tue','wed','thu','fri','sat','sun')),
  start_time time not null,
  end_time time not null,
  created_at timestamptz default now()
);

create table if not exists public.activity_preferences (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_type text not null,
  preference_level int not null default 1 check (preference_level between 1 and 5),
  detail_mode text not null default 'any' check (detail_mode in ('any', 'specific')),
  detail_value text,
  unique(group_id, user_id, activity_type)
);

create table if not exists public.vehicle_status (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  has_car boolean not null default false,
  has_motorcycle boolean not null default false,
  note text,
  unique(group_id, user_id)
);

create table if not exists public.group_preferences (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  budget text,
  unique(group_id, user_id)
);

create table if not exists public.group_notes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  note text,
  unique(group_id, user_id)
);

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.availability enable row level security;
alter table public.activity_preferences enable row level security;
alter table public.vehicle_status enable row level security;
alter table public.group_preferences enable row level security;
alter table public.group_notes enable row level security;

-- MVP için basit RLS politikaları. Production'da daha sıkı hale getirilebilir.
create policy "profiles are readable by authenticated users" on public.profiles for select to authenticated using (true);
create policy "users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "users can insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);

create policy "groups readable by members" on public.groups for select to authenticated using (
  exists (select 1 from public.group_members gm where gm.group_id = id and gm.user_id = auth.uid())
);
create policy "authenticated users can create groups" on public.groups for insert to authenticated with check (auth.uid() = created_by);

create policy "memberships readable by group members" on public.group_members for select to authenticated using (
  exists (select 1 from public.group_members gm where gm.group_id = group_members.group_id and gm.user_id = auth.uid())
);
create policy "users can join as themselves" on public.group_members for insert to authenticated with check (auth.uid() = user_id);

create policy "availability readable by group members" on public.availability for select to authenticated using (
  exists (select 1 from public.group_members gm where gm.group_id = availability.group_id and gm.user_id = auth.uid())
);
create policy "users manage own availability" on public.availability for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "activity prefs readable by group members" on public.activity_preferences for select to authenticated using (
  exists (select 1 from public.group_members gm where gm.group_id = activity_preferences.group_id and gm.user_id = auth.uid())
);
create policy "users manage own activity prefs" on public.activity_preferences for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "vehicle readable by group members" on public.vehicle_status for select to authenticated using (
  exists (select 1 from public.group_members gm where gm.group_id = vehicle_status.group_id and gm.user_id = auth.uid())
);
create policy "users manage own vehicle" on public.vehicle_status for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "group prefs readable by group members" on public.group_preferences for select to authenticated using (
  exists (select 1 from public.group_members gm where gm.group_id = group_preferences.group_id and gm.user_id = auth.uid())
);
create policy "users manage own group prefs" on public.group_preferences for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notes readable by group members" on public.group_notes for select to authenticated using (
  exists (select 1 from public.group_members gm where gm.group_id = group_notes.group_id and gm.user_id = auth.uid())
);
create policy "users manage own note" on public.group_notes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- v4 yönetici yetkileri: grubu kuran/owner olan kullanıcı üyeleri gruptan çıkarabilir.
create policy "owners can remove members from own groups" on public.group_members
for delete to authenticated using (
  exists (
    select 1
    from public.group_members gm
    where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
      and gm.role = 'owner'
  )
);

-- Grup oluşturulduğunda uygulama tarafında group_members.role = 'owner' kaydı oluşturulmalıdır.
-- Demo sürümde ownerId alanı frontend mock verisinden okunur.

-- v6: Sinema/Konser/Gezi gibi aktivitelerde 'Fark etmez' veya 'İlle benim dediğim' tercihi
-- activity_preferences.detail_mode = 'any' ise fark etmez, 'specific' ise detail_value alanındaki film/sanatçı/yer dikkate alınır.

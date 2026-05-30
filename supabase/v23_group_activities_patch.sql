-- Piyasa Vakti v23 patch
-- Supabase SQL Editor içinde bir kere çalıştır.
-- Grup bazlı etkinlik listesi ekler.

create table if not exists public.group_activities (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.friend_groups(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0 and char_length(name) <= 80),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(group_id, name)
);

create index if not exists group_activities_group_name_idx
on public.group_activities(group_id, name);

alter table public.group_activities enable row level security;

drop policy if exists "group activities readable by group members" on public.group_activities;
create policy "group activities readable by group members"
on public.group_activities
for select to authenticated
using (public.is_group_member(group_id, auth.uid()));

drop policy if exists "group members can create activities" on public.group_activities;
create policy "group members can create activities"
on public.group_activities
for insert to authenticated
with check (public.is_group_member(group_id, auth.uid()) and created_by = auth.uid());

drop policy if exists "activity creators or owners can delete group activities" on public.group_activities;
create policy "activity creators or owners can delete group activities"
on public.group_activities
for delete to authenticated
using (created_by = auth.uid() or public.is_group_owner(group_id, auth.uid()));

grant select, insert, delete on public.group_activities to authenticated;

-- Mevcut kullanıcıların daha önce seçtiği aktiviteleri grup etkinlik listesine taşır.
insert into public.group_activities (group_id, name, created_by)
select distinct group_id, activity, user_id
from public.activity_preferences
where activity is not null and trim(activity) <> ''
on conflict (group_id, name) do nothing;

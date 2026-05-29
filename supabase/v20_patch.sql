-- Piyasa Vakti v20 patch
-- Supabase SQL Editor içinde bir kere çalıştır.
-- Grup silme yetkisi ve grup içi mesajlaşma tablosunu ekler.

create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.friend_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0 and char_length(body) <= 1000),
  created_at timestamptz not null default now()
);

create index if not exists group_messages_group_created_idx
on public.group_messages(group_id, created_at);

alter table public.group_messages enable row level security;

drop policy if exists "group messages readable by group members" on public.group_messages;
create policy "group messages readable by group members"
on public.group_messages
for select to authenticated
using (public.is_group_member(group_id, auth.uid()));

drop policy if exists "group members can send messages" on public.group_messages;
create policy "group members can send messages"
on public.group_messages
for insert to authenticated
with check (user_id = auth.uid() and public.is_group_member(group_id, auth.uid()));

drop policy if exists "message owners or group owners can delete messages" on public.group_messages;
create policy "message owners or group owners can delete messages"
on public.group_messages
for delete to authenticated
using (user_id = auth.uid() or public.is_group_owner(group_id, auth.uid()));

drop policy if exists "group owners can delete own groups" on public.friend_groups;
create policy "group owners can delete own groups"
on public.friend_groups
for delete to authenticated
using (owner_id = auth.uid() or public.is_group_owner(id, auth.uid()));

grant select, insert, delete on public.group_messages to authenticated;

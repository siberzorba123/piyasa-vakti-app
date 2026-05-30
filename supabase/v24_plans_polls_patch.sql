-- Piyasa Vakti v24: finalized plans, attendance responses, polls and announcements

create table if not exists public.group_announcements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null unique references public.friend_groups(id) on delete cascade,
  body text not null default '',
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.finalized_plans (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null unique references public.friend_groups(id) on delete cascade,
  day_label text not null,
  start_time text not null,
  end_time text not null,
  activity text not null,
  note text not null default '',
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.plan_responses (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.finalized_plans(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('joining', 'maybe', 'not_joining')),
  updated_at timestamptz not null default now(),
  unique(plan_id, user_id)
);

create table if not exists public.group_polls (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.friend_groups(id) on delete cascade,
  question text not null,
  created_by uuid references public.profiles(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.group_polls(id) on delete cascade,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.group_polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  updated_at timestamptz not null default now(),
  unique(poll_id, user_id)
);

alter table public.group_announcements enable row level security;
alter table public.finalized_plans enable row level security;
alter table public.plan_responses enable row level security;
alter table public.group_polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;

drop policy if exists "Members can read announcements" on public.group_announcements;
drop policy if exists "Owners can write announcements" on public.group_announcements;
create policy "Members can read announcements" on public.group_announcements for select using (public.is_group_member(group_id, auth.uid()));
create policy "Owners can write announcements" on public.group_announcements for all using (public.is_group_owner(group_id, auth.uid())) with check (public.is_group_owner(group_id, auth.uid()));

drop policy if exists "Members can read finalized plans" on public.finalized_plans;
drop policy if exists "Owners can write finalized plans" on public.finalized_plans;
create policy "Members can read finalized plans" on public.finalized_plans for select using (public.is_group_member(group_id, auth.uid()));
create policy "Owners can write finalized plans" on public.finalized_plans for all using (public.is_group_owner(group_id, auth.uid())) with check (public.is_group_owner(group_id, auth.uid()));

drop policy if exists "Members can read plan responses" on public.plan_responses;
drop policy if exists "Members can write own plan responses" on public.plan_responses;
create policy "Members can read plan responses" on public.plan_responses for select using (
  exists (
    select 1 from public.finalized_plans fp
    where fp.id = plan_responses.plan_id and public.is_group_member(fp.group_id, auth.uid())
  )
);
create policy "Members can write own plan responses" on public.plan_responses for all using (
  user_id = auth.uid() and exists (
    select 1 from public.finalized_plans fp
    where fp.id = plan_responses.plan_id and public.is_group_member(fp.group_id, auth.uid())
  )
) with check (
  user_id = auth.uid() and exists (
    select 1 from public.finalized_plans fp
    where fp.id = plan_responses.plan_id and public.is_group_member(fp.group_id, auth.uid())
  )
);

drop policy if exists "Members can read polls" on public.group_polls;
drop policy if exists "Owners can write polls" on public.group_polls;
create policy "Members can read polls" on public.group_polls for select using (public.is_group_member(group_id, auth.uid()));
create policy "Owners can write polls" on public.group_polls for all using (public.is_group_owner(group_id, auth.uid())) with check (public.is_group_owner(group_id, auth.uid()));

drop policy if exists "Members can read poll options" on public.poll_options;
drop policy if exists "Owners can write poll options" on public.poll_options;
create policy "Members can read poll options" on public.poll_options for select using (
  exists (select 1 from public.group_polls gp where gp.id = poll_options.poll_id and public.is_group_member(gp.group_id, auth.uid()))
);
create policy "Owners can write poll options" on public.poll_options for all using (
  exists (select 1 from public.group_polls gp where gp.id = poll_options.poll_id and public.is_group_owner(gp.group_id, auth.uid()))
) with check (
  exists (select 1 from public.group_polls gp where gp.id = poll_options.poll_id and public.is_group_owner(gp.group_id, auth.uid()))
);

drop policy if exists "Members can read poll votes" on public.poll_votes;
drop policy if exists "Members can write own poll votes" on public.poll_votes;
create policy "Members can read poll votes" on public.poll_votes for select using (
  exists (select 1 from public.group_polls gp where gp.id = poll_votes.poll_id and public.is_group_member(gp.group_id, auth.uid()))
);
create policy "Members can write own poll votes" on public.poll_votes for all using (
  user_id = auth.uid() and exists (select 1 from public.group_polls gp where gp.id = poll_votes.poll_id and public.is_group_member(gp.group_id, auth.uid()))
) with check (
  user_id = auth.uid() and exists (select 1 from public.group_polls gp where gp.id = poll_votes.poll_id and public.is_group_member(gp.group_id, auth.uid()))
);


grant select, insert, update, delete on public.group_announcements to authenticated;
grant select, insert, update, delete on public.finalized_plans to authenticated;
grant select, insert, update, delete on public.plan_responses to authenticated;
grant select, insert, update, delete on public.group_polls to authenticated;
grant select, insert, update, delete on public.poll_options to authenticated;
grant select, insert, update, delete on public.poll_votes to authenticated;

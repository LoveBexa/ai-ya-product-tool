-- ===================================================================
--  AIYA — bring an EXISTING Supabase DB up to date
--  Run once in Supabase → SQL editor if you see missing-column errors
--  (e.g. cards.acceptance_criteria, cards.card_type, product_design, …)
-- ===================================================================

-- projects
alter table projects add column if not exists stage text not null default 'discovery';
alter table projects add column if not exists chat jsonb not null default '[]'::jsonb;
alter table projects add column if not exists foundation_prompt text not null default '';
alter table projects add column if not exists database_schema text not null default '';
alter table projects add column if not exists product_design jsonb;
alter table projects add column if not exists subtitle text not null default '';
alter table projects add column if not exists emoji text not null default '';
alter table projects add column if not exists description text not null default '';
update projects set description = subtitle where description = '' and subtitle <> '';

-- features
alter table features add column if not exists sort_order int not null default 0;
alter table features add column if not exists verify text not null default '';

-- cards — allow orphan blueprint rows
alter table cards alter column feature_id drop not null;

alter table cards add column if not exists card_type text not null default 'feature';
alter table cards add column if not exists goal text not null default '';
alter table cards add column if not exists how_to_build text not null default '';
alter table cards add column if not exists how_to_test text not null default '';
alter table cards add column if not exists user_journey text not null default '';
alter table cards add column if not exists screens text[] not null default '{}';
alter table cards add column if not exists acceptance_criteria text[] not null default '{}';
alter table cards add column if not exists test_steps text[] not null default '{}';
alter table cards add column if not exists dependencies text[] not null default '{}';
alter table cards add column if not exists success_criteria text[] not null default '{}';
alter table cards add column if not exists deferred_stages text[] not null default '{}';
alter table cards add column if not exists sort_order int not null default 0;
alter table cards add column if not exists resource_query text not null default '';

-- Backfill goal from title where empty (legacy rows)
update cards set goal = title where goal = '' or goal is null;

-- ===================================================================
--  Auth: profiles + user-owned projects (005-auth-profiles.sql)
--  Enable Google + Magic Link in Supabase Dashboard → Authentication
-- ===================================================================

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null default '',
  name          text not null default '',
  avatar_url    text,
  emoji         text not null default '🙂',
  avatar_source text not null default 'emoji'
                check (avatar_source in ('google', 'emoji')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.projects add column if not exists user_id uuid references auth.users(id) on delete cascade;
create index if not exists idx_projects_user on public.projects(user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, avatar_url, emoji, avatar_source)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, ''), '@', 1),
      'User'
    ),
    nullif(new.raw_user_meta_data->>'avatar_url', ''),
    '🙂',
    case
      when nullif(new.raw_user_meta_data->>'avatar_url', '') is not null then 'google'
      else 'emoji'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_profiles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_profiles_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

alter table public.projects enable row level security;

drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own" on public.projects
  for select using (auth.uid() = user_id);

drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own" on public.projects
  for insert with check (auth.uid() = user_id);

drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own" on public.projects
  for update using (auth.uid() = user_id);

drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own" on public.projects
  for delete using (auth.uid() = user_id);

-- Optional: reload PostgREST schema cache (Supabase usually picks this up within seconds)
-- notify pgrst, 'reload schema';

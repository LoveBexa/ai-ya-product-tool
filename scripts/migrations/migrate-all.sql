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

-- Optional: reload PostgREST schema cache (Supabase usually picks this up within seconds)
-- notify pgrst, 'reload schema';

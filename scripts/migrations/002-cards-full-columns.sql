-- Adds all columns the blueprint pipeline expects on `cards`.
-- Prefer scripts/migrations/migrate-all.sql (runs projects + features + cards).

alter table cards add column if not exists acceptance_criteria text[] not null default '{}';
alter table cards add column if not exists test_steps text[] not null default '{}';
alter table cards add column if not exists dependencies text[] not null default '{}';
alter table cards add column if not exists screens text[] not null default '{}';
alter table cards add column if not exists how_to_build text not null default '';
alter table cards add column if not exists how_to_test text not null default '';
alter table cards add column if not exists user_journey text not null default '';
alter table cards add column if not exists success_criteria text[] not null default '{}';
alter table cards add column if not exists deferred_stages text[] not null default '{}';
alter table cards add column if not exists card_type text not null default 'feature';
alter table cards add column if not exists goal text not null default '';
alter table cards add column if not exists resource_query text not null default '';
alter table cards add column if not exists sort_order int not null default 0;

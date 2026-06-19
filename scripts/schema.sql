-- ===================================================================
--  AI Business Analyst — MVP data layer
--  projects -> requirements (1:1) , features (1:many) , cards (1:many)
--
--  This mirrors the schema described in your notes, with two helper
--  columns the UI relies on (marked NEW). If your existing tables don't
--  have them, run the ALTER TABLE statements at the bottom.
-- ===================================================================

create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  idea        text not null,
  stage       text not null default 'discovery'
              check (stage in ('discovery','requirements','mvp','tasks')), -- NEW
  chat        jsonb not null default '[]'::jsonb, -- NEW: persisted discovery transcript
  created_at  timestamptz not null default now()
);

create table if not exists requirements (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  audience              text not null default '',
  problem               text not null default '',
  solution              text not null default '',
  competitive_landscape text not null default '',
  differentiation       text not null default '',
  revenue_model         text not null default '',
  success_metric        text not null default '',
  created_at            timestamptz not null default now(),
  unique (project_id)
);

create table if not exists features (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  name        text not null,
  priority    text not null check (priority in ('must','nice','ignore')),
  reasoning   text not null default '',
  sort_order  int  not null default 0, -- NEW
  created_at  timestamptz not null default now()
);

create table if not exists cards (
  id              uuid primary key default gen_random_uuid(),
  feature_id      uuid not null references features(id) on delete cascade,
  project_id      uuid not null references projects(id) on delete cascade,
  title           text not null,
  goal            text not null default '',
  subtasks        text[] not null default '{}',
  ai_prompt       text not null default '',
  resource_query  text not null default '',
  status          text not null default 'todo'
                  check (status in ('todo','in_progress','done')),
  sort_order      int  not null default 0, -- NEW
  created_at      timestamptz not null default now()
);

create index if not exists idx_features_project on features(project_id);
create index if not exists idx_cards_project    on cards(project_id);
create index if not exists idx_cards_feature    on cards(feature_id);

-- ---- If you already created these tables, add the helper columns: ----
-- alter table projects add column if not exists stage text not null default 'discovery'
--   check (stage in ('discovery','requirements','mvp','tasks'));
-- alter table projects add column if not exists chat jsonb not null default '[]'::jsonb;
-- alter table features add column if not exists sort_order int not null default 0;
-- alter table cards    add column if not exists sort_order int not null default 0;

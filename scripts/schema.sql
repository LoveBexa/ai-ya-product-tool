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
  foundation_prompt text not null default '',
  database_schema text not null default '',
  product_design jsonb, -- UX flows + screens from Design stage
  created_at  timestamptz not null default now()
);

create table if not exists requirements (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  audience        text not null default '',
  problem         text not null default '',
  solution        text not null default '',
  revenue_model   text not null default '',
  success_metric  text not null default '',
  created_at      timestamptz not null default now(),
  unique (project_id)
);

create table if not exists features (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  name        text not null,
  priority    text not null check (priority in ('must','nice','ignore')),
  reasoning   text not null default '',
  sort_order  int  not null default 0, -- NEW
  verify      text not null default '',
  created_at  timestamptz not null default now()
);

create table if not exists cards (
  id                  uuid primary key default gen_random_uuid(),
  feature_id          uuid references features(id) on delete cascade,
  project_id          uuid not null references projects(id) on delete cascade,
  card_type           text not null default 'feature'
                      check (card_type in ('blueprint','feature')),
  title               text not null,
  goal                text not null default '',
  subtasks            text[] not null default '{}',
  ai_prompt           text not null default '',
  resource_query      text not null default '',
  how_to_build        text not null default '',
  how_to_test         text not null default '',
  screens             text[] not null default '{}',
  acceptance_criteria text[] not null default '{}',
  test_steps          text[] not null default '{}',
  dependencies        text[] not null default '{}',
  user_journey        text not null default '',
  success_criteria    text[] not null default '{}',
  deferred_stages     text[] not null default '{}',
  status              text not null default 'todo'
                      check (status in ('todo','in_progress','done')),
  sort_order          int  not null default 0,
  created_at          timestamptz not null default now()
);

create index if not exists idx_features_project on features(project_id);
create index if not exists idx_cards_project    on cards(project_id);
create index if not exists idx_cards_feature    on cards(feature_id);

-- ---- Existing DB? Run scripts/migrations/migrate-all.sql once ----

-- Rename concept: subtitle → description (full idea text)
alter table projects add column if not exists description text not null default '';
update projects set description = subtitle where description = '' and subtitle <> '';

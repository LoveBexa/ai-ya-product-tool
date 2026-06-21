-- Project profile fields for overview (title, description, emoji)
alter table projects add column if not exists subtitle text not null default '';
alter table projects add column if not exists emoji text not null default '';
alter table projects add column if not exists description text not null default '';
update projects set description = subtitle where description = '' and subtitle <> '';

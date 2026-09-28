-- Run this once in the Supabase SQL editor (project: yevtowkxjxixydyqkpdh).
-- Creates all tables the admin panel + public site need, with RLS so anyone can
-- read content but only logged-in (authenticated) users can write.

-- 1. Singleton profile row: intro + about + contact copy.
create table if not exists profile (
  id smallint primary key default 1,
  intro_name text default 'LUKMAN MULUDIN.',
  intro_role text default 'WEB DEVELOPER',
  intro_faction text default 'CHOPIN SYSTEMS',
  intro_race text default 'HUMAN',
  intro_photo_casual text default '/assets/1.webp',
  intro_photo_formal text default '/assets/4.webp',
  about_bio text default 'Saya Lukman Muludin (Chopin), seorang lulusan Sistem Informasi dan Web Developer yang aktif menerapkan AI-assisted development dalam alur kerja pembuatan perangkat lunak.',
  about_skills jsonb not null default '[]',
  about_meta jsonb not null default '[]',
  contact_email text default 'lukmanmauludin831@gmail.com',
  contact_github text default 'github.com/lukman754',
  contact_linkedin text default 'linkedin.com/in/lukman-muludin',
  updated_at timestamptz not null default now(),
  constraint profile_singleton check (id = 1)
);

-- 2. Skills & tools groups (e.g. "LANGUAGES" -> ["PHP","JavaScript",...]).
create table if not exists skill_groups (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  items jsonb not null default '[]',
  sort_order int not null default 0
);

-- 3. Capability progress bars.
create table if not exists progress_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  value smallint not null default 0,
  sort_order int not null default 0
);

-- 4. Certificates carousel.
create table if not exists certificates (
  id uuid primary key default gen_random_uuid(),
  image_url text,
  type text,
  title text not null,
  issuer text,
  date_label text,
  sort_order int not null default 0
);

-- 5. Experience / roadmap timeline.
create table if not exists experience_items (
  id uuid primary key default gen_random_uuid(),
  date_label text,
  index_label text,
  title text not null,
  place text,
  description text,
  sort_order int not null default 0
);

-- 6. Projects cache, populated by the admin's "Sync from GitHub" action.
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  repo_name text not null unique,
  owner text not null default 'lukman754',
  description text,
  language text,
  topics jsonb not null default '[]',
  stars int not null default 0,
  forks int not null default 0,
  url text,
  homepage text,
  images jsonb not null default '[]',
  is_featured boolean not null default true,
  sort_order int not null default 0,
  synced_at timestamptz not null default now()
);

-- If you already ran this script before the "owner" column existed, this backfills it.
alter table projects add column if not exists owner text not null default 'lukman754';

-- Row Level Security: public read, authenticated write.
alter table profile enable row level security;
alter table skill_groups enable row level security;
alter table progress_items enable row level security;
alter table certificates enable row level security;
alter table experience_items enable row level security;
alter table projects enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['profile','skill_groups','progress_items','certificates','experience_items','projects']
  loop
    execute format('create policy "%s_public_read" on %I for select using (true)', t, t);
    execute format('create policy "%s_auth_insert" on %I for insert with check (auth.role() = ''authenticated'')', t, t);
    execute format('create policy "%s_auth_update" on %I for update using (auth.role() = ''authenticated'')', t, t);
    execute format('create policy "%s_auth_delete" on %I for delete using (auth.role() = ''authenticated'')', t, t);
  end loop;
end $$;

-- Storage bucket for uploaded photos/certificate images.
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

create policy "portfolio_bucket_public_read" on storage.objects
  for select using (bucket_id = 'portfolio');
create policy "portfolio_bucket_auth_write" on storage.objects
  for insert with check (bucket_id = 'portfolio' and auth.role() = 'authenticated');
create policy "portfolio_bucket_auth_update" on storage.objects
  for update using (bucket_id = 'portfolio' and auth.role() = 'authenticated');
create policy "portfolio_bucket_auth_delete" on storage.objects
  for delete using (bucket_id = 'portfolio' and auth.role() = 'authenticated');

-- Seed data matching the current hardcoded site content, so the admin starts pre-filled.
insert into profile (id, about_skills, about_meta)
values (
  1,
  '[
    {"label":"Web Development","core":true},
    {"label":"Database","core":false},
    {"label":"Automation","core":false},
    {"label":"Data Processing","core":false},
    {"label":"UI/UX","core":false},
    {"label":"Graphic Designer","core":false}
  ]',
  '[
    {"label":"CORE IDENTITY","value":"WEB DEVELOPER"},
    {"label":"BACKGROUND","value":"INFORMATION SYSTEMS GRADUATE"},
    {"label":"WORKFLOW","value":"AI-ASSISTED DEVELOPMENT"},
    {"label":"METHODOLOGY","value":"SYSTEM THINKING & DB LOGIC"},
    {"label":"APPROACH","value":"LEARNING BY BUILDING"}
  ]'
)
on conflict (id) do nothing;

insert into skill_groups (label, items, sort_order) values
  ('LANGUAGES', '["PHP","JavaScript","Python","SQL","HTML","CSS"]', 0),
  ('FRAMEWORK / TOOLS', '["Bootstrap","Tailwind","CodeIgniter","Git","Composer"]', 1),
  ('DATABASE', '["MySQL","MariaDB","phpMyAdmin"]', 2)
on conflict do nothing;

insert into progress_items (label, value, sort_order) values
  ('WEB DEVELOPMENT', 90, 0),
  ('DATABASE / SQL', 85, 1),
  ('AUTOMATION', 82, 2),
  ('UI IMPLEMENTATION', 86, 3),
  ('DATA / PYTHON', 72, 4)
on conflict do nothing;

insert into certificates (image_url, type, title, issuer, date_label, sort_order) values
  ('/assets/certificates/sertif1.jpg', 'CERTIFICATE / WEB SYSTEM', 'FULL STACK WEB DEVELOPMENT', 'DIGITAL LEARNING ARCHIVE', '2026 / 01', 0),
  ('/assets/certificates/sertif2.jpg', 'ACHIEVEMENT / AUTOMATION', 'BROWSER AUTOMATION SYSTEM', 'FIELD OPERATIONS UNIT', '2025 / 11', 1),
  ('/assets/certificates/sertif3.jpg', 'CERTIFICATE / DATA', 'DATABASE & INFORMATION SYSTEMS', 'ACADEMIC SYSTEMS LAB', '2025 / 08', 2),
  ('/assets/certificates/sertif4.jpg', 'ACHIEVEMENT / DESIGN POSTER', 'NATIONAL POSTER COMPETITION', 'UNIVERSITAS NEGERI YOGYAKARTA', '2023 / 04', 3)
on conflict do nothing;

insert into experience_items (date_label, index_label, title, place, description, sort_order) values
  ('2026 / PRESENT', '01', 'Software / Web Development', 'PERSONAL PROJECTS / FREELANCE / ACADEMIC', 'Membangun aplikasi web, database system, automation tools, dan eksperimen teknologi untuk kebutuhan nyata maupun pembelajaran.', 0),
  ('INTERNSHIP', '02', 'IT / Student Support', 'FAKULTAS ILMU KOMPUTER', 'Membangun aplikasi web, database system, automation tools, dan eksperimen teknologi untuk kebutuhan nyata maupun pembelajaran.', 1),
  ('ACADEMIC', '03', 'Information Systems', 'UNIVERSITAS PAMULANG', 'Membangun aplikasi web, database system, automation tools, dan eksperimen teknologi untuk kebutuhan nyata maupun pembelajaran.', 2)
on conflict do nothing;

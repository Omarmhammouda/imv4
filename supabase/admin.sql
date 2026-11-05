-- ============================================================================
-- Insomnia Murals — admin portal (/admin) database setup
-- Applied to the live project Nov 2026 (migration "admin_portal"). Run after
-- schema.sql on a fresh project. Safe to re-run.
--
-- Who can sign in to /admin: anyone listed in public.admins whose Supabase Auth
-- account (same email) is confirmed. Add someone:
--   insert into public.admins (email, name) values ('someone@insomniamurals.com', 'Name');
-- then create their login in Supabase → Authentication → Users → Add user
-- (tick "Auto confirm user").
-- ============================================================================

-- Admin allowlist ------------------------------------------------------------
create table if not exists public.admins (
  email      text primary key check (email = lower(email)),
  name       text,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.admins a
    join auth.users u on lower(u.email) = a.email
    where u.id = auth.uid() and u.email_confirmed_at is not null
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "admins read admins" on public.admins;
create policy "admins read admins" on public.admins for select to authenticated using (public.is_admin());

-- Content write access for admins --------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['settings','chapters','regions','projects','stats'] loop
    execute format('drop policy if exists "admin write %1$s" on public.%1$I', t);
    execute format('create policy "admin write %1$s" on public.%1$I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

drop policy if exists "admin read inquiries" on public.inquiries;
create policy "admin read inquiries" on public.inquiries for select to authenticated using (public.is_admin());
drop policy if exists "admin update inquiries" on public.inquiries;
create policy "admin update inquiries" on public.inquiries for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin delete inquiries" on public.inquiries;
create policy "admin delete inquiries" on public.inquiries for delete to authenticated using (public.is_admin());
alter table public.inquiries add column if not exists status text not null default 'new';

-- Projects: home night-walk walls, optional area ------------------------------
--   on_home / home_sort → the mural gets a wall on the home page walk (in order)
--   wall_image          → tight crop wrapped onto the 3D wall (else images[1])
--   place               → place label on the wall (else the area name)
--   region_slug null    → home-walk-only mural (not on the Work page)
alter table public.projects
  add column if not exists place      text,
  add column if not exists on_home    boolean not null default false,
  add column if not exists home_sort  int not null default 0,
  add column if not exists wall_image text;
alter table public.projects alter column region_slug drop not null;
alter table public.projects drop constraint if exists projects_region_slug_fkey;
alter table public.projects add constraint projects_region_slug_fkey
  foreign key (region_slug) references public.regions(slug) on update cascade on delete set null;

-- keep regions.mural_count accurate
create or replace function public.refresh_mural_counts()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update public.regions r
     set mural_count = (select count(*) from public.projects p where p.region_slug = r.slug);
  return null;
end $$;
drop trigger if exists projects_mural_counts on public.projects;
create trigger projects_mural_counts after insert or update or delete on public.projects
  for each statement execute function public.refresh_mural_counts();

-- Publish tracking (drives "Unpublished changes" in the portal) ---------------
create table if not exists public.site_state (
  id            int primary key default 1 check (id = 1),
  changed_at    timestamptz not null default now(),
  published_at  timestamptz,
  published_by  text
);
insert into public.site_state (id, published_at) values (1, now()) on conflict (id) do nothing;
alter table public.site_state enable row level security;
drop policy if exists "admin read site_state" on public.site_state;
create policy "admin read site_state" on public.site_state for select to authenticated using (public.is_admin());
drop policy if exists "admin update site_state" on public.site_state;
create policy "admin update site_state" on public.site_state for update to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.touch_site_state()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update public.site_state set changed_at = now() where id = 1;
  return null;
end $$;
do $$
declare t text;
begin
  foreach t in array array['settings','chapters','regions','projects','stats'] loop
    execute format('drop trigger if exists %1$s_touch on public.%1$I', t);
    execute format('create trigger %1$s_touch after insert or update or delete on public.%1$I for each statement execute function public.touch_site_state()', t);
  end loop;
end $$;

-- Media bucket for mural photos / videos uploaded from the portal ------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 52428800,
  array['image/jpeg','image/png','image/webp','image/gif','image/avif','image/heic','image/heif',
        'video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admin upload site media" on storage.objects;
create policy "admin upload site media" on storage.objects for insert to authenticated
  with check (bucket_id = 'site-media' and public.is_admin());
drop policy if exists "admin update site media" on storage.objects;
create policy "admin update site media" on storage.objects for update to authenticated
  using (bucket_id = 'site-media' and public.is_admin());
drop policy if exists "admin delete site media" on storage.objects;
create policy "admin delete site media" on storage.objects for delete to authenticated
  using (bucket_id = 'site-media' and public.is_admin());
drop policy if exists "admin read site media" on storage.objects;
create policy "admin read site media" on storage.objects for select to authenticated
  using (bucket_id = 'site-media' and public.is_admin());

insert into public.admins (email, name) values ('nia@insomniamurals.com', 'Nia') on conflict do nothing;

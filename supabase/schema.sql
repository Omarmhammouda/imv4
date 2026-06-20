-- ============================================================================
-- Insomnia Murals — complete Supabase schema + seed
-- Run this ONCE in the Supabase SQL Editor (Dashboard → SQL → New query).
-- This is the single source of truth: tables, Row-Level Security, and a seed
-- of the current site content. Safe to re-run (idempotent).
-- ============================================================================

-- ---------- SETTINGS (single row: contact details, socials, brand) ----------
create table if not exists public.settings (
  id              int primary key default 1,
  studio_name     text not null default 'Insomnia Murals',
  tagline         text,
  email           text,
  phone           text,
  whatsapp        text,          -- digits only, incl. country code
  instagram_url   text,
  behance_url     text,
  address_line1   text,
  address_line2   text,
  address_note    text,
  hours           text,
  founding_year   int,
  constraint settings_singleton check (id = 1)
);

-- ---------- CHAPTERS (the 6 home-page beats) ----------
create table if not exists public.chapters (
  slug           text primary key,
  sort           int  not null,
  label          text not null,
  line1          text not null,
  line2          text,
  line3          text,
  emphasis_line  int,             -- 0-based index of the line with the red word
  emphasis_word  text,
  body           text not null,
  cta_label      text not null,
  cta_href       text not null,
  video          text not null,   -- e.g. /videos/vision.mp4
  poster         text not null,   -- e.g. /posters/vision.jpg
  align          text not null default 'left'  -- 'left' | 'right'
);

-- ---------- REGIONS (neighbourhoods the work is grouped/filtered by) ----------
create table if not exists public.regions (
  slug         text primary key,
  sort         int  not null,
  name         text not null,
  mural_count  int  not null default 0,
  blurb        text,
  video        text,
  poster       text
);

-- ---------- PROJECTS (the individual murals shown on /work) ----------
create table if not exists public.projects (
  id           bigint generated always as identity primary key,
  region_slug  text not null references public.regions(slug) on delete cascade,
  sort         int  not null default 0,
  title        text not null,
  client       text,
  year         int,
  size         text,
  images       text[],   -- one or more photo URLs/paths (first = cover); null → placeholders
  video        text      -- optional hover clip
);

-- ---------- STATS (about page) ----------
create table if not exists public.stats (
  id     bigint generated always as identity primary key,
  sort   int  not null default 0,
  value  text not null,   -- e.g. "10+", "14k", "9x"
  label  text not null
);

-- ---------- INQUIRIES (contact form submissions) ----------
create table if not exists public.inquiries (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  name          text not null,
  email         text not null,
  project_type  text,
  budget        text,
  message       text not null
);

-- ============================================================================
-- ROW LEVEL SECURITY
--   content tables  → public can SELECT (read)
--   inquiries       → public can INSERT only (no read)
-- ============================================================================
alter table public.settings  enable row level security;
alter table public.chapters  enable row level security;
alter table public.regions   enable row level security;
alter table public.projects  enable row level security;
alter table public.stats     enable row level security;
alter table public.inquiries enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename='settings' and policyname='public read settings') then
    create policy "public read settings" on public.settings for select to anon, authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='chapters' and policyname='public read chapters') then
    create policy "public read chapters" on public.chapters for select to anon, authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='regions' and policyname='public read regions') then
    create policy "public read regions" on public.regions for select to anon, authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='projects' and policyname='public read projects') then
    create policy "public read projects" on public.projects for select to anon, authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='stats' and policyname='public read stats') then
    create policy "public read stats" on public.stats for select to anon, authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='inquiries' and policyname='anyone can submit') then
    create policy "anyone can submit" on public.inquiries for insert to anon, authenticated with check (true);
  end if;
end $$;

-- ============================================================================
-- SEED — current site content (edit these rows anytime, then redeploy)
-- ============================================================================
insert into public.settings (id, studio_name, tagline, email, phone, whatsapp,
  instagram_url, behance_url, address_line1, address_line2, address_note, hours, founding_year)
values (1, 'Insomnia Murals',
  'Nocturnal studio for large-scale murals & brand identity',
  'hello@insomniamurals.studio', '+1 (000) 000-0000', '10000000000',
  'https://instagram.com', 'https://behance.net',
  'Unit 7, The Coil Works', '14 Lantern Lane', 'Night entrance off the alley',
  'We answer noon–midnight', 2014)
on conflict (id) do nothing;

insert into public.chapters (slug, sort, label, line1, line2, line3, emphasis_line, emphasis_word, body, cta_label, cta_href, video, poster, align) values
('vision', 1, 'Vision', 'We paint', 'the walls', 'of tomorrow', 2, 'tomorrow',
  'Insomnia Murals is a nocturnal studio for large-scale murals and brand identity. We turn blank concrete into landmarks: work that draws a city''s eye and holds it.',
  'Enter the studio', '/about', '/videos/vision.mp4', '/posters/vision.jpg', 'left'),
('craft', 2, 'Craft', 'Every wall', 'tells', 'a story', 2, 'story',
  'From the first sketch to the last coat, we obsess over line, scale and surface. Hand-cut stencils, free-hand aerosol, brushwork: the right tool for the wall in front of us.',
  'See the process', '/process', '/videos/craft.mp4', '/posters/craft.jpg', 'right'),
('scale', 3, 'Scale', 'From a sketch', 'to', 'the skyline', 2, 'skyline',
  'A napkin idea becomes a ten-storey statement. We plan, permit and produce murals at architectural scale, engineered to survive weather, light and time.',
  'Browse the work', '/work', '/videos/scale.mp4', '/posters/scale.jpg', 'left'),
('collaboration', 4, 'Collaboration', 'Artists, brands', '& cities', 'in concert', 2, 'concert',
  'We bring artists, brands and city programs into one room. Clear briefs, shared authorship, and murals that serve the neighbourhood as much as the logo.',
  'Our services', '/services', '/videos/collaboration.mp4', '/posters/collaboration.jpg', 'right'),
('impact', 5, 'Impact', 'Color that', 'changes', 'a place', 1, 'changes',
  'A wall can shift how a street feels: slowing traffic, drawing footfall, giving a block its name back. We measure success in the life that gathers around the work.',
  'Start a project', '/contact', '/videos/impact.mp4', '/posters/impact.jpg', 'left'),
('legacy', 6, 'Legacy', 'And leaves', 'a mark', 'that lasts', 2, 'lasts',
  'Paint fades; landmarks don''t. We document, protect and maintain every mural so the work keeps speaking long after the lift drives away.',
  'Inquire', '/contact', '/videos/legacy.mp4', '/posters/legacy.jpg', 'right')
on conflict (slug) do nothing;

insert into public.regions (slug, sort, name, mural_count, blurb, video, poster) values
('downtown', 1, 'Downtown Core', 14, 'High-rise gable ends and transit hubs. The murals the whole city drives past.', '/videos/scale.mp4', '/posters/scale.jpg'),
('harbor', 2, 'Harbor & Riverside', 9, 'Warehouse facades and dock walls washed in salt light and slow water.', '/videos/scale.mp4', '/posters/scale.jpg'),
('northside', 3, 'Northside', 12, 'Residential blocks and school yards. Community walls painted with the people on them.', '/videos/craft.mp4', '/posters/craft.jpg'),
('oldtown', 4, 'Old Town', 7, 'Heritage brick and tucked-away laneways. Restraint, patina, detail.', '/videos/legacy.mp4', '/posters/legacy.jpg'),
('industrial', 5, 'Industrial District', 11, 'Raw concrete, silos and rail sidings. The biggest, boldest canvases we get.', '/videos/impact.mp4', '/posters/impact.jpg'),
('heights', 6, 'The Heights', 8, 'Hillside neighbourhoods and lookout walls. Murals that meet the horizon.', '/videos/vision.mp4', '/posters/vision.jpg')
on conflict (slug) do nothing;

-- Murals. Leave `images` null to use rotating placeholders, or set an array of
-- photo paths (first = cover). See "Adding photos" at the bottom of this file.
insert into public.projects (region_slug, sort, title, client, year, size) values
('downtown', 1, 'Sleepless Atlas', 'Meridian Tower', 2024, '32m × 21m'),
('downtown', 2, 'Neon Cartography', 'City Transit Authority', 2023, '18m × 9m'),
('downtown', 3, 'After Hours', 'Lumen Hotels', 2022, '12m × 16m'),
('harbor', 1, 'Tide Memory', 'Riverside Collective', 2024, '22m × 11m'),
('harbor', 2, 'Saltwater Hymn', 'Port Authority', 2023, '14m × 14m'),
('northside', 1, 'Block Party', 'Northside Council', 2024, '16m × 8m'),
('northside', 2, 'Recess', 'Glenview School', 2023, '10m × 6m'),
('northside', 3, 'Family Tree', 'Habitat Trust', 2022, '9m × 12m'),
('oldtown', 1, 'Patina', 'Heritage Society', 2024, '8m × 5m'),
('oldtown', 2, 'The Long Now', 'Old Town BID', 2022, '11m × 7m'),
('industrial', 1, 'Foundry', 'Ironworks Lofts', 2024, '28m × 19m'),
('industrial', 2, 'Conveyor', 'Rail Freight Co.', 2023, '40m × 7m'),
('heights', 1, 'Overlook', 'Heights Association', 2024, '15m × 10m'),
('heights', 2, 'Skyward', 'Summit Developments', 2023, '20m × 13m')
on conflict do nothing;

insert into public.stats (sort, value, label) values
(1, '10+', 'Years sleepless'),
(2, '61', 'Murals delivered'),
(3, '14k', 'm² painted'),
(4, '9x', 'Design awards')
on conflict do nothing;

-- ============================================================================
-- Adding mural photos (one or more per mural)
-- ----------------------------------------------------------------------------
-- `projects.images` is a text array; the first item is the cover. Example:
--
--   update public.projects
--   set images = array['/work/sleepless-atlas-1.jpg',
--                      '/work/sleepless-atlas-2.jpg',
--                      '/work/sleepless-atlas-3.jpg']
--   where title = 'Sleepless Atlas';
--
-- Append one:
--   update public.projects
--   set images = array_append(coalesce(images, '{}'), '/work/extra.jpg')
--   where title = 'Sleepless Atlas';
--
-- Add a brand-new mural:
--   insert into public.projects (region_slug, sort, title, client, year, size, images)
--   values ('downtown', 4, 'Your Mural', 'Client', 2025, '20m × 12m',
--           array['/work/your-mural-1.jpg', '/work/your-mural-2.jpg']);
--
-- Images: commit files under public/work/ (then use '/work/name.jpg') or use
-- full Supabase Storage public URLs. Murals with null `images` show rotating
-- placeholders. Redeploy after edits to publish.
-- ============================================================================

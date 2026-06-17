-- =====================================================================
--  Love Date Planner — Supabase schema
-- =====================================================================
--  App dành cho 2 người ("Nam" / "Trúc Anh"), định danh lưu ở localStorage,
--  KHÔNG dùng Supabase Auth. Vì vậy các bảng dùng cột text "from_user" /
--  "created_by" thay cho UUID auth.users, đúng theo lib/dates.ts & lib/user.ts.
--
--  Chạy toàn bộ file này trong Supabase SQL Editor.
-- =====================================================================

-- Cho phép gen_random_uuid()
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. invites — Lời mời hẹn hò  (lib/dates.ts: Invite)
-- ---------------------------------------------------------------------
create table if not exists public.invites (
  id          uuid primary key default gen_random_uuid(),
  from_user   text not null,
  to_user     text not null,
  message     text,
  date_time   timestamptz,
  status      text not null default 'pending'
              check (status in ('pending', 'accepted', 'declined')),
  created_at  timestamptz not null default now()
);

create index if not exists invites_to_user_idx   on public.invites (to_user);
create index if not exists invites_created_at_idx on public.invites (created_at desc);

-- ---------------------------------------------------------------------
-- 2. dates — Lịch sử / kế hoạch hẹn hò  (lib/dates.ts: DateRecord)
-- ---------------------------------------------------------------------
create table if not exists public.dates (
  id          uuid primary key default gen_random_uuid(),
  created_by  text not null,
  foods       text[] not null default '{}',
  title       text not null default '',
  plan        text not null default '',
  created_at  timestamptz not null default now()
);

create index if not exists dates_created_at_idx on public.dates (created_at desc);

-- =====================================================================
-- 3. Row Level Security
-- =====================================================================
--  App dùng anon key + không có Auth, nên policy mở cho 'anon'.
--  (Đây là app riêng tư cho 2 người; nếu sau này thêm Supabase Auth thì
--   siết lại theo auth.uid().)
-- ---------------------------------------------------------------------
alter table public.invites enable row level security;
alter table public.dates   enable row level security;

drop policy if exists "invites_all" on public.invites;
create policy "invites_all" on public.invites
  for all to anon, authenticated
  using (true) with check (true);

drop policy if exists "dates_all" on public.dates;
create policy "dates_all" on public.dates
  for all to anon, authenticated
  using (true) with check (true);

-- ---------------------------------------------------------------------
-- 4. Realtime cho bảng invites  (app/invite/page.tsx subscribe postgres_changes)
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.invites;

-- =====================================================================
-- 5. Storage bucket "avatars"  (lib/supabase.ts: uploadAvatar)
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Upload ảnh
drop policy if exists "avatars_insert" on storage.objects;
create policy "avatars_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'avatars');

-- Đọc ảnh
drop policy if exists "avatars_select" on storage.objects;
create policy "avatars_select" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'avatars');

-- Thay ảnh (upsert)
drop policy if exists "avatars_update" on storage.objects;
create policy "avatars_update" on storage.objects
  for update to anon, authenticated
  using (bucket_id = 'avatars')
  with check (bucket_id = 'avatars');

-- Xóa ảnh (cho Album Polaroid xóa ảnh trong avatars/album/)
drop policy if exists "avatars_delete" on storage.objects;
create policy "avatars_delete" on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'avatars');

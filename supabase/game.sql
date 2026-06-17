-- =====================================================================
--  Love Date Planner — Mini game "Bản đồ tình yêu"
-- =====================================================================
--  Game đồng bộ cho 2 người ("Nam" / "Trúc Anh"). KHÔNG dùng Supabase Auth,
--  định danh lưu ở localStorage (giống các bảng khác). Tổng điểm, cột mốc
--  bản đồ và chuỗi (streak) đều ĐƯỢC SUY RA từ bảng game_missions ở client
--  (lib/game.ts) nên không cần bảng trạng thái riêng — cứ thêm/xoá dòng là
--  cả hai máy thấy giống nhau qua realtime.
--
--  Lưu ý: "user" là từ khoá Postgres nên cột người chơi đặt tên "player".
--
--  Chạy file này trong Supabase SQL Editor (sau supabase/schema.sql).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
--  game_missions — mỗi dòng là 1 nhiệm vụ hằng ngày 1 người đã hoàn thành
-- ---------------------------------------------------------------------
create table if not exists public.game_missions (
  id           uuid primary key default gen_random_uuid(),
  player       text not null,                 -- 'Nam' | 'Trúc Anh'
  mission_key  text not null,                 -- khớp DAILY_MISSIONS trong lib/game.ts
  day          date not null default current_date,
  points       int  not null default 10,
  created_at   timestamptz not null default now()
);

-- Mỗi người chỉ tick 1 nhiệm vụ 1 lần trong ngày
create unique index if not exists game_missions_unique
  on public.game_missions (player, mission_key, day);

create index if not exists game_missions_day_idx
  on public.game_missions (day desc);

-- ---------------------------------------------------------------------
--  Row Level Security — mở cho anon (app riêng tư 2 người, không Auth)
-- ---------------------------------------------------------------------
alter table public.game_missions enable row level security;

drop policy if exists "game_missions_all" on public.game_missions;
create policy "game_missions_all" on public.game_missions
  for all to anon, authenticated
  using (true) with check (true);

-- ---------------------------------------------------------------------
--  Realtime — để app/game/page.tsx tự cập nhật khi đứa kia tick nhiệm vụ
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.game_missions;

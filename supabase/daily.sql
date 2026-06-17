-- =====================================================================
--  Love Date Planner — Câu hỏi gắn kết hằng ngày (Bé Gấu hỏi)
-- =====================================================================
--  Mỗi ngày một câu hỏi chung. Mỗi người trả lời 1 lần/ngày. Câu trả lời
--  của người kia chỉ hé lộ sau khi mình đã trả lời (xử lý ở client).
--  KHÔNG dùng Supabase Auth — định danh "player" lưu ở localStorage.
--
--  Chạy file này trong Supabase SQL Editor (sau supabase/schema.sql).
-- =====================================================================

create extension if not exists pgcrypto;

create table if not exists public.daily_answers (
  id            uuid primary key default gen_random_uuid(),
  player        text not null,                 -- 'Nam' | 'Trúc Anh'
  day           date not null default current_date,
  question_key  text not null,                 -- khớp QUESTIONS trong lib/daily.ts
  answer        text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Mỗi người 1 câu trả lời / ngày
create unique index if not exists daily_answers_unique
  on public.daily_answers (player, day);

create index if not exists daily_answers_day_idx
  on public.daily_answers (day desc);

-- ---------------------------------------------------------------------
--  Row Level Security — mở cho anon (app riêng tư 2 người, không Auth)
-- ---------------------------------------------------------------------
alter table public.daily_answers enable row level security;

drop policy if exists "daily_answers_all" on public.daily_answers;
create policy "daily_answers_all" on public.daily_answers
  for all to anon, authenticated
  using (true) with check (true);

-- ---------------------------------------------------------------------
--  Realtime — để trang /daily tự cập nhật khi người kia trả lời
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.daily_answers;

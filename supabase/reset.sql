-- =====================================================================
--  Love Date Planner — RESET
-- =====================================================================
--  ⚠️  XÓA TOÀN BỘ DỮ LIỆU. Chạy file này TRƯỚC, rồi chạy schema.sql.
--  Chạy trong Supabase SQL Editor.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Xóa các bảng cũ (từ bản SQL trước, không còn dùng trong code)
-- ---------------------------------------------------------------------
-- Thứ tự không quan trọng vì dùng CASCADE (tự gỡ khóa ngoại liên quan).
drop table if exists public.date_results    cascade;
drop table if exists public.food_selections cascade;
drop table if exists public.date_requests   cascade;
drop table if exists public.history         cascade;
drop table if exists public.foods           cascade;
drop table if exists public.profiles        cascade;

-- ---------------------------------------------------------------------
-- 2. Xóa luôn các bảng mới (nếu đã tạo dở) để chạy lại schema.sql sạch sẽ
-- ---------------------------------------------------------------------
drop table if exists public.invites cascade;
drop table if exists public.dates   cascade;

-- ---------------------------------------------------------------------
-- 3. (Tùy chọn) Xóa policy storage cũ để schema.sql tạo lại không bị trùng
-- ---------------------------------------------------------------------
drop policy if exists "Allow public uploads" on storage.objects;
drop policy if exists "Allow public reads"   on storage.objects;
drop policy if exists "Allow public updates" on storage.objects;

-- Lưu ý: KHÔNG xóa bucket 'avatars' để giữ lại ảnh đã upload.
-- Nếu muốn xóa sạch cả ảnh, bỏ comment 2 dòng dưới:
-- delete from storage.objects where bucket_id = 'avatars';
-- delete from storage.buckets where id = 'avatars';

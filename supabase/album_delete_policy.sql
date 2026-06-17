-- =====================================================================
--  Bổ sung: cho phép XÓA ảnh trong Album (bucket avatars).
--  Chạy file này nếu anh đã chạy schema.sql từ trước (chưa có policy delete).
-- =====================================================================
drop policy if exists "avatars_delete" on storage.objects;
create policy "avatars_delete" on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'avatars');

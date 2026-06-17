import { createClient } from "@supabase/supabase-js";
import type { UserName } from "./user";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function uploadAvatar(userName: UserName, file: File): Promise<string> {
  const path = userName === "Nam" ? "nam/avatar" : "truc-anh/avatar";
  const ext = file.name.split(".").pop() ?? "jpg";
  const fullPath = `${path}.${ext}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(fullPath, file, { upsert: true, contentType: file.type });

  if (error) throw error;

  const { data } = supabase.storage.from("avatars").getPublicUrl(fullPath);
  // thêm cache-bust để ảnh mới thay thế ảnh cũ ngay
  return `${data.publicUrl}?t=${Date.now()}`;
}

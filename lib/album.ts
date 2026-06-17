import { supabase } from "./supabase";

// Album dùng lại bucket "avatars" (đã có policy), lưu trong thư mục con "album/".
const BUCKET = "avatars";
const FOLDER = "album";

export interface AlbumPhoto {
  name: string; // tên file trong storage (để xóa)
  url: string;
}

export async function getAlbumPhotos(): Promise<AlbumPhoto[]> {
  const { data, error } = await supabase.storage.from(BUCKET).list(FOLDER, {
    sortBy: { column: "created_at", order: "asc" },
  });
  if (error) throw error;

  return (data ?? [])
    .filter((f) => f.name && !f.name.startsWith(".")) // bỏ file ẩn của Supabase
    .map((f) => {
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(`${FOLDER}/${f.name}`);
      return { name: f.name, url: pub.publicUrl };
    });
}

export async function uploadAlbumPhoto(file: File): Promise<void> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const rand = Math.random().toString(36).slice(2, 8);
  const fname = `${Date.now()}-${rand}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(`${FOLDER}/${fname}`, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
}

export async function deleteAlbumPhoto(name: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([`${FOLDER}/${name}`]);
  if (error) throw error;
}

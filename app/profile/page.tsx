"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, getAvatar, setAvatar as saveAvatar, type UserName } from "@/lib/user";
import { uploadAvatar } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

export default function ProfilePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<UserName | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push("/login"); return; }
    setUser(u);
    setAvatar(getAvatar(u));
  }, [router]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh quá lớn, tối đa 5MB");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const url = await uploadAvatar(user, file);
      saveAvatar(user, url);
      setAvatar(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      setError(`Upload thất bại: ${msg}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (!user) return null;

  const emoji = user === "Nam" ? "🧑" : "👧";

  return (
    <div className="flex min-h-screen flex-col bg-pink-50">
      <Navbar />
      <div className="flex flex-col items-center px-4 py-12 gap-6">
        <h1 className="text-2xl font-bold text-pink-600">Hồ sơ của {user}</h1>

        {/* avatar lớn */}
        <div className="relative">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt={user}
              className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-pink-100 border-4 border-white shadow-md flex items-center justify-center text-5xl">
              {emoji}
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-pink-500 text-white flex items-center justify-center shadow hover:bg-pink-600 disabled:opacity-50 transition-colors text-lg"
            title="Đổi ảnh"
          >
            {uploading ? (
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "📷"
            )}
          </button>
        </div>

        <p className="text-lg font-semibold text-zinc-700">{user}</p>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="h-11 px-6 rounded-full bg-pink-500 text-white font-medium hover:bg-pink-600 disabled:opacity-50 transition-colors"
        >
          {uploading ? "Đang upload..." : avatar ? "Đổi ảnh đại diện" : "Thêm ảnh đại diện"}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />

        <p className="text-xs text-zinc-400">Ảnh tối đa 5MB · JPG, PNG, WebP</p>

        <div className="mt-2 w-full max-w-xs border-t border-pink-100 pt-6">
          <button
            onClick={() => router.push("/welcome")}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-pink-200 bg-white font-medium text-pink-600 transition-colors hover:bg-pink-50"
          >
            🐻 Xem lại sổ tay Bé Gấu
          </button>
        </div>
      </div>
    </div>
  );
}

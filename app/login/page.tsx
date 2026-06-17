"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { setUser, getAvatar } from "@/lib/user";

const ADMIN_SESSION_KEY = "ldp_admin_verified";

export default function LoginPage() {
  const router = useRouter();
  const passwordRef = useRef<HTMLInputElement>(null);
  const [trucAnhAvatar, setTrucAnhAvatar] = useState<string | null>(null);

  const [showNamForm, setShowNamForm] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTrucAnhAvatar(getAvatar("Trúc Anh"));
  }, []);

  const loginTrucAnh = () => {
    setUser("Trúc Anh");
    router.replace("/home");
  };

  const loginNam = async (e: React.FormEvent) => {
    e.preventDefault();
    const password = passwordRef.current?.value ?? "";
    if (!password) return;

    setChecking(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const { ok } = await res.json();
      if (ok) {
        setUser("Nam");
        sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
        router.replace("/admin");
      } else {
        setError("Sai mật khẩu");
        if (passwordRef.current) passwordRef.current.value = "";
      }
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-pink-50">
      <div className="flex flex-col items-center gap-8 text-center px-4">
        <div>
          <h1 className="text-4xl font-bold text-pink-600">Date With Cục Vàng</h1>
          <p className="mt-2 text-zinc-500">Lên kế hoạch hẹn hò cùng người thương 💕</p>
        </div>

        {/* chỉ Trúc Anh hiển thị */}
        <button
          onClick={loginTrucAnh}
          className="flex flex-col items-center gap-3 rounded-2xl border-2 border-pink-300 bg-pink-100 px-10 py-6 font-semibold text-pink-700 hover:border-pink-400 transition-all"
        >
          {trucAnhAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={trucAnhAvatar}
              alt="Trúc Anh"
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <span className="text-6xl">👧</span>
          )}
          <span className="text-lg">Trúc Anh</span>
        </button>
      </div>

      {/* nút ẩn của Nam — góc dưới phải */}
      <button
        onClick={() => { setShowNamForm((v) => !v); setError(null); }}
        className="fixed bottom-5 right-5 w-9 h-9 rounded-full bg-pink-100/50 hover:bg-pink-200/70 transition-colors flex items-center justify-center text-pink-300 text-sm"
        aria-label="."
      >
        🔒
      </button>

      {/* form mật khẩu của Nam */}
      {showNamForm && (
        <div className="fixed bottom-16 right-5 w-64 rounded-2xl bg-white shadow-xl border border-zinc-100 p-5">
          <p className="text-xs text-zinc-400 mb-3 text-center">Đăng nhập Nam</p>
          <form onSubmit={loginNam} className="flex flex-col gap-3">
            <input
              ref={passwordRef}
              type="password"
              placeholder="Mật khẩu"
              autoFocus
              className="w-full h-10 rounded-full border border-zinc-200 px-4 text-sm text-zinc-700 outline-none focus:border-pink-400 transition-colors"
            />
            {error && <p className="text-xs text-red-400 text-center">{error}</p>}
            <button
              type="submit"
              disabled={checking}
              className="h-10 rounded-full bg-zinc-800 text-white text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              {checking ? "..." : "Vào"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

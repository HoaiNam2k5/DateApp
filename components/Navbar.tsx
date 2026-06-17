"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getUser, clearUser, getAvatar, type UserName } from "@/lib/user";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserName | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const u = getUser();
    setUser(u);
    if (u) setAvatar(getAvatar(u));
  }, [pathname]);

  const signOut = () => {
    clearUser();
    router.push("/login");
  };

  const navLinks = [
    { href: "/home", label: "Trang chủ" },
    { href: "/plan", label: "Hẹn hò" },
    { href: "/invite", label: "Lời mời" },
    { href: "/bear", label: "Bé Gấu" },
    { href: "/daily", label: "Hỏi nhau" },
    { href: "/game", label: "Bản đồ" },
    { href: "/history", label: "Lịch sử" },
  ];

  if (!user) return null;

  const emoji = user === "Nam" ? "🧑" : "👧";

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur border-b border-pink-100">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <span className="font-bold text-pink-500 text-sm">Cục Vàng</span>
          <div className="flex gap-1">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => router.push(link.href)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-pink-100 text-pink-600"
                    : "text-zinc-500 hover:text-pink-500"
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2">
          {user === "Nam" && (
            <button
              onClick={() => router.push("/admin")}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                pathname === "/admin"
                  ? "bg-pink-100 text-pink-600"
                  : "text-zinc-500 hover:text-pink-500"
              }`}
            >
              Admin
            </button>
          )}

          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full pl-2 pr-3 py-1 hover:bg-pink-50 transition-colors"
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt={user} className="h-7 w-7 rounded-full object-cover" />
            ) : (
              <span className="text-xl">{emoji}</span>
            )}
            <span className="text-xs font-medium text-zinc-600">{user}</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 w-48 rounded-2xl bg-white shadow-lg border border-zinc-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-50 flex items-center gap-2">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt={user} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span className="text-xl">{emoji}</span>
                )}
                <p className="text-xs font-semibold text-zinc-800">{user}</p>
              </div>
              <button
                onClick={() => { setMenuOpen(false); router.push("/profile"); }}
                className="w-full px-4 py-3 text-left text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Hồ sơ & Avatar
              </button>
              <button
                onClick={signOut}
                className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                Đổi người dùng
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

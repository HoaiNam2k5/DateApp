"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getUser } from "@/lib/user";
import {
  getInvites,
  getDates,
  deleteInvite,
  deleteDate,
  wipeAllData,
  type Invite,
  type DateRecord,
} from "@/lib/dates";
import Navbar from "@/components/Navbar";

const ADMIN_SESSION_KEY = "ldp_admin_verified";

const STATUS_META: Record<Invite["status"], { label: string; cls: string }> = {
  pending: { label: "Đang chờ", cls: "bg-amber-100 text-amber-600" },
  accepted: { label: "Đã đồng ý", cls: "bg-green-100 text-green-600" },
  declined: { label: "Đã từ chối", cls: "bg-zinc-100 text-zinc-500" },
};

function fmt(dt: string | null) {
  if (!dt) return "—";
  const d = new Date(dt);
  return isNaN(d.getTime())
    ? dt
    : d.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

function who(name: string) {
  return name === "Nam" ? "🧑 Nam" : "👧 Trúc Anh";
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [dates, setDates] = useState<DateRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // id đang xử lý
  const [confirmWipe, setConfirmWipe] = useState(false);

  const load = async () => {
    try {
      const [inv, dt] = await Promise.all([getInvites(), getDates()]);
      setInvites(inv);
      setDates(dt);
      setError(null);
    } catch {
      setError("Không tải được dữ liệu (kiểm tra bảng Supabase)");
    }
  };

  useEffect(() => {
    const isNam = getUser() === "Nam";
    const verified = sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
    if (!isNam || !verified) {
      router.replace("/login");
      return;
    }
    load().finally(() => setLoading(false));
  }, [router]);

  const removeInvite = async (id: string) => {
    setBusy(id);
    try {
      await deleteInvite(id);
      setInvites((xs) => xs.filter((x) => x.id !== id));
    } catch {
      setError("Xóa lời mời thất bại");
    } finally {
      setBusy(null);
    }
  };

  const removeDate = async (id: string) => {
    setBusy(id);
    try {
      await deleteDate(id);
      setDates((xs) => xs.filter((x) => x.id !== id));
    } catch {
      setError("Xóa buổi hẹn thất bại");
    } finally {
      setBusy(null);
    }
  };

  const handleWipe = async () => {
    if (!confirmWipe) {
      setConfirmWipe(true);
      return;
    }
    setBusy("wipe");
    try {
      await wipeAllData();
      setInvites([]);
      setDates([]);
      setConfirmWipe(false);
    } catch {
      setError("Xóa toàn bộ thất bại");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-pink-500" />
        </div>
      </div>
    );
  }

  const pending = invites.filter((i) => i.status === "pending").length;
  const accepted = invites.filter((i) => i.status === "accepted").length;

  const stats = [
    { label: "Lời mời", value: invites.length, color: "text-pink-500" },
    { label: "Đang chờ", value: pending, color: "text-amber-500" },
    { label: "Đã đồng ý", value: accepted, color: "text-green-500" },
    { label: "Buổi hẹn", value: dates.length, color: "text-blue-500" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      <Navbar />

      {/* header band — báo hiệu khu vực quản trị, tách khỏi giao diện hồng của Trúc Anh */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-5 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Bảng điều khiển</h1>
              <p className="mt-0.5 text-sm text-slate-400">
                Khu vực quản trị · chỉ dành cho Nam
              </p>
            </div>
            <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-600">
              Admin
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-5 py-8">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm text-red-500">
            {error}
          </div>
        )}

        {/* thống kê */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm"
            >
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="mt-1 text-xs text-slate-400">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* lời mời */}
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Lời mời ({invites.length})
          </h2>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {invites.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">Chưa có lời mời nào.</p>
            ) : (
              invites.map((inv, i) => (
                <div
                  key={inv.id}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    i > 0 ? "border-t border-slate-100" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">
                        {who(inv.from_user)} → {who(inv.to_user)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_META[inv.status].cls}`}
                      >
                        {STATUS_META[inv.status].label}
                      </span>
                    </div>
                    {inv.message && (
                      <p className="mt-0.5 truncate text-xs text-slate-500">{inv.message}</p>
                    )}
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Hẹn: {fmt(inv.date_time)} · Gửi: {fmt(inv.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeInvite(inv.id)}
                    disabled={busy === inv.id}
                    className="shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-400 transition-colors hover:border-red-300 hover:text-red-500 disabled:opacity-40"
                  >
                    {busy === inv.id ? "..." : "Xóa"}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* lịch sử hẹn */}
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Lịch sử hẹn ({dates.length})
          </h2>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {dates.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">Chưa có buổi hẹn nào.</p>
            ) : (
              dates.map((d, i) => (
                <div
                  key={d.id}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    i > 0 ? "border-t border-slate-100" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700">
                      {d.title || "(không tiêu đề)"}
                    </p>
                    {d.foods.length > 0 && (
                      <p className="mt-0.5 truncate text-xs text-pink-500">{d.foods.join(", ")}</p>
                    )}
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {who(d.created_by)} · {fmt(d.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeDate(d.id)}
                    disabled={busy === d.id}
                    className="shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-400 transition-colors hover:border-red-300 hover:text-red-500 disabled:opacity-40"
                  >
                    {busy === d.id ? "..." : "Xóa"}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* vùng nguy hiểm */}
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-red-400">
            Vùng nguy hiểm
          </h2>
          <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Xóa toàn bộ dữ liệu</p>
              <p className="text-xs text-slate-500">
                Xóa hết lời mời và lịch sử hẹn. Không thể hoàn tác.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {confirmWipe && (
                <button
                  onClick={() => setConfirmWipe(false)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Hủy
                </button>
              )}
              <button
                onClick={handleWipe}
                disabled={busy === "wipe" || (invites.length === 0 && dates.length === 0)}
                className={`h-9 rounded-full px-4 text-xs font-semibold transition-colors disabled:opacity-30 ${
                  confirmWipe
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "border border-red-300 text-red-500 hover:bg-red-100"
                }`}
              >
                {busy === "wipe" ? "Đang xóa..." : confirmWipe ? "Xác nhận xóa hết" : "Xóa toàn bộ"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

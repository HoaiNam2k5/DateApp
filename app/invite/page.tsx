"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getUser, type UserName } from "@/lib/user";
import { supabase } from "@/lib/supabase";
import {
  createInvite,
  getInvites,
  respondInvite,
  partnerOf,
  type Invite,
} from "@/lib/dates";
import Navbar from "@/components/Navbar";

const STATUS_META: Record<Invite["status"], { label: string; cls: string }> = {
  pending: { label: "Đang chờ", cls: "bg-amber-100 text-amber-600" },
  accepted: { label: "Đã đồng ý 🥰", cls: "bg-green-100 text-green-600" },
  declined: { label: "Đã từ chối 😢", cls: "bg-zinc-100 text-zinc-500" },
};

function fmt(dt: string | null) {
  if (!dt) return "";
  const d = new Date(dt);
  return isNaN(d.getTime()) ? dt : d.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

export default function InvitePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserName | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const dateRef = useRef<HTMLInputElement>(null);
  const msgRef = useRef<HTMLTextAreaElement>(null);

  const load = () => {
    getInvites()
      .then(setInvites)
      .catch(() => setError("Không tải được lời mời (kiểm tra bảng Supabase)"))
      .finally(() => setLoaded(true));
  };

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push("/login"); return; }
    setUser(u);
    load();

    // realtime: tự cập nhật khi có lời mời mới / phản hồi
    const channel = supabase
      .channel("invites-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "invites" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [router]);

  const send = async () => {
    if (!user) return;
    const message = msgRef.current?.value.trim() ?? "";
    const date_time = dateRef.current?.value ?? "";
    setSending(true);
    setError(null);
    try {
      await createInvite({ from_user: user, to_user: partnerOf(user), message, date_time });
      if (msgRef.current) msgRef.current.value = "";
      if (dateRef.current) dateRef.current.value = "";
      load();
    } catch {
      setError("Gửi lời mời thất bại");
    } finally {
      setSending(false);
    }
  };

  const respond = async (id: string, status: "accepted" | "declined") => {
    try {
      await respondInvite(id, status);
      load();
    } catch {
      setError("Phản hồi thất bại");
    }
  };

  const received = invites.filter((i) => i.to_user === user);
  const sent = invites.filter((i) => i.from_user === user);
  const partner = user ? partnerOf(user) : "";

  return (
    <div className="flex min-h-screen flex-col bg-pink-50">
      <Navbar />
      <div className="flex flex-col items-center px-4 py-8">
        <h1 className="text-2xl font-bold text-pink-600 mb-1">💌 Lời mời hẹn hò</h1>
        <p className="text-zinc-500 mb-6 text-sm">Gửi lời rủ cho {partner} nhé</p>

        {error && (
          <div className="mb-4 w-full max-w-md rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-center text-sm text-red-500">
            {error}
          </div>
        )}

        {/* form gửi lời mời */}
        <div className="w-full max-w-md rounded-3xl border border-pink-200 bg-white p-5 shadow-sm">
          <label className="text-xs font-medium text-zinc-500">Thời gian hẹn</label>
          <input
            ref={dateRef}
            type="datetime-local"
            className="mt-1 mb-3 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-pink-300"
          />
          <label className="text-xs font-medium text-zinc-500">Lời nhắn</label>
          <textarea
            ref={msgRef}
            rows={2}
            placeholder={`Gửi ${partner} vài lời ngọt ngào...`}
            className="mt-1 mb-4 w-full resize-none rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-pink-300"
          />
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={send}
            disabled={sending}
            className="h-11 w-full rounded-full bg-pink-500 font-semibold text-white hover:bg-pink-600 disabled:opacity-60"
          >
            {sending ? "Đang gửi..." : `Gửi lời mời cho ${partner} 💕`}
          </motion.button>
        </div>

        {!loaded ? (
          <div className="mt-10 h-7 w-7 animate-spin rounded-full border-4 border-pink-200 border-t-pink-500" />
        ) : (
          <div className="mt-8 w-full max-w-md space-y-6">
            {/* lời mời nhận được */}
            <section>
              <h2 className="mb-2 text-sm font-bold text-zinc-600">📥 Lời mời cho mình</h2>
              {received.length === 0 && <p className="text-sm text-zinc-400">Chưa có lời mời nào.</p>}
              <AnimatePresence>
                {received.map((iv) => (
                  <motion.div
                    key={iv.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400">Từ {iv.from_user}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_META[iv.status].cls}`}>
                        {STATUS_META[iv.status].label}
                      </span>
                    </div>
                    {iv.date_time && <p className="mt-1 text-sm text-pink-500">🕐 {fmt(iv.date_time)}</p>}
                    {iv.message && <p className="mt-1 text-sm text-zinc-700">{iv.message}</p>}
                    {iv.status === "pending" && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => respond(iv.id, "accepted")}
                          className="h-9 flex-1 rounded-full bg-pink-500 text-sm font-medium text-white hover:bg-pink-600"
                        >
                          Đồng ý 🥰
                        </button>
                        <button
                          onClick={() => respond(iv.id, "declined")}
                          className="h-9 flex-1 rounded-full border border-zinc-200 text-sm font-medium text-zinc-500 hover:bg-zinc-50"
                        >
                          Để hôm khác
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </section>

            {/* lời mời đã gửi */}
            <section>
              <h2 className="mb-2 text-sm font-bold text-zinc-600">📤 Lời mời đã gửi</h2>
              {sent.length === 0 && <p className="text-sm text-zinc-400">Chưa gửi lời mời nào.</p>}
              {sent.map((iv) => (
                <div key={iv.id} className="mb-3 rounded-2xl border border-zinc-100 bg-white/70 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Gửi {iv.to_user}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_META[iv.status].cls}`}>
                      {STATUS_META[iv.status].label}
                    </span>
                  </div>
                  {iv.date_time && <p className="mt-1 text-sm text-pink-500">🕐 {fmt(iv.date_time)}</p>}
                  {iv.message && <p className="mt-1 text-sm text-zinc-700">{iv.message}</p>}
                </div>
              ))}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Send } from "lucide-react";
import { getUser, type UserName } from "@/lib/user";
import { partnerOf } from "@/lib/dates";
import { supabase } from "@/lib/supabase";
import {
  getAnswers,
  questionByKey,
  questionOfToday,
  submitAnswer,
  todayAnswerOf,
  todayKey,
  type DailyAnswer,
} from "@/lib/daily";
import { playDing } from "@/lib/sound";
import Navbar from "@/components/Navbar";

export default function DailyPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserName | null>(null);
  const [rows, setRows] = useState<DailyAnswer[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    try {
      setRows(await getAnswers());
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.push("/login");
      return;
    }
    setUser(u);
    load();

    const channel = supabase
      .channel("daily-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_answers" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, load]);

  const question = questionOfToday();
  const partner = user ? partnerOf(user) : "";

  const myAnswer = user ? todayAnswerOf(rows, user) : null;
  const partnerAnswer = user ? todayAnswerOf(rows, partnerOf(user)) : null;
  const answered = !!myAnswer;

  const submit = async () => {
    if (!user) return;
    const text = textRef.current?.value.trim() ?? "";
    if (!text) return;
    setSending(true);
    try {
      await submitAnswer(user, text);
      playDing();
      setEditing(false);
      await load();
    } catch {
      /* lỗi mạng — bỏ qua, realtime/lần load sau sẽ đồng bộ */
    } finally {
      setSending(false);
    }
  };

  // lịch sử các ngày trước (đã có ít nhất 1 câu trả lời, không tính hôm nay)
  const today = todayKey();
  const pastDays = Array.from(new Set(rows.map((r) => r.day)))
    .filter((d) => d !== today)
    .slice(0, 7);

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-rose-50 to-pink-50">
      <Navbar />

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-12 pt-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-pink-600">💭 Câu hỏi gắn kết</h1>
          <p className="mt-1 text-sm text-pink-500/80">
            Mỗi ngày một câu — trả lời xong mới thấy câu của {partner} nha 🤍
          </p>
        </div>

        {/* THẺ CÂU HỎI HÔM NAY */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 rounded-3xl border border-pink-100 bg-white/80 p-6 text-center shadow-sm backdrop-blur"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pink-100 text-4xl">
            {question.emoji}
          </div>
          <p className="mt-3 text-xs font-semibold tracking-widest text-pink-400">
            BÉ GẤU HỎI NÈ
          </p>
          <p className="mt-1 text-lg font-bold leading-snug text-zinc-700">{question.text}</p>
        </motion.div>

        {/* PHẦN TRẢ LỜI CỦA MÌNH */}
        {!answered || editing ? (
          <div className="mt-4 rounded-3xl border border-pink-100 bg-white p-4 shadow-sm">
            <label className="text-xs font-medium text-zinc-500">Câu trả lời của bạn</label>
            <textarea
              ref={textRef}
              rows={3}
              defaultValue={myAnswer?.answer ?? ""}
              placeholder="Viết gì đó thật lòng cho nhau nghe..."
              className="mt-1 w-full resize-none rounded-2xl border border-zinc-200 px-3 py-2 text-sm text-zinc-700 outline-none focus:border-pink-300"
            />
            <button
              onClick={submit}
              disabled={sending}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-pink-500 font-semibold text-white transition-colors hover:bg-pink-600 disabled:opacity-60"
            >
              <Send size={16} />
              {sending ? "Đang gửi..." : answered ? "Cập nhật câu trả lời" : "Gửi câu trả lời 💌"}
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-3xl border border-pink-200 bg-pink-50 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-pink-500">Bạn đã trả lời 🌸</span>
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-zinc-400 underline-offset-2 hover:underline"
              >
                Sửa
              </button>
            </div>
            <p className="mt-1 whitespace-pre-line text-sm text-zinc-700">{myAnswer!.answer}</p>
          </motion.div>
        )}

        {/* CÂU TRẢ LỜI CỦA NGƯỜI KIA */}
        <div className="mt-4">
          <AnimatePresence mode="wait">
            {!answered ? (
              <motion.div
                key="locked"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-zinc-200 bg-white/50 p-6 text-center"
              >
                <Lock className="text-zinc-300" size={26} />
                <p className="text-sm text-zinc-400">
                  Trả lời trước đã, rồi câu của {partner} sẽ hiện ra 💞
                </p>
              </motion.div>
            ) : partnerAnswer ? (
              <motion.div
                key="revealed"
                initial={{ opacity: 0, rotateX: -25, y: 8 }}
                animate={{ opacity: 1, rotateX: 0, y: 0 }}
                className="rounded-3xl border border-rose-200 bg-white p-4 shadow-sm"
              >
                <span className="text-xs font-semibold text-rose-500">
                  {partner} trả lời 💌
                </span>
                <p className="mt-1 whitespace-pre-line text-sm text-zinc-700">
                  {partnerAnswer.answer}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-2 rounded-3xl border border-pink-100 bg-white/60 p-6 text-center"
              >
                <motion.span
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-3xl"
                >
                  🐻
                </motion.span>
                <p className="text-sm text-zinc-400">
                  Đang chờ {partner} trả lời... lát ghé lại nha!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* KỶ NIỆM NHỮNG NGÀY TRƯỚC */}
        {loaded && pastDays.length > 0 && (
          <div className="mt-9">
            <h2 className="mb-3 text-sm font-bold text-zinc-600">Những câu đã trả lời 📖</h2>
            <div className="flex flex-col gap-3">
              {pastDays.map((d) => {
                const dayRows = rows.filter((r) => r.day === d);
                const q = questionByKey(dayRows[0]?.question_key);
                return (
                  <div key={d} className="rounded-2xl border border-zinc-100 bg-white/70 p-4">
                    <p className="text-xs text-zinc-400">{fmtDay(d)}</p>
                    <p className="mt-0.5 text-sm font-semibold text-zinc-600">
                      {q ? `${q.emoji} ${q.text}` : "Câu hỏi"}
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {dayRows.map((r) => (
                        <p key={r.id} className="text-sm text-zinc-600">
                          <span className="font-medium text-pink-500">
                            {r.player === user ? "Bạn" : r.player}:
                          </span>{" "}
                          {r.answer}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function fmtDay(d: string): string {
  const date = new Date(d + "T00:00:00");
  return isNaN(date.getTime())
    ? d
    : date.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit" });
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getUser, type UserName } from "@/lib/user";
import Navbar from "@/components/Navbar";

type BearState = "sleeping" | "normal" | "thinking" | "happy";

interface ChatMsg {
  role: "user" | "bear";
  text: string;
}

// ảnh đặt ở public/bear/*.png — kèm emoji dự phòng nếu thiếu ảnh
const BEAR_IMG: Record<BearState, string> = {
  sleeping: "/bear/sleeping.png",
  normal: "/bear/normal.png",
  thinking: "/bear/thinking.png",
  happy: "/bear/happy.png",
};
const BEAR_EMOJI: Record<BearState, string> = {
  sleeping: "😴",
  normal: "🐻",
  thinking: "🤔",
  happy: "🥰",
};
const BEAR_HINT: Record<BearState, string> = {
  sleeping: "Bé Gấu đang ngủ... nhắn gì đó để đánh thức nhé 🐻💤",
  normal: "Bé Gấu đang nghe nè 🐻",
  thinking: "Bé Gấu đang suy nghĩ... 🤔",
  happy: "Bé Gấu vui quá đi 🥰",
};

const SUGGESTIONS = [
  "Hôm nay nên đi đâu chơi? 🌸",
  "Kể em nghe một bí mật nhỏ đi 🤫",
  "Làm sao để người yêu vui hơn? 💕",
  "Tặng quà gì bây giờ ta? 🎁",
];

export default function BearPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserName | null>(null);
  const [state, setState] = useState<BearState>("sleeping");
  const [imgOk, setImgOk] = useState(true);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.push("/login");
      return;
    }
    setUser(u);
  }, [router]);

  // cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // sau một lúc không hoạt động -> Bé Gấu ngủ
  const wakeAndArmIdle = (next: BearState) => {
    setState(next);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setState("sleeping"), 30000);
  };

  const send = async (raw?: string) => {
    const text = (raw ?? inputRef.current?.value ?? "").trim();
    if (!text || loading) return;
    if (inputRef.current) inputRef.current.value = "";

    const history = messages;
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    setState("thinking");
    if (idleTimer.current) clearTimeout(idleTimer.current);

    try {
      const res = await fetch("/api/bear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, user }),
      });
      const data = await res.json();
      const reply: string =
        data.reply ?? data.message ?? data.error ?? "Bé Gấu lỡ ngủ quên mất rồi 🐻💤";
      setMessages((m) => [...m, { role: "bear", text: reply }]);
      wakeAndArmIdle("happy");
      // sau 2.5s chuyển từ happy về normal
      setTimeout(() => setState((s) => (s === "happy" ? "normal" : s)), 2500);
    } catch {
      setMessages((m) => [...m, { role: "bear", text: "Bé Gấu mất kết nối rồi 🥺 thử lại nha!" }]);
      wakeAndArmIdle("normal");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-amber-50 to-pink-50">
      <Navbar />

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-4 pt-6">
        {/* Avatar Bé Gấu */}
        <div className="flex flex-col items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={state}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="relative"
            >
              <motion.div
                animate={
                  state === "sleeping"
                    ? { y: [0, -3, 0] }
                    : state === "happy"
                    ? { rotate: [0, -6, 6, -4, 0] }
                    : state === "thinking"
                    ? { y: [0, -6, 0] }
                    : { y: [0, -4, 0] }
                }
                transition={{
                  duration: state === "happy" ? 0.6 : 2.2,
                  repeat: state === "happy" ? 0 : Infinity,
                  ease: "easeInOut",
                }}
                className="flex h-32 w-32 items-center justify-center"
              >
                {imgOk ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={BEAR_IMG[state]}
                    alt={`Bé Gấu ${state}`}
                    onError={() => setImgOk(false)}
                    className="h-32 w-32 object-contain drop-shadow-md"
                  />
                ) : (
                  <span className="text-7xl">{BEAR_EMOJI[state]}</span>
                )}
              </motion.div>
              {state === "sleeping" && (
                <span className="absolute -right-1 top-0 text-xl">💤</span>
              )}
            </motion.div>
          </AnimatePresence>
          <p className="mt-1 text-lg font-bold text-amber-700">Bé Gấu 🐻</p>
          <p className="text-xs text-amber-500">{BEAR_HINT[state]}</p>
        </div>

        {/* khung chat */}
        <div
          ref={scrollRef}
          className="mt-5 flex flex-1 flex-col gap-3 overflow-y-auto rounded-3xl border border-amber-100 bg-white/70 p-4 backdrop-blur"
        >
          {messages.length === 0 && (
            <div className="m-auto flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-zinc-400">Hỏi Bé Gấu bất cứ điều gì nha 💛</p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-600 transition-colors hover:bg-amber-100"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "self-end bg-pink-500 text-white"
                  : "self-start bg-amber-100 text-amber-900"
              }`}
            >
              {m.text}
            </motion.div>
          ))}

          {loading && (
            <div className="self-start rounded-2xl bg-amber-100 px-4 py-2.5">
              <span className="flex gap-1">
                {[0, 1, 2].map((d) => (
                  <motion.span
                    key={d}
                    className="h-1.5 w-1.5 rounded-full bg-amber-500"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                  />
                ))}
              </span>
            </div>
          )}
        </div>

        {/* ô nhập */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="mt-3 flex items-center gap-2"
        >
          <input
            ref={inputRef}
            placeholder="Nhắn cho Bé Gấu..."
            disabled={loading}
            onFocus={() => state === "sleeping" && setState("normal")}
            className="h-11 flex-1 rounded-full border border-amber-200 bg-white px-4 text-sm text-zinc-700 outline-none transition-colors focus:border-amber-400 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-400 text-white transition-colors hover:bg-amber-500 active:scale-95 disabled:opacity-50"
            aria-label="Gửi"
          >
            ➜
          </button>
        </form>
      </div>
    </div>
  );
}

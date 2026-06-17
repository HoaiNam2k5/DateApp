"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getUser, type UserName } from "@/lib/user";

type BearState = "sleeping" | "normal" | "thinking" | "happy";

interface ChatMsg {
  role: "user" | "bear";
  text: string;
}

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

// những câu Bé Gấu tự nói khi rảnh — đổi luân phiên cho sinh động
const IDLE_LINES = [
  "Bé Gấu nhớ cậu quá nè 🐻💕",
  "Cậu uống nước chưa? Nhớ chăm bản thân nha 💧",
  "Hôm nay cậu xinh hơn hôm qua đó 😳✨",
  "Bé Gấu vừa nghĩ tới cậu xong nè 🥰",
  "✨ Bí mật: một cái ôm chữa được mọi mệt mỏi đó 🤗",
  "💝 Nhiệm vụ tình yêu: nhắn 'thương' cho người yêu ngay nha 💌",
  "Cậu cười lên Bé Gấu xem nào 😄🐻",
  "Mệt thì nghỉ xíu, Bé Gấu ngồi đây với cậu 🫶",
  "Bé Gấu đoán hôm nay sẽ có điều dễ thương xảy ra 🍀",
  "Nhớ rủ người yêu đi chơi cuối tuần nha 🎡💞",
  "Cậu là người tuyệt nhất Bé Gấu từng gặp đó 🐻💗",
  "💝 Nhiệm vụ tình yêu: gửi một tấm ảnh tự sướng cho người yêu 📸",
];

const SUGGESTIONS = [
  "Hôm nay đi đâu chơi? 🌸",
  "Kể bí mật nhỏ đi 🤫",
  "Tặng quà gì đây? 🎁",
];

export default function FloatingBear() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserName | null>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<BearState>("normal");
  const [imgOk, setImgOk] = useState(true);
  const [bubble, setBubble] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lineIdx = useRef(0);

  useEffect(() => {
    setMounted(true);
    setUser(getUser());
  }, [pathname]);

  // tự bật lời nói khi đang đóng chat
  useEffect(() => {
    if (!mounted || !user || open) {
      setBubble(null);
      return;
    }
    // lời chào đầu tiên sau 1.5s
    const first = setTimeout(() => {
      lineIdx.current = Math.floor((Date.now() / 1000) % IDLE_LINES.length);
      setBubble(IDLE_LINES[lineIdx.current]);
    }, 1500);

    // sau đó cứ ~18s đổi một câu mới, hiện 7s rồi ẩn
    const tick = setInterval(() => {
      lineIdx.current = (lineIdx.current + 1) % IDLE_LINES.length;
      setBubble(IDLE_LINES[lineIdx.current]);
      setTimeout(() => setBubble(null), 7000);
    }, 18000);

    // ẩn lời chào đầu sau 7s
    const hideFirst = setTimeout(() => setBubble(null), 8500);

    return () => {
      clearTimeout(first);
      clearTimeout(hideFirst);
      clearInterval(tick);
    };
  }, [mounted, user, open]);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  const openChat = () => {
    setBubble(null);
    setOpen(true);
    setState("normal");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const send = async (raw?: string) => {
    const text = (raw ?? inputRef.current?.value ?? "").trim();
    if (!text || loading) return;
    if (inputRef.current) inputRef.current.value = "";

    const history = messages;
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    setState("thinking");

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
      setState("happy");
      setTimeout(() => setState((s) => (s === "happy" ? "normal" : s)), 2500);
    } catch {
      setMessages((m) => [...m, { role: "bear", text: "Bé Gấu mất kết nối rồi 🥺 thử lại nha!" }]);
      setState("normal");
    } finally {
      setLoading(false);
    }
  };

  // ẩn khi chưa đăng nhập, ở trang login, hoặc trang Bé Gấu (đã có sẵn)
  if (!mounted || !user || pathname === "/login" || pathname === "/bear") return null;

  const Avatar = ({ size }: { size: number }) =>
    imgOk ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={BEAR_IMG[state]}
        alt="Bé Gấu"
        onError={() => setImgOk(false)}
        style={{ width: size, height: size }}
        className="object-contain drop-shadow-md"
      />
    ) : (
      <span style={{ fontSize: size * 0.8 }}>{BEAR_EMOJI[state]}</span>
    );

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col items-end">
      {/* khung chat nhanh */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="mb-3 flex h-[26rem] w-[20rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-2xl"
          >
            {/* header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-amber-100 to-pink-100 px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-bold text-amber-700">
                <Avatar size={28} /> Bé Gấu 🐻
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-amber-500 transition-colors hover:text-amber-700"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            {/* tin nhắn */}
            <div ref={scrollRef} className="flex flex-1 flex-col gap-2 overflow-y-auto bg-amber-50/40 p-3">
              {messages.length === 0 && (
                <div className="m-auto flex flex-col items-center gap-2 text-center">
                  <p className="text-xs text-zinc-400">Nhắn cho Bé Gấu nha 💛</p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[11px] text-amber-600 transition-colors hover:bg-amber-100"
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
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`max-w-[88%] whitespace-pre-line rounded-2xl px-3 py-2 text-[13px] ${
                    m.role === "user"
                      ? "self-end bg-pink-500 text-white"
                      : "self-start bg-amber-100 text-amber-900"
                  }`}
                >
                  {m.text}
                </motion.div>
              ))}
              {loading && (
                <div className="self-start rounded-2xl bg-amber-100 px-3 py-2">
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

            {/* nhập */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2 border-t border-amber-100 bg-white p-2"
            >
              <input
                ref={inputRef}
                placeholder="Nhắn cho Bé Gấu..."
                disabled={loading}
                className="h-9 flex-1 rounded-full border border-amber-200 px-3 text-[13px] text-zinc-700 outline-none focus:border-amber-400 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={loading}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-white transition-colors hover:bg-amber-500 active:scale-95 disabled:opacity-50"
                aria-label="Gửi"
              >
                ➜
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* bong bóng lời nói tự bật */}
      <AnimatePresence>
        {!open && bubble && (
          <motion.button
            onClick={openChat}
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mb-2 max-w-[15rem] rounded-2xl rounded-br-sm border border-amber-100 bg-white px-3 py-2 text-left text-[13px] text-amber-800 shadow-lg"
          >
            {bubble}
          </motion.button>
        )}
      </AnimatePresence>

      {/* nút Bé Gấu nổi */}
      <motion.button
        onClick={() => (open ? setOpen(false) : openChat())}
        whileTap={{ scale: 0.9 }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-200 bg-white shadow-xl"
        aria-label="Mở Bé Gấu"
      >
        <Avatar size={48} />
      </motion.button>
    </div>
  );
}

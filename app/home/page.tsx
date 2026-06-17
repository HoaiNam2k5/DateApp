"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import {
  Sun,
  CloudSun,
  Sunset,
  Moon,
  CalendarHeart,
  MailOpen,
  Clock,
  Sparkles,
  PartyPopper,
  Map as MapIcon,
  MessageCircleHeart,
  type LucideIcon,
} from "lucide-react";
import { getUser, hasOnboarded, type UserName } from "@/lib/user";
import type { PeriodTheme } from "@/lib/daytime";
import Navbar from "@/components/Navbar";
import RomanticBackground from "@/components/effects/RomanticBackground";
import FloatingHearts from "@/components/effects/FloatingHearts";
import PolaroidAlbum from "@/components/PolaroidAlbum";
import MemoryJar from "@/components/MemoryJar";

const PERIOD_ICON: Record<PeriodTheme["icon"], LucideIcon> = {
  Sun,
  CloudSun,
  Sunset,
  Moon,
};

const SHORTCUTS: { href: string; label: string; desc: string; icon: LucideIcon; color: string }[] = [
  { href: "/plan", label: "Lên kế hoạch", desc: "Hẹn hò hôm nay", icon: CalendarHeart, color: "text-pink-500" },
  { href: "/invite", label: "Lời mời", desc: "Gửi & phản hồi", icon: MailOpen, color: "text-rose-500" },
  { href: "/bear", label: "Bé Gấu", desc: "Trò chuyện 🐻", icon: Sparkles, color: "text-amber-500" },
  { href: "/daily", label: "Hỏi nhau", desc: "Câu hỏi hôm nay 💭", icon: MessageCircleHeart, color: "text-rose-400" },
  { href: "/game", label: "Bản đồ", desc: "Mini game 🗺️", icon: MapIcon, color: "text-fuchsia-500" },
  { href: "/history", label: "Lịch sử", desc: "Kỷ niệm đã qua", icon: Clock, color: "text-violet-500" },
];

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserName | null>(null);
  const [theme, setTheme] = useState<PeriodTheme | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.push("/login");
      return;
    }
    // lần đầu sử dụng -> mở sổ tay chào mừng của Bé Gấu
    if (!hasOnboarded(u)) {
      router.replace("/welcome");
      return;
    }
    setUser(u);
  }, [router]);

  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (!user) return null;

  const dark = theme?.period === "night";
  const PeriodIcon = theme ? PERIOD_ICON[theme.icon] : Sun;

  return (
    <RomanticBackground onTheme={setTheme}>
      <FloatingHearts />
      <Navbar />

      {celebrate && size.w > 0 && (
        <Confetti
          width={size.w}
          height={size.h}
          numberOfPieces={180}
          recycle={false}
          gravity={0.25}
          colors={["#ec4899", "#f472b6", "#fb7185", "#f9a8d4", "#e879f9", "#fda4af"]}
          onConfettiComplete={() => setCelebrate(false)}
          drawShape={(ctx) => {
            // vẽ trái tim nhỏ
            const w = 10, h = 10;
            ctx.beginPath();
            ctx.moveTo(0, h / 4);
            ctx.quadraticCurveTo(0, 0, w / 4, 0);
            ctx.quadraticCurveTo(w / 2, 0, w / 2, h / 4);
            ctx.quadraticCurveTo(w / 2, 0, (3 * w) / 4, 0);
            ctx.quadraticCurveTo(w, 0, w, h / 4);
            ctx.quadraticCurveTo(w, h / 2, (3 * w) / 4, (3 * h) / 4);
            ctx.lineTo(w / 2, h);
            ctx.lineTo(w / 4, (3 * h) / 4);
            ctx.quadraticCurveTo(0, h / 2, 0, h / 4);
            ctx.closePath();
            ctx.fill();
          }}
          className="!fixed !inset-0 z-[70]"
        />
      )}

      <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 pb-16 pt-10">
        {/* Lời chào theo giờ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center"
        >
          <motion.div
            animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className={dark ? "text-yellow-200" : "text-amber-400"}
          >
            <PeriodIcon size={48} strokeWidth={1.6} />
          </motion.div>
          <h1 className={`mt-3 text-3xl font-bold ${dark ? "text-white" : "text-pink-600"}`}>
            {theme?.greeting ?? "Chào"}, {user} 🌸
          </h1>
          <p className={`mt-1 text-sm ${dark ? "text-pink-100/80" : "text-pink-500/80"}`}>
            Hôm nay mình làm gì cùng nhau đây? 💕
          </p>

          <button
            onClick={() => setCelebrate(true)}
            className="mt-5 flex items-center gap-2 rounded-full bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/30 transition-transform hover:bg-pink-600 active:scale-95"
          >
            <PartyPopper size={18} /> Tung tim ăn mừng
          </button>
        </motion.div>

        {/* Lối tắt */}
        <div className="mt-10 grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
          {SHORTCUTS.map((s, i) => (
            <motion.button
              key={s.href}
              onClick={() => router.push(s.href)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.96 }}
              className="flex flex-col items-center gap-2 rounded-3xl border border-white/60 bg-white/70 p-4 text-center shadow-sm backdrop-blur"
            >
              <s.icon className={s.color} size={26} />
              <span className="text-sm font-semibold text-zinc-700">{s.label}</span>
              <span className="text-[11px] text-zinc-400">{s.desc}</span>
            </motion.button>
          ))}
        </div>

        {/* Hũ kỷ niệm */}
        <div className="mt-12 w-full rounded-3xl border border-white/60 bg-white/60 p-6 backdrop-blur">
          <MemoryJar />
        </div>

        {/* Album Polaroid */}
        <div className="mt-12 w-full">
          <div className="mb-6 flex items-center justify-center gap-2">
            <Sparkles className={dark ? "text-pink-200" : "text-pink-400"} size={20} />
            <h2 className={`text-lg font-bold ${dark ? "text-white" : "text-pink-600"}`}>
              Album kỷ niệm
            </h2>
          </div>
          <PolaroidAlbum editable />
          <p className={`mt-5 text-center text-xs ${dark ? "text-pink-100/70" : "text-zinc-400"}`}>
            Chạm vào ảnh để phóng to 🔍 · bấm “Thêm ảnh” để đăng kỷ niệm của hai đứa 💕
          </p>
        </div>
      </div>
    </RomanticBackground>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";

interface Idea {
  emoji: string;
  title: string;
  desc: string;
}

const IDEAS: Idea[] = [
  { emoji: "🍳", title: "Cùng nấu ăn", desc: "Chọn một món mới rồi cùng nhau vào bếp." },
  { emoji: "🎬", title: "Movie night", desc: "Cuộn chăn, bắp rang và một bộ phim cả hai chưa xem." },
  { emoji: "🎲", title: "Board game / cờ", desc: "Cờ tỷ phú, Uno hay cá ngựa — ai thua bị phạt nhé." },
  { emoji: "🧩", title: "Xếp hình puzzle", desc: "Một bộ puzzle để cùng nhau hoàn thành." },
  { emoji: "🍪", title: "Làm bánh", desc: "Thử làm bánh quy hoặc bánh kem mini tại nhà." },
  { emoji: "🎤", title: "Hát karaoke", desc: "Mở YouTube karaoke và song ca vài bài." },
  { emoji: "📷", title: "Chụp ảnh couple", desc: "Set up góc nhỏ trong nhà và chụp một bộ ảnh kỷ niệm." },
  { emoji: "🕯️", title: "Bữa tối lãng mạn", desc: "Nến, nhạc nhẹ và một bữa tối tự nấu." },
  { emoji: "📺", title: "Cày phim bộ", desc: "Bắt đầu một series mới và xem cùng nhau." },
  { emoji: "💆", title: "Spa tại nhà", desc: "Đắp mặt nạ, massage thư giãn cho nhau." },
  { emoji: "🎨", title: "Vẽ tranh đôi", desc: "Mỗi người vẽ chân dung người kia — vui là chính." },
  { emoji: "📖", title: "Đọc sách cho nhau nghe", desc: "Chọn một cuốn và thay phiên đọc to." },
];

export default function HomeIdeasPage() {
  const [picked, setPicked] = useState<Idea | null>(null);

  const pickRandom = () => {
    const idea = IDEAS[Math.floor(Math.random() * IDEAS.length)];
    setPicked(idea);
  };

  return (
    <div className="flex min-h-screen flex-col bg-pink-50">
      <Navbar />

      <div className="flex flex-col items-center px-4 py-8 pb-12">
        <h1 className="text-2xl font-bold text-pink-600 mb-1">🏠 Ở nhà cũng vui</h1>
        <p className="text-zinc-500 mb-5 text-sm">Gợi ý hoạt động hẹn hò tại nhà 💕</p>

        <button
          onClick={pickRandom}
          className="mb-6 h-11 px-6 rounded-full bg-pink-500 font-semibold text-white text-sm transition-colors hover:bg-pink-600 active:scale-95"
        >
          🎲 Gợi ý cho em một ý tưởng
        </button>

        <AnimatePresence mode="wait">
          {picked && (
            <motion.div
              key={picked.title}
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="mb-8 w-full max-w-md rounded-3xl border-2 border-pink-300 bg-white p-6 text-center shadow-sm"
            >
              <motion.div
                className="text-5xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
              >
                {picked.emoji}
              </motion.div>
              <h2 className="mt-3 text-lg font-bold text-pink-600">{picked.title}</h2>
              <p className="mt-1 text-sm text-zinc-500">{picked.desc}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid w-full max-w-md grid-cols-2 gap-3">
          {IDEAS.map((idea) => (
            <div
              key={idea.title}
              className="flex flex-col gap-1 rounded-2xl border border-zinc-200 bg-white p-4"
            >
              <span className="text-2xl">{idea.emoji}</span>
              <span className="mt-1 text-sm font-semibold text-zinc-800">{idea.title}</span>
              <span className="text-xs text-zinc-500">{idea.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

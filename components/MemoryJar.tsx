"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { getAlbumPhotos, type AlbumPhoto } from "@/lib/album";
import { playDing } from "@/lib/sound";

/* =====================================================================
 *  🫙 Hũ kỷ niệm — lắc hũ, bốc ngẫu nhiên một tấm ảnh trong album kèm
 *  một dòng caption dễ thương. Tái dùng lib/album.ts (bucket avatars/album).
 * ===================================================================== */

const CAPTIONS = [
  "Ký ức hôm nay của hai đứa 💕",
  "Nhớ khoảnh khắc này không? 🥰",
  "Một mảnh thương nhỏ vừa rơi ra 🌸",
  "Tua lại một chút kỷ niệm nha 🎞️",
  "Bé Gấu nhặt được tấm này nè 🐻",
  "Hồi đó mình đáng yêu ghê 💞",
  "Giữ mãi nụ cười này nhé ✨",
];

export default function MemoryJar() {
  const [photos, setPhotos] = useState<AlbumPhoto[]>([]);
  const [picked, setPicked] = useState<{ photo: AlbumPhoto; caption: string } | null>(null);
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    getAlbumPhotos()
      .then(setPhotos)
      .catch(() => setPhotos([]));
  }, []);

  const shake = () => {
    if (shaking) return;
    if (photos.length === 0) return;
    setShaking(true);
    playDing();
    setTimeout(() => {
      const photo = photos[Math.floor(Math.random() * photos.length)];
      const caption = CAPTIONS[Math.floor(Math.random() * CAPTIONS.length)];
      setPicked({ photo, caption });
      setShaking(false);
    }, 700);
  };

  const empty = photos.length === 0;

  return (
    <div className="flex flex-col items-center">
      <motion.button
        onClick={shake}
        disabled={empty}
        whileTap={{ scale: 0.94 }}
        animate={
          shaking
            ? { rotate: [0, -12, 12, -10, 10, -6, 6, 0], y: [0, -6, 0, -4, 0] }
            : { rotate: 0, y: [0, -4, 0] }
        }
        transition={
          shaking
            ? { duration: 0.7, ease: "easeInOut" }
            : { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }
        className="relative flex h-32 w-28 flex-col items-center justify-center disabled:opacity-60"
        aria-label="Lắc hũ kỷ niệm"
      >
        {/* nắp hũ */}
        <div className="z-10 h-3 w-20 rounded-t-lg bg-pink-300 shadow-sm" />
        <div className="z-10 -mt-1 h-2 w-24 rounded-full bg-pink-400" />
        {/* thân hũ thuỷ tinh */}
        <div className="relative -mt-0.5 flex h-24 w-24 items-end justify-center overflow-hidden rounded-b-3xl rounded-t-xl border border-pink-200 bg-gradient-to-b from-white/60 to-pink-100/80 shadow-inner backdrop-blur">
          {/* các trái tim trong hũ */}
          <div className="mb-2 flex flex-wrap items-center justify-center gap-0.5 px-2 text-lg leading-none">
            {["💗", "💞", "💕", "🌸", "💖", "✨", "💝"].map((e, i) => (
              <motion.span
                key={i}
                animate={shaking ? { y: [0, -8, 0], rotate: [0, 20, -20, 0] } : {}}
                transition={{ duration: 0.5, repeat: shaking ? 1 : 0, delay: i * 0.03 }}
              >
                {e}
              </motion.span>
            ))}
          </div>
          {/* ánh sáng phản chiếu */}
          <div className="pointer-events-none absolute left-2 top-1 h-12 w-3 -rotate-12 rounded-full bg-white/50" />
        </div>
      </motion.button>

      <p className="mt-3 text-center text-sm font-semibold text-pink-600">🫙 Hũ kỷ niệm</p>
      <p className="mt-0.5 text-center text-xs text-zinc-400">
        {empty ? "Thêm ảnh vào album để lắc ra kỷ niệm nha 💕" : "Chạm vào hũ để lắc ra một kỷ niệm ✨"}
      </p>

      {/* Kỷ niệm bốc được */}
      <AnimatePresence>
        {picked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPicked(null)}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex w-full max-w-xs flex-col rounded-md bg-white p-3 pb-5 shadow-2xl"
            >
              <button
                onClick={() => setPicked(null)}
                className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-zinc-600 shadow-lg"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
              <div className="flex items-center justify-center gap-1 pb-2 pt-1 text-xs font-semibold text-pink-500">
                <Sparkles size={14} /> Bé Gấu bốc được
              </div>
              <div className="aspect-square w-full overflow-hidden rounded-sm bg-pink-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={picked.photo.url}
                  alt="kỷ niệm"
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </div>
              <p className="mt-3 text-center font-[cursive] text-base text-zinc-700">
                {picked.caption}
              </p>
              <button
                onClick={shake}
                className="mt-3 h-10 rounded-full bg-pink-100 text-sm font-semibold text-pink-600 transition-colors hover:bg-pink-200"
              >
                Lắc lần nữa 🔄
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

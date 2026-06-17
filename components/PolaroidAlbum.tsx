"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Loader2, ImagePlus } from "lucide-react";
import { getAlbumPhotos, uploadAlbumPhoto, deleteAlbumPhoto } from "@/lib/album";

interface Item {
  key: string;
  name?: string; // có name = ảnh thật (xóa được)
  url?: string;
  caption: string;
  emoji: string;
  gradient: string;
  rotate: number;
}

const GRADIENTS = [
  "linear-gradient(135deg,#fbcfe8,#fda4af)",
  "linear-gradient(135deg,#fde68a,#fca5a5)",
  "linear-gradient(135deg,#c4b5fd,#f0abfc)",
  "linear-gradient(135deg,#bbf7d0,#fbcfe8)",
  "linear-gradient(135deg,#a5b4fc,#c4b5fd)",
  "linear-gradient(135deg,#fda4af,#fbcfe8)",
];
const ROTATES = [-5, 3, -2, 4, -4, 2];

// khung mẫu khi chưa có ảnh thật
const PLACEHOLDERS: Item[] = [
  { key: "p1", caption: "Lần đầu gặp nhau 💕", emoji: "🌸", gradient: GRADIENTS[0], rotate: ROTATES[0] },
  { key: "p2", caption: "Đi cà phê cuối tuần ☕", emoji: "☕", gradient: GRADIENTS[1], rotate: ROTATES[1] },
  { key: "p3", caption: "Hẹn hò xem phim 🎬", emoji: "🎬", gradient: GRADIENTS[2], rotate: ROTATES[2] },
  { key: "p4", caption: "Cùng nhau nấu ăn 🍳", emoji: "🍳", gradient: GRADIENTS[3], rotate: ROTATES[3] },
  { key: "p5", caption: "Đi dạo buổi tối 🌙", emoji: "🌙", gradient: GRADIENTS[4], rotate: ROTATES[4] },
  { key: "p6", caption: "Mãi bên nhau nha ✨", emoji: "✨", gradient: GRADIENTS[5], rotate: ROTATES[5] },
];

export default function PolaroidAlbum({ editable = false }: { editable?: boolean }) {
  const [items, setItems] = useState<Item[]>(PLACEHOLDERS);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<Item | null>(null);

  const load = async () => {
    try {
      const photos = await getAlbumPhotos();
      if (photos.length > 0) {
        setItems(
          photos.map((p, i) => ({
            key: p.name,
            name: p.name,
            url: p.url,
            caption: "Kỷ niệm 💕",
            emoji: "💖",
            gradient: GRADIENTS[i % GRADIENTS.length],
            rotate: ROTATES[i % ROTATES.length],
          }))
        );
      } else {
        setItems(PLACEHOLDERS);
      }
    } catch {
      setItems(PLACEHOLDERS); // lỗi storage thì vẫn hiện khung mẫu
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    for (const f of files) {
      if (f.size > 5 * 1024 * 1024) {
        setError("Ảnh quá lớn, tối đa 5MB");
        return;
      }
    }
    setUploading(true);
    setError(null);
    try {
      for (const f of files) await uploadAlbumPhoto(f);
      await load();
    } catch {
      setError("Tải ảnh thất bại (kiểm tra Supabase Storage)");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (name: string) => {
    try {
      await deleteAlbumPhoto(name);
      await load();
    } catch {
      setError("Xóa ảnh thất bại (cần policy DELETE cho storage)");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {error && (
        <p className="rounded-full bg-red-50 px-3 py-1 text-xs text-red-500">{error}</p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-5">
        {items.map((item, i) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07 }}
            className="group relative"
          >
            {/* động đậy: lắc lư + nhún nhẹ liên tục */}
            <motion.button
              onClick={() => setZoom(item)}
              animate={{ y: [0, -6, 0], rotate: [item.rotate - 1.5, item.rotate + 1.5, item.rotate - 1.5] }}
              transition={{ duration: 4 + (i % 3), repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ scale: 1.08, rotate: 0, zIndex: 20 }}
              whileTap={{ scale: 1.04 }}
              className="flex w-40 cursor-pointer flex-col rounded-sm bg-white p-2 pb-3 shadow-xl"
            >
              <div
                className="relative aspect-square w-full overflow-hidden rounded-sm"
                style={{ background: item.gradient }}
              >
                {item.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={item.caption} className="h-full w-full object-cover" draggable={false} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-5xl">{item.emoji}</div>
                )}
              </div>
              <p className="mt-2 px-1 text-center font-[cursive] text-[13px] text-zinc-600">{item.caption}</p>
            </motion.button>

            {/* nút xóa (chỉ ảnh thật & khi được phép sửa) */}
            {editable && item.name && (
              <button
                onClick={() => remove(item.name!)}
                className="absolute -right-2 -top-2 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100"
                aria-label="Xóa ảnh"
              >
                <X size={15} />
              </button>
            )}
          </motion.div>
        ))}

        {/* ô thêm ảnh */}
        {editable && (
          <label className="flex h-[12.5rem] w-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed border-pink-300 bg-white/50 text-pink-400 transition-colors hover:border-pink-400 hover:bg-pink-50">
            {uploading ? (
              <Loader2 className="animate-spin" size={26} />
            ) : (
              <>
                <Plus size={26} />
                <span className="text-xs font-medium">Thêm ảnh</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={handleFiles}
            />
          </label>
        )}
      </div>

      {editable && !loading && items === PLACEHOLDERS && (
        <p className="flex items-center gap-1.5 text-xs text-zinc-400">
          <ImagePlus size={14} /> Đây là ảnh mẫu — bấm “Thêm ảnh” để đăng ảnh của hai đứa nha 💕
        </p>
      )}

      {/* Lightbox phóng to */}
      <AnimatePresence>
        {zoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoom(null)}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.7, rotate: -6, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex max-h-[85vh] w-full max-w-md flex-col rounded-md bg-white p-3 pb-5 shadow-2xl"
            >
              <button
                onClick={() => setZoom(null)}
                className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-zinc-600 shadow-lg"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
              <div
                className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-sm"
                style={{ background: zoom.gradient }}
              >
                {zoom.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={zoom.url} alt={zoom.caption} className="h-full w-full object-contain" />
                ) : (
                  <span className="text-8xl">{zoom.emoji}</span>
                )}
              </div>
              <p className="mt-3 text-center font-[cursive] text-base text-zinc-700">{zoom.caption}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

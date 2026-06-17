"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { playFlip } from "@/lib/sound";

/* =====================================================================
 *  🐻 Sổ tay onboarding — "My GirlFriend · Bé Gấu AI"
 *  Quyển sổ NHỎ, ban đầu đóng. Chạm vào → bìa lật mở quanh gáy như mở sách
 *  thật, rồi đọc 6 trang bằng cách lật / vuốt.
 *  Phong cách: cozy · cute · romantic · Animal Crossing · storybook.
 * ===================================================================== */

const PINK = "#FF6B9D";
const SOFT = "#FFD6E7";

interface Leaf {
  emoji: string;
  sticker: string;
  title: string;
  body: string;
  tip?: string;
}

const LEAVES: Leaf[] = [
  {
    emoji: "🐻",
    sticker: "🌸",
    title: "Xin chào, tớ là Bé Gấu!",
    body: "Từ hôm nay, Bé Gấu sẽ là người bạn nhỏ đồng hành cùng cậu trong căn nhà xinh này 🏡. Nơi đây cất giữ những buổi hẹn, những lời thương và thật nhiều kỷ niệm của hai đứa. Lật trang nha, để Bé Gấu dẫn cậu đi một vòng 🌷",
  },
  {
    emoji: "🍜",
    sticker: "📍",
    title: "Mình đi chơi ở đâu nhỉ?",
    body: "Ghé mục Hẹn hò, chọn món cậu đang thèm, rồi để Bé Gấu gợi ý những quán xinh gần đây kèm đánh giá và đường đi. Không còn loay hoay “ăn gì hôm nay” nữa đâu nha.",
    tip: "Khó quyết định thì bấm “Chọn ngẫu nhiên” để Bé Gấu chọn giúp 🎲",
  },
  {
    emoji: "💌",
    sticker: "💞",
    title: "Một lời mời nho nhỏ",
    body: "Muốn rủ người ấy đi chơi? Gửi một lời mời kèm thời gian và vài câu thật ngọt. Khi người kia bấm “Đồng ý”, cả màn hình sẽ ngập tim bay cho mà xem 🥰",
  },
  {
    emoji: "🫂",
    sticker: "💬",
    title: "Buồn vui kể Bé Gấu nghe",
    body: "Bất cứ lúc nào thấy nhớ hay cần một lời khuyên, cứ vào mục Bé Gấu trò chuyện với tớ. Bé Gấu luôn ở đây, lắng nghe và ôm cậu thật chặt 🤗",
  },
  {
    emoji: "🗺️",
    sticker: "🔥",
    title: "Hành trình của đôi mình",
    body: "Mỗi ngày làm vài nhiệm vụ nhỏ, hai đứa sẽ cùng nhau đi dọc bản đồ Việt Nam — từ Hà Nội xuống tận Sài Gòn. Giữ chuỗi ngày thật dài để mở khoá hết những vùng đất thương nhớ nha 🌟",
  },
  {
    emoji: "📸",
    sticker: "💕",
    title: "Cất giữ kỷ niệm mình",
    body: "Những khoảnh khắc đẹp nhất sẽ nằm gọn trong Album và Lịch sử, để mai này nhìn lại là mỉm cười. Rồi… mình bắt đầu hành trình thôi nào!",
  },
];

const flip = {
  enter: (dir: number) => ({ rotateY: dir > 0 ? -80 : 80, opacity: 0 }),
  center: { rotateY: 0, opacity: 1 },
  exit: (dir: number) => ({ rotateY: dir > 0 ? 80 : -80, opacity: 0 }),
};

export default function OnboardingBook({
  name = "cậu",
  onFinish,
}: {
  name?: string;
  onFinish: () => void;
}) {
  const [opened, setOpened] = useState(false);
  const [[page, dir], setPage] = useState<[number, number]>([0, 0]);

  const open = () => {
    playFlip();
    setOpened(true);
  };

  const go = (next: number) => {
    if (next < 0 || next >= LEAVES.length || next === page) return;
    playFlip();
    setPage([next, next > page ? 1 : -1]);
  };

  // điều hướng bằng phím (desktop)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onFinish();
      if (!opened) {
        if (e.key === "Enter" || e.key === " ") open();
        return;
      }
      if (e.key === "ArrowRight") go(page + 1);
      if (e.key === "ArrowLeft") go(page - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, opened]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60) go(page + 1);
    else if (info.offset.x > 60) go(page - 1);
  };

  const isLast = page === LEAVES.length - 1;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#FFF5F8] font-nunito"
      style={{ color: "#4A4A4A" }}
    >
      <Decor />

      <button
        onClick={onFinish}
        className="absolute right-4 top-4 z-30 rounded-full bg-white/70 px-4 py-1.5 text-xs font-semibold text-[#FF6B9D] shadow-sm backdrop-blur transition-transform hover:scale-105 active:scale-95"
      >
        Bỏ qua ✕
      </button>

      {/* CUỐN SỔ NHỎ */}
      <div
        className="relative w-[68vw] max-w-[260px] [perspective:1600px] sm:w-[60vw] sm:max-w-[520px]"
        style={{ aspectRatio: "3 / 4" }}
      >
        {/* gáy & bìa sau tạo chiều sâu */}
        <div
          className="absolute inset-0 translate-x-1 translate-y-1.5 rounded-[24px]"
          style={{ background: SOFT }}
        />
        {/* các trang giấy bên trong (luôn render, hiện ra khi mở bìa) */}
        <div className="absolute inset-0 rounded-[24px] bg-[#FFFDFB] shadow-[0_20px_50px_-18px_rgba(255,107,157,0.5)]">
          <div className="absolute inset-[8px] overflow-hidden rounded-[18px] [transform-style:preserve-3d]">
            {/* gáy trái */}
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-5 rounded-l-[18px]"
              style={{
                background: "linear-gradient(90deg, rgba(255,107,157,0.2), rgba(255,107,157,0))",
              }}
            />
            <AnimatePresence custom={dir} mode="popLayout" initial={false}>
              <motion.div
                key={page}
                custom={dir}
                variants={flip}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                drag={opened ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                onDragEnd={onDragEnd}
                className="absolute inset-0 origin-left [backface-visibility:hidden]"
                style={{ touchAction: "pan-y" }}
              >
                <Content leaf={LEAVES[page]} index={page + 1} total={LEAVES.length} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* BÌA — chạm để lật mở quanh gáy (origin trái) */}
        <AnimatePresence>
          {!opened && (
            <motion.button
              key="cover"
              onClick={open}
              initial={{ rotateY: 0 }}
              exit={{ rotateY: -172 }}
              transition={{ duration: 0.85, ease: [0.4, 0, 0.2, 1] }}
              style={{ transformOrigin: "left center", transformStyle: "preserve-3d" }}
              className="absolute inset-0 z-20 origin-left overflow-hidden rounded-[24px] [backface-visibility:hidden]"
            >
              <Cover name={name} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* THANH ĐIỀU HƯỚNG — chỉ hiện khi đã mở sổ */}
      <AnimatePresence>
        {opened && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="z-20 mt-6 flex items-center gap-4"
          >
            <NavBtn dir="prev" disabled={page === 0} onClick={() => go(page - 1)} />

            <div className="flex items-center gap-1.5">
              {LEAVES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  aria-label={`Trang ${i + 1}`}
                  className="transition-all"
                  style={{
                    width: i === page ? 22 : 8,
                    height: 8,
                    borderRadius: 9999,
                    background: i === page ? PINK : SOFT,
                  }}
                />
              ))}
            </div>

            {isLast ? (
              <button
                onClick={onFinish}
                className="rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                style={{ background: PINK, boxShadow: "0 10px 24px -8px rgba(255,107,157,0.7)" }}
              >
                Bắt đầu nha 💕
              </button>
            ) : (
              <NavBtn dir="next" disabled={false} onClick={() => go(page + 1)} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!opened && (
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="z-20 mt-6 text-sm font-semibold"
          style={{ color: PINK }}
        >
          Chạm vào sổ để mở ra nha ✨
        </motion.p>
      )}
    </div>
  );
}

/* ---------- Bìa sổ (mặt ngoài khi đóng) ---------- */
function Cover({ name }: { name: string }) {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center px-5 text-center"
      style={{ background: `linear-gradient(150deg, ${PINK}, #ff9bc1)` }}
    >
      {/* gáy sách bên trái */}
      <div className="absolute inset-y-0 left-0 w-3 bg-black/10" />
      <div className="absolute inset-y-0 left-3 w-[1px] bg-white/40" />
      {/* viền trang trí */}
      <div className="absolute inset-3 rounded-[18px] border-2 border-dashed border-white/50" />

      <motion.div
        animate={{ rotate: [0, -6, 6, 0], y: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="text-[3.5rem] drop-shadow sm:text-[5rem]"
      >
        🐻
      </motion.div>
      <h1 className="mt-2 font-patrick text-2xl leading-tight text-white drop-shadow-sm sm:text-4xl">
        Sổ tay của Bé Gấu
      </h1>
      <p className="mt-1 text-[11px] font-semibold tracking-wide text-white/90 sm:text-xs">
        MY GIRLFRIEND · BÉ GẤU AI
      </p>
      <p className="mt-3 rounded-full bg-white/25 px-3 py-1 text-xs font-medium text-white">
        Dành riêng cho {name} 💌
      </p>
    </div>
  );
}

/* ---------- Trang nội dung ---------- */
function Content({ leaf, index, total }: { leaf: Leaf; index: number; total: number }) {
  return (
    <div className="grid h-full w-full grid-rows-[40%_60%] bg-[#FFFDFB] sm:grid-cols-2 sm:grid-rows-1">
      {/* khung minh hoạ */}
      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{ background: SOFT }}
      >
        <span className="absolute left-2 top-2 text-base opacity-60">{leaf.sticker}</span>
        <span className="absolute bottom-2 right-2 text-base opacity-60">{leaf.sticker}</span>
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 220, damping: 16 }}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white/80 text-4xl shadow-sm sm:h-24 sm:w-24 sm:text-5xl"
        >
          {leaf.emoji}
        </motion.div>
      </div>

      {/* phần chữ */}
      <div className="flex flex-col overflow-y-auto px-5 py-4 sm:px-6 sm:py-6">
        <span className="text-[10px] font-bold tracking-widest" style={{ color: PINK }}>
          TRANG {index} / {total}
        </span>
        <h2 className="mt-0.5 font-patrick text-xl leading-snug sm:text-2xl" style={{ color: "#4A4A4A" }}>
          {leaf.title}
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[#6b6168] sm:text-[15px]">{leaf.body}</p>

        {leaf.tip && (
          <div
            className="mt-3 flex items-start gap-2 rounded-2xl px-3 py-2 text-[12px]"
            style={{ background: "#FFF0F5", color: "#a65b78" }}
          >
            <span>💡</span>
            <span>{leaf.tip}</span>
          </div>
        )}

        <div className="mt-auto pt-3 text-right text-[11px] italic text-[#c9a9b6]">— Bé Gấu 🐾</div>
      </div>
    </div>
  );
}

/* ---------- Nút điều hướng ---------- */
function NavBtn({
  dir,
  disabled,
  onClick,
}: {
  dir: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Trang trước" : "Trang sau"}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg shadow-md transition-transform hover:scale-110 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
      style={{ color: PINK }}
    >
      {dir === "prev" ? "‹" : "›"}
    </button>
  );
}

/* ---------- Trang trí nền ---------- */
function Decor() {
  const items = [
    { e: "💗", x: "8%", y: "18%", d: 0 },
    { e: "✨", x: "88%", y: "22%", d: 0.6 },
    { e: "🌸", x: "14%", y: "78%", d: 1.1 },
    { e: "💞", x: "82%", y: "74%", d: 0.3 },
    { e: "⭐", x: "50%", y: "8%", d: 0.9 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0">
      {items.map((it, i) => (
        <motion.span
          key={i}
          className="absolute text-2xl opacity-70"
          style={{ left: it.x, top: it.y }}
          animate={{ y: [0, -14, 0], rotate: [0, 8, -8, 0] }}
          transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut", delay: it.d }}
        >
          {it.e}
        </motion.span>
      ))}
    </div>
  );
}

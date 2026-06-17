"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

interface StarsProps {
  opacity: number; // 0 → ẩn, 1 → rõ (theo giờ)
  count?: number;
}

// vị trí sao cố định theo seed để không nhảy mỗi lần render
function makeStars(count: number) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    // dùng hàm tất định theo i (không random) để tránh lệch hydrate
    const x = (i * 53) % 100;
    const y = (i * 37) % 100;
    const size = 1 + ((i * 7) % 3);
    const delay = (i % 10) * 0.3;
    const dur = 1.6 + ((i % 5) * 0.4);
    stars.push({ x, y, size, delay, dur });
  }
  return stars;
}

export default function Stars({ opacity, count = 60 }: StarsProps) {
  const stars = useMemo(() => makeStars(count), [count]);

  if (opacity <= 0.02) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ opacity }}
      aria-hidden
    >
      {stars.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            boxShadow: "0 0 6px 1px rgba(255,255,255,0.8)",
          }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }}
          transition={{
            duration: s.dur,
            repeat: Infinity,
            delay: s.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

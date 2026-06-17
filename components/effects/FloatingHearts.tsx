"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";

interface Spark {
  id: number;
  x: number;
  y: number;
  hue: number;
  size: number;
  drift: number;
}

const COLORS = ["#ec4899", "#f472b6", "#fb7185", "#f9a8d4", "#e879f9"];

// Trái tim nhỏ bay nhẹ lên khi rê chuột (hoặc chạm) trong vùng bọc.
export default function FloatingHearts() {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const last = useRef(0);
  const idRef = useRef(0);

  useEffect(() => {
    const spawn = (x: number, y: number) => {
      const now = Date.now();
      if (now - last.current < 70) return; // tiết chế tần suất
      last.current = now;
      const id = idRef.current++;
      const spark: Spark = {
        id,
        x,
        y,
        hue: (id * 53) % COLORS.length,
        size: 14 + (id % 4) * 4,
        drift: ((id % 5) - 2) * 18,
      };
      setSparks((s) => [...s.slice(-24), spark]);
      // tự dọn sau khi bay xong
      setTimeout(() => setSparks((s) => s.filter((p) => p.id !== id)), 1500);
    };

    const onMove = (e: MouseEvent) => spawn(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) spawn(t.clientX, t.clientY);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden>
      <AnimatePresence>
        {sparks.map((s) => (
          <motion.span
            key={s.id}
            className="absolute"
            style={{ left: s.x, top: s.y, color: COLORS[s.hue] }}
            initial={{ opacity: 0.9, scale: 0.4, x: "-50%", y: "-50%" }}
            animate={{ opacity: 0, scale: 1, y: -90, x: `calc(-50% + ${s.drift}px)` }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          >
            <Heart size={s.size} fill="currentColor" strokeWidth={0} />
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

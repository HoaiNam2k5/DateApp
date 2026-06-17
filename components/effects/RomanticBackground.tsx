"use client";

import { useEffect, useState, type ReactNode } from "react";
import { themeOf, type PeriodTheme } from "@/lib/daytime";
import Stars from "./Stars";

interface Props {
  children: ReactNode;
  /** true nếu chữ nên là màu sáng (nền tối buổi tối) */
  onTheme?: (t: PeriodTheme) => void;
}

// Nền lãng mạn: gradient hồng pastel đổi theo giờ + lớp sao lấp lánh.
export default function RomanticBackground({ children, onTheme }: Props) {
  const [theme, setTheme] = useState<PeriodTheme | null>(null);

  useEffect(() => {
    // tính ở client để tránh lệch hydrate (giờ máy người dùng)
    const compute = () => {
      const t = themeOf(new Date().getHours());
      setTheme(t);
      onTheme?.(t);
    };
    compute();
    // cập nhật lại mỗi 5 phút phòng khi qua mốc giờ
    const id = setInterval(compute, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [onTheme]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* lớp gradient */}
      <div
        className="absolute inset-0 transition-[background] duration-1000"
        style={{ background: theme?.gradient ?? "#ffe9f3" }}
        aria-hidden
      />
      {/* lớp sao */}
      {theme && <Stars opacity={theme.starOpacity} />}
      {/* vầng sáng hồng mềm phía trên */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-pink-300/30 blur-3xl"
        aria-hidden
      />
      {/* nội dung */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

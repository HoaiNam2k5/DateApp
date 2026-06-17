"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { STATIONS, type Progress } from "@/lib/game";

// Kích thước hệ toạ độ bản đồ — toạ độ x,y của STATIONS dựa trên đây.
const VB_W = 200;
const VB_H = 420;

// Hình chữ S của Việt Nam (đã đơn giản hoá cho đẹp & nhẹ).
const VN_PATH =
  "M60 28 Q40 40 38 60 Q52 78 50 92 Q46 110 70 124 Q92 140 96 165 " +
  "Q104 185 112 205 Q122 230 116 255 Q108 285 86 312 Q64 332 58 352 " +
  "Q66 372 80 380 Q92 384 96 368 Q110 350 128 338 Q150 322 150 300 " +
  "Q152 278 158 262 Q162 240 150 222 Q140 205 138 192 Q134 175 126 165 " +
  "Q120 150 122 132 Q126 110 138 98 Q150 84 146 70 Q142 56 120 50 " +
  "Q92 44 82 34 Q72 26 60 28 Z";

const pct = (v: number, max: number) => `${(v / max) * 100}%`;

export default function LoveMapVN({ progress }: { progress: Progress | null }) {
  const idx = progress?.stationIndex ?? 0;
  const legPct = progress?.pctToNext ?? 0;
  const [selected, setSelected] = useState<number | null>(null);

  // vị trí "đôi mình" — nội suy giữa cột mốc hiện tại và kế tiếp
  const cur = STATIONS[idx];
  const nxt = STATIONS[idx + 1];
  const coupleX = nxt ? cur.x + (nxt.x - cur.x) * legPct : cur.x;
  const coupleY = nxt ? cur.y + (nxt.y - cur.y) * legPct : cur.y;

  const reachedLine = STATIONS.slice(0, idx + 1).map((s) => `${s.x},${s.y}`).join(" ");
  const futureLine = STATIONS.slice(idx).map((s) => `${s.x},${s.y}`).join(" ");

  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      <div className="relative w-full" style={{ aspectRatio: `${VB_W} / ${VB_H}` }}>
        {/* nền biển + đất liền */}
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fbcfe8" />
              <stop offset="100%" stopColor="#ddd6fe" />
            </linearGradient>
            <linearGradient id="trail" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="100%" stopColor="#fb7185" />
            </linearGradient>
          </defs>

          {/* đất liền Việt Nam */}
          <path
            d={VN_PATH}
            fill="url(#land)"
            stroke="#f9a8d4"
            strokeWidth={2}
            strokeLinejoin="round"
          />

          {/* quần đảo Hoàng Sa & Trường Sa */}
          {[
            { x: 182, y: 172, label: "Hoàng Sa" },
            { x: 172, y: 296, label: "Trường Sa" },
          ].map((isl) => (
            <g key={isl.label}>
              <circle cx={isl.x} cy={isl.y} r={1.4} fill="#f9a8d4" />
              <circle cx={isl.x + 4} cy={isl.y + 3} r={1.1} fill="#f9a8d4" />
              <circle cx={isl.x - 3} cy={isl.y + 4} r={1} fill="#f9a8d4" />
              <text x={isl.x} y={isl.y - 4} textAnchor="middle" fontSize={6} fill="#c084a8">
                {isl.label}
              </text>
            </g>
          ))}

          {/* đường hành trình còn lại (nét đứt) */}
          {futureLine && (
            <polyline
              points={futureLine}
              fill="none"
              stroke="#d4d4d8"
              strokeWidth={2}
              strokeDasharray="4 5"
              strokeLinecap="round"
            />
          )}
          {/* đường đã đi qua */}
          {idx > 0 && (
            <polyline
              points={reachedLine}
              fill="none"
              stroke="url(#trail)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>

        {/* marker các cột mốc (HTML để bấm dễ + animation mượt) */}
        {STATIONS.map((st, i) => {
          const reached = i <= idx;
          const isCurrent = i === idx;
          return (
            <button
              key={st.at}
              onClick={() => setSelected((s) => (s === i ? null : i))}
              style={{ left: pct(st.x, VB_W), top: pct(st.y, VB_H) }}
              className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              aria-label={st.name}
            >
              <motion.span
                animate={isCurrent ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                transition={{ duration: 1.6, repeat: isCurrent ? Infinity : 0, ease: "easeInOut" }}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-base shadow-sm ring-2 sm:h-9 sm:w-9 sm:text-lg ${
                  reached
                    ? "bg-white ring-pink-300"
                    : "bg-zinc-100 text-[13px] opacity-70 ring-zinc-200 grayscale"
                }`}
              >
                {reached ? st.emoji : "🔒"}
              </motion.span>
            </button>
          );
        })}

        {/* "đôi mình" đang ở đâu */}
        <motion.div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full"
          initial={false}
          animate={{ left: pct(coupleX, VB_W), top: pct(coupleY, VB_H) }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        >
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center"
          >
            <span className="rounded-full bg-pink-500 px-1.5 py-0.5 text-sm shadow-md">💑</span>
            <span className="-mt-0.5 text-pink-500">▾</span>
          </motion.div>
        </motion.div>

        {/* bong bóng thông tin khi chạm cột mốc */}
        {selected !== null && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            style={{
              left: pct(STATIONS[selected].x, VB_W),
              top: pct(STATIONS[selected].y, VB_H),
            }}
            className="absolute z-30 w-max max-w-[150px] -translate-x-1/2 translate-y-3 rounded-xl border border-pink-100 bg-white/95 px-2.5 py-1.5 text-center shadow-lg backdrop-blur"
          >
            <p className="text-xs font-semibold text-zinc-700">
              {STATIONS[selected].emoji} {STATIONS[selected].name}
            </p>
            <p className="text-[10px] text-zinc-400">
              {selected <= idx ? "Đã ghé thăm 💞" : `Cần ${STATIONS[selected].at} điểm`}
            </p>
          </motion.div>
        )}
      </div>

      <p className="mt-1 text-center text-[11px] text-zinc-400">Chạm vào địa danh để xem chi tiết 📍</p>
    </div>
  );
}

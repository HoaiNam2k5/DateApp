"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { Flame, MapPin, Trophy, Volume2, VolumeX } from "lucide-react";
import { getUser, type UserName } from "@/lib/user";
import { partnerOf } from "@/lib/dates";
import { supabase } from "@/lib/supabase";
import {
  DAILY_MISSIONS,
  STATIONS,
  computeProgress,
  completeMission,
  getMissionRows,
  todayDoneSet,
  uncompleteMission,
  type MissionRow,
  type Progress,
} from "@/lib/game";
import { isMuted, playDing, playFanfare, playPop, setMuted } from "@/lib/sound";
import Navbar from "@/components/Navbar";
import LoveMapVN from "@/components/LoveMapVN";

export default function GamePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserName | null>(null);
  const [rows, setRows] = useState<MissionRow[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [muted, setMutedState] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const prevStation = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getMissionRows();
      setRows(data);
      setProgress(computeProgress(data));
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.push("/login");
      return;
    }
    setUser(u);
    setMutedState(isMuted());
    load();

    // realtime: cập nhật ngay khi đứa kia tick nhiệm vụ
    const channel = supabase
      .channel("game-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "game_missions" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, load]);

  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // phát hiện vừa đạt cột mốc mới -> confetti + fanfare
  useEffect(() => {
    if (!progress) return;
    if (prevStation.current !== null && progress.stationIndex > prevStation.current) {
      setCelebrate(true);
      playFanfare();
    }
    prevStation.current = progress.stationIndex;
  }, [progress]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  };

  const toggleMission = async (key: string, done: boolean) => {
    if (!user || busy) return;
    setBusy(key);
    try {
      if (done) {
        await uncompleteMission(user, key);
        playPop();
      } else {
        await completeMission(user, key);
        playDing();
      }
      await load();
    } catch {
      /* lỗi mạng — bỏ qua, lần load sau sẽ đồng bộ lại */
    } finally {
      setBusy(null);
    }
  };

  if (!user) return null;

  const done = todayDoneSet(rows, user);
  const doneToday = done.size;
  const partner = partnerOf(user);
  const current = progress ? STATIONS[progress.stationIndex] : STATIONS[0];

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-rose-50 via-pink-50 to-violet-50">
      <Navbar />

      {celebrate && size.w > 0 && (
        <Confetti
          width={size.w}
          height={size.h}
          numberOfPieces={220}
          recycle={false}
          gravity={0.25}
          colors={["#ec4899", "#f472b6", "#fb7185", "#f9a8d4", "#e879f9", "#fda4af"]}
          onConfettiComplete={() => setCelebrate(false)}
          className="!fixed !inset-0 z-[70]"
        />
      )}

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-10 pt-6">
        {/* tiêu đề + tắt/mở tiếng */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-pink-600">🗺️ Bản đồ tình yêu</h1>
            <p className="text-sm text-pink-500/80">Cùng nhau đi hết hành trình nha 💕</p>
          </div>
          <button
            onClick={toggleMute}
            aria-label={muted ? "Bật tiếng" : "Tắt tiếng"}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-pink-200 bg-white/70 text-pink-500 transition-colors hover:bg-pink-50"
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>

        {/* thẻ tổng quan */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <StatCard
            icon={<Trophy size={18} className="text-amber-500" />}
            value={progress ? `${progress.totalPoints}` : "—"}
            label="Điểm yêu"
          />
          <StatCard
            icon={<Flame size={18} className="text-orange-500" />}
            value={progress ? `${progress.streak}` : "—"}
            label="Chuỗi ngày"
          />
          <StatCard
            icon={<MapPin size={18} className="text-pink-500" />}
            value={progress ? `${progress.stationIndex + 1}/${STATIONS.length}` : "—"}
            label="Cột mốc"
          />
        </div>

        {/* tiến độ tới cột mốc kế */}
        {progress && (
          <div className="mt-4 rounded-3xl border border-pink-100 bg-white/70 p-4 backdrop-blur">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-zinc-700">
                {current.emoji} {current.name}
              </span>
              {progress.nextStation ? (
                <span className="text-xs text-zinc-400">
                  còn {progress.legLength - progress.pointsIntoLeg} điểm →{" "}
                  {progress.nextStation.emoji}
                </span>
              ) : (
                <span className="text-xs font-medium text-pink-500">Hoàn thành hành trình! 🎉</span>
              )}
            </div>
            <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-pink-100">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-pink-400 to-rose-500"
                initial={false}
                animate={{ width: `${progress.pctToNext * 100}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />
            </div>
          </div>
        )}

        {/* BẢN ĐỒ VIỆT NAM — hành trình tình yêu */}
        <div className="mt-6 rounded-3xl border border-pink-100 bg-gradient-to-b from-sky-50 to-cyan-50/60 p-3 shadow-sm">
          <LoveMapVN progress={progress} />
        </div>

        {/* NHIỆM VỤ HẰNG NGÀY */}
        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-700">Nhiệm vụ hôm nay</h2>
            <span className="text-xs text-zinc-400">
              {doneToday}/{DAILY_MISSIONS.length} ✓
            </span>
          </div>
          <p className="mb-3 text-xs text-zinc-400">
            Mỗi nhiệm vụ +10 điểm cho hành trình của bạn và {partner} 💞
          </p>

          {!loaded ? (
            <div className="mx-auto mt-4 h-7 w-7 animate-spin rounded-full border-4 border-pink-200 border-t-pink-500" />
          ) : (
            <ul className="flex flex-col gap-2">
              {DAILY_MISSIONS.map((m) => {
                const isDone = done.has(m.key);
                return (
                  <motion.li key={m.key} layout>
                    <button
                      onClick={() => toggleMission(m.key, isDone)}
                      disabled={busy === m.key}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors disabled:opacity-60 ${
                        isDone
                          ? "border-pink-200 bg-pink-50"
                          : "border-zinc-100 bg-white hover:border-pink-200"
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-sm ${
                          isDone
                            ? "border-pink-500 bg-pink-500 text-white"
                            : "border-zinc-300 text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                      <span className="text-lg">{m.emoji}</span>
                      <span
                        className={`flex-1 text-sm ${
                          isDone ? "text-pink-600 line-through" : "text-zinc-700"
                        }`}
                      >
                        {m.label}
                      </span>
                      <span className="text-xs font-medium text-zinc-400">+10</span>
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </div>

        {/* hoạt động gần đây của cả hai */}
        <RecentActivity rows={rows} user={user} />
      </div>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-pink-100 bg-white/70 px-2 py-3 backdrop-blur">
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-lg font-bold text-zinc-800">{value}</span>
      </div>
      <span className="mt-0.5 text-[11px] text-zinc-400">{label}</span>
    </div>
  );
}

function RecentActivity({ rows, user }: { rows: MissionRow[]; user: UserName }) {
  const recent = rows.slice(0, 6);
  if (recent.length === 0) return null;
  const labelOf = (key: string) =>
    DAILY_MISSIONS.find((m) => m.key === key)?.label ?? key;
  return (
    <div className="mt-8">
      <h2 className="mb-2 text-sm font-bold text-zinc-600">Hoạt động gần đây</h2>
      <ul className="flex flex-col gap-1.5">
        <AnimatePresence initial={false}>
          {recent.map((r) => (
            <motion.li
              key={r.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-xs text-zinc-500"
            >
              <span className="text-pink-400">●</span>
              <span className="font-medium text-zinc-600">
                {r.player === user ? "Bạn" : r.player}
              </span>
              <span>hoàn thành “{labelOf(r.mission_key)}”</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

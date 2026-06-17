import { supabase } from "./supabase";
import type { UserName } from "./user";

/* =====================================================================
 *  Mini game "Bản đồ tình yêu" — đồng bộ 2 đứa qua Supabase.
 *
 *  Mô hình: chỉ 1 bảng game_missions (mỗi dòng = 1 nhiệm vụ 1 người tick
 *  trong ngày). Tổng điểm, cột mốc bản đồ và chuỗi (streak) đều SUY RA từ
 *  các dòng đó, nên cả hai máy luôn thấy giống nhau.
 * ===================================================================== */

export const POINTS_PER_MISSION = 10;

/* ---------- Nhiệm vụ hằng ngày (cả hai cùng thấy, mỗi người tự tick) ---------- */

export interface Mission {
  key: string;
  emoji: string;
  label: string;
}

export const DAILY_MISSIONS: Mission[] = [
  { key: "checkin", emoji: "✅", label: "Điểm danh hôm nay" },
  { key: "say_love", emoji: "💕", label: "Nói “thương” với người kia" },
  { key: "bear", emoji: "🐻", label: "Trò chuyện với Bé Gấu" },
  { key: "invite", emoji: "💌", label: "Gửi hoặc mở một lời mời" },
  { key: "photo", emoji: "📸", label: "Thêm một kỷ niệm vào album" },
  { key: "compliment", emoji: "🌷", label: "Khen người kia một câu" },
];

/* ---------- Các cột mốc trên bản đồ Việt Nam (đủ điểm sẽ mở khoá) ----------
 *  Hành trình tình yêu đi dọc đất nước từ Hà Nội xuống Sài Gòn.
 *  x, y là toạ độ trên viewBox bản đồ 200 x 420 (xem components/LoveMapVN.tsx).
 */

export interface Station {
  at: number; // điểm cần để tới cột mốc này
  emoji: string;
  name: string;
  x: number;
  y: number;
}

export const STATIONS: Station[] = [
  { at: 0, emoji: "🏛️", name: "Hà Nội", x: 104, y: 84 },
  { at: 60, emoji: "⛵", name: "Vịnh Hạ Long", x: 142, y: 96 },
  { at: 140, emoji: "🏞️", name: "Phong Nha", x: 116, y: 150 },
  { at: 240, emoji: "🏯", name: "Cố đô Huế", x: 126, y: 170 },
  { at: 360, emoji: "🌉", name: "Đà Nẵng", x: 135, y: 190 },
  { at: 500, emoji: "🏮", name: "Phố cổ Hội An", x: 140, y: 202 },
  { at: 660, emoji: "🏖️", name: "Biển Nha Trang", x: 156, y: 256 },
  { at: 840, emoji: "🌲", name: "Đà Lạt mộng mơ", x: 118, y: 288 },
  { at: 1040, emoji: "🌆", name: "Sài Gòn", x: 96, y: 332 },
];

/* ---------- Bản ghi nhiệm vụ ---------- */

export interface MissionRow {
  id: string;
  player: UserName;
  mission_key: string;
  day: string; // YYYY-MM-DD
  points: number;
  created_at: string;
}

/** Ngày hôm nay theo giờ máy, dạng YYYY-MM-DD (khớp cột date của Supabase). */
export function todayKey(): string {
  return localDateKey(new Date());
}

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* ---------- Truy vấn Supabase ---------- */

export async function getMissionRows(): Promise<MissionRow[]> {
  const { data, error } = await supabase
    .from("game_missions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MissionRow[];
}

export async function completeMission(player: UserName, missionKey: string): Promise<void> {
  // upsert để tránh lỗi nếu lỡ tick 2 lần (đã có unique index)
  const { error } = await supabase
    .from("game_missions")
    .upsert(
      { player, mission_key: missionKey, day: todayKey(), points: POINTS_PER_MISSION },
      { onConflict: "player,mission_key,day" }
    );
  if (error) throw error;
}

export async function uncompleteMission(player: UserName, missionKey: string): Promise<void> {
  const { error } = await supabase
    .from("game_missions")
    .delete()
    .eq("player", player)
    .eq("mission_key", missionKey)
    .eq("day", todayKey());
  if (error) throw error;
}

/* ---------- Suy ra tiến trình từ các dòng nhiệm vụ ---------- */

export interface Progress {
  totalPoints: number;
  stationIndex: number; // cột mốc cao nhất đã đạt
  nextStation: Station | null;
  pointsIntoLeg: number; // điểm đã đi kể từ cột mốc hiện tại
  legLength: number; // tổng điểm của chặng tới cột mốc kế
  pctToNext: number; // 0..1 trong chặng hiện tại
  streak: number; // số ngày liên tiếp (tính tới hôm nay) có hoạt động
}

export function computeProgress(rows: MissionRow[]): Progress {
  const totalPoints = rows.reduce((sum, r) => sum + r.points, 0);

  let stationIndex = 0;
  for (let i = 0; i < STATIONS.length; i++) {
    if (totalPoints >= STATIONS[i].at) stationIndex = i;
  }

  const current = STATIONS[stationIndex];
  const next = STATIONS[stationIndex + 1] ?? null;
  const legLength = next ? next.at - current.at : 0;
  const pointsIntoLeg = totalPoints - current.at;
  const pctToNext = next ? Math.min(1, Math.max(0, pointsIntoLeg / legLength)) : 1;

  return {
    totalPoints,
    stationIndex,
    nextStation: next,
    pointsIntoLeg,
    legLength,
    pctToNext,
    streak: computeStreak(rows),
  };
}

/** Chuỗi ngày liên tiếp có ít nhất 1 nhiệm vụ (của một trong hai đứa). */
function computeStreak(rows: MissionRow[]): number {
  const days = new Set(rows.map((r) => r.day));
  if (days.size === 0) return 0;

  const cursor = new Date();
  // hôm nay chưa làm gì thì vẫn cho phép tính chuỗi tới hết hôm qua
  if (!days.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (days.has(localDateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Tập mission_key mà 1 người đã hoàn thành trong ngày hôm nay. */
export function todayDoneSet(rows: MissionRow[], player: UserName): Set<string> {
  const today = todayKey();
  return new Set(
    rows.filter((r) => r.player === player && r.day === today).map((r) => r.mission_key)
  );
}

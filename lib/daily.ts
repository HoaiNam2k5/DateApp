import { supabase } from "./supabase";
import type { UserName } from "./user";

/* =====================================================================
 *  Câu hỏi gắn kết — mỗi ngày Bé Gấu hỏi 1 câu, cả hai cùng trả lời.
 *  Câu trả lời của người kia chỉ hé lộ sau khi mình đã trả lời.
 * ===================================================================== */

export interface DailyQuestion {
  key: string;
  emoji: string;
  text: string;
}

// Ngân hàng câu hỏi — xoay vòng theo ngày nên hai đứa luôn thấy cùng 1 câu.
export const QUESTIONS: DailyQuestion[] = [
  { key: "q01", emoji: "🥰", text: "Điều cậu thích nhất ở người kia là gì?" },
  { key: "q02", emoji: "🌷", text: "Hôm nay cậu biết ơn điều gì ở chúng mình?" },
  { key: "q03", emoji: "🎬", text: "Kỷ niệm nào của hai đứa khiến cậu cười mỗi khi nhớ lại?" },
  { key: "q04", emoji: "🍜", text: "Nếu được hẹn hò ngay bây giờ, cậu muốn đi đâu?" },
  { key: "q05", emoji: "💌", text: "Một câu cậu luôn muốn nói nhưng hay ngại nói?" },
  { key: "q06", emoji: "✨", text: "Điều nhỏ xíu nào người kia làm khiến cậu thấy được thương?" },
  { key: "q07", emoji: "🏡", text: "Cậu mơ về một buổi tối bên nhau như thế nào?" },
  { key: "q08", emoji: "🎁", text: "Món quà bất ngờ nào cậu muốn được tặng?" },
  { key: "q09", emoji: "🌙", text: "Điều cuối cùng cậu nghĩ tới trước khi ngủ tối qua?" },
  { key: "q10", emoji: "🐻", text: "Nếu chúng mình là hai chú gấu, cậu muốn tụi mình làm gì hôm nay?" },
  { key: "q11", emoji: "💞", text: "Lần gần nhất người kia làm cậu thấy ấm lòng là khi nào?" },
  { key: "q12", emoji: "🌈", text: "Một điều cậu mong hai đứa cùng làm trong năm nay?" },
  { key: "q13", emoji: "☕", text: "Buổi sáng hoàn hảo bên nhau của cậu trông ra sao?" },
  { key: "q14", emoji: "📸", text: "Khoảnh khắc nào cậu ước mình đã chụp lại?" },
  { key: "q15", emoji: "💕", text: "Hôm nay, cậu muốn nói gì với người kia nhất?" },
];

export interface DailyAnswer {
  id: string;
  player: UserName;
  day: string;
  question_key: string;
  answer: string;
  created_at: string;
}

/** Số ngày kể từ mốc cố định — để chọn câu hỏi xoay vòng theo ngày. */
function dayNumber(d: Date): number {
  const epoch = Date.UTC(2024, 0, 1);
  const today = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor((today - epoch) / 86_400_000);
}

export function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Câu hỏi của hôm nay (cả hai đứa thấy giống nhau). */
export function questionOfToday(): DailyQuestion {
  const idx = dayNumber(new Date()) % QUESTIONS.length;
  return QUESTIONS[idx];
}

export function questionByKey(key: string): DailyQuestion | undefined {
  return QUESTIONS.find((q) => q.key === key);
}

/* ---------- Supabase ---------- */

export async function getAnswers(): Promise<DailyAnswer[]> {
  const { data, error } = await supabase
    .from("daily_answers")
    .select("*")
    .order("day", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DailyAnswer[];
}

export async function submitAnswer(
  player: UserName,
  answer: string
): Promise<void> {
  const q = questionOfToday();
  const { error } = await supabase.from("daily_answers").upsert(
    {
      player,
      day: todayKey(),
      question_key: q.key,
      answer,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "player,day" }
  );
  if (error) throw error;
}

/** Câu trả lời hôm nay của một người (nếu có). */
export function todayAnswerOf(rows: DailyAnswer[], player: UserName): DailyAnswer | null {
  const today = todayKey();
  return rows.find((r) => r.player === player && r.day === today) ?? null;
}

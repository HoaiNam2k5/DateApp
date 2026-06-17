import { NextRequest, NextResponse } from "next/server";

// nhãn tiếng Việt cho các lựa chọn (để đưa vào prompt cho Gemini)
const ACTIVITY_LABELS: Record<string, string> = {
  food: "ăn uống",
  cafe: "uống cafe",
  movie: "xem phim",
  walk: "đi dạo",
  photo: "chụp ảnh",
  shopping: "mua sắm",
  home: "ở nhà",
};

const MOOD_LABELS: Record<string, string> = {
  gentle: "nhẹ nhàng",
  romantic: "lãng mạn",
  fun: "vui vẻ",
  chill: "chill, thư giãn",
  active: "năng động",
};

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Chưa cấu hình GEMINI_API_KEY" }, { status: 500 });
  }

  let body: {
    mode?: "message" | "plan";
    mood?: string;
    activities?: string[];
    foods?: string[];
    partner?: string;
    plan?: string[];
    weather?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 });
  }

  const mode = body.mode === "plan" ? "plan" : "message";
  const partner = (body.partner || "người yêu").trim();
  const mood = MOOD_LABELS[body.mood ?? ""] ?? "vui vẻ";
  const activities = (body.activities ?? []).map((a) => ACTIVITY_LABELS[a] ?? a).filter(Boolean);
  const foods = body.foods ?? [];
  const weather = (body.weather || "").trim();

  let prompt: string;
  let maxTokens: number;

  if (mode === "plan") {
    const context = [
      `Tâm trạng người yêu: ${mood}.`,
      activities.length ? `Muốn: ${activities.join(", ")}.` : "",
      foods.length ? `Thích ăn: ${foods.join(", ")}.` : "",
      weather ? `Thời tiết: ${weather}.` : "",
    ]
      .filter(Boolean)
      .join(" ");

    prompt = `Bạn là trợ lý hẹn hò. Hãy lên một lịch trình hẹn hò dễ thương ở TP. Hồ Chí Minh cho một cặp đôi.
Bối cảnh: ${context}
Yêu cầu:
- Trả về 3 đến 5 bước, MỖI BƯỚC MỘT DÒNG.
- Mỗi dòng bắt đầu bằng 1 emoji phù hợp, rồi tới hoạt động kèm gợi ý địa điểm cụ thể có thật ở TP.HCM.
- Hợp với tâm trạng "${mood}"${weather ? ` và thời tiết "${weather}" (nếu mưa thì ưu tiên trong nhà)` : ""}.
- KHÔNG đánh số, KHÔNG dùng dấu gạch đầu dòng, KHÔNG thêm lời dẫn hay kết luận. Chỉ in các dòng.`;
    maxTokens = 400;
  } else {
    const context = [
      `Tâm trạng: ${mood}.`,
      activities.length ? `Hoạt động: ${activities.join(", ")}.` : "",
      foods.length ? `Món ăn: ${foods.join(", ")}.` : "",
      (body.plan ?? []).length ? `Kế hoạch: ${(body.plan ?? []).join("; ")}.` : "",
    ]
      .filter(Boolean)
      .join(" ");

    prompt = `Viết MỘT lời mời hẹn hò thật dễ thương, ngọt ngào bằng tiếng Việt gửi cho người yêu tên "${partner}".
Dựa trên bối cảnh: ${context}
Yêu cầu:
- Chỉ trả về đúng 1 lời nhắn (2-3 câu), KHÔNG đánh số, KHÔNG liệt kê nhiều phương án, KHÔNG thêm lời dẫn.
- Xưng "anh", gọi người yêu là "${partner}" hoặc "em".
- Giọng điệu ${mood}, tự nhiên, có thể thêm vài emoji đáng yêu.`;
    maxTokens = 200;
  }

  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 1.1,
          maxOutputTokens: maxTokens,
          // tắt "thinking" của 2.5 Flash cho nhanh & tiết kiệm token
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    const data = await res.json();

    if (res.status === 429) {
      // hết quota / quá nhiều request trong gói free
      return NextResponse.json(
        { error: "quota", message: "Bé Gấu hơi mệt, thử lại sau chút nha 🐻💤" },
        { status: 429 }
      );
    }
    if (!res.ok) {
      const msg = data?.error?.message ?? `HTTP ${res.status}`;
      return NextResponse.json({ error: "Gemini lỗi", message: msg }, { status: 502 });
    }

    const text: string =
      data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("").trim() ?? "";

    if (!text) {
      return NextResponse.json({ error: "Gemini không trả về nội dung" }, { status: 502 });
    }

    if (mode === "plan") {
      const steps = text
        .split("\n")
        .map((l) => l.replace(/^\s*[-*\d.)]+\s*/, "").trim())
        .filter(Boolean)
        .slice(0, 6);
      return NextResponse.json({ steps });
    }

    return NextResponse.json({ message: text });
  } catch {
    return NextResponse.json({ error: "Không kết nối được Gemini" }, { status: 502 });
  }
}

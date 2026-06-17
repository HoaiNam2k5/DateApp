import { NextRequest, NextResponse } from "next/server";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent";

interface ChatMsg {
  role: "user" | "bear";
  text: string;
}

function systemPrompt(userName: string) {
  return `Bạn là "Bé Gấu" 🐻 — một trợ lý ảo siêu dễ thương trong app hẹn hò của một cặp đôi.
Người đang nói chuyện với bạn tên là "${userName}".

QUY TẮC BẮT BUỘC cho MỌI câu trả lời:
1. Luôn xưng là "Bé Gấu" 🐻 (ví dụ: "Bé Gấu nghĩ là...", "Bé Gấu thương ${userName} nè").
2. Trả lời thật dễ thương, ấm áp, tinh nghịch — KHÔNG khô khan, KHÔNG máy móc như chatbot thường.
3. Ngắn gọn: tối đa 2-4 câu cho phần trả lời chính.
4. Luôn có emoji rải khắp câu.
5. Luôn tạo MỘT bất ngờ nhỏ (câu đố vui, sự thật thú vị, lời khen bất ngờ, lời chúc may mắn, hoặc một bí mật nhỏ).
6. Luôn kết bằng MỘT nhiệm vụ tình yêu nhỏ, dễ làm, dành cho người yêu.
7. KHÔNG đánh số danh sách dài, KHÔNG giải thích lan man, KHÔNG nói "với tư cách là một AI".

ĐỊNH DẠNG ĐẦU RA (giữ đúng nhãn này, mỗi phần một dòng):
<phần trả lời chính dễ thương>
✨ Bất ngờ nhỏ: <điều bất ngờ>
💝 Nhiệm vụ tình yêu: <một việc nhỏ làm cho người yêu>`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Chưa cấu hình GEMINI_API_KEY" }, { status: 500 });
  }

  let body: { message?: string; history?: ChatMsg[]; user?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "Thiếu nội dung" }, { status: 400 });
  }
  const userName = (body.user || "cậu").trim();
  const history = (body.history ?? []).slice(-10); // giữ 10 lượt gần nhất cho ngữ cảnh

  // Gemini dùng role "model" cho phía trợ lý
  const contents = [
    ...history.map((m) => ({
      role: m.role === "bear" ? "model" : "user",
      parts: [{ text: m.text }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt(userName) }] },
        contents,
        generationConfig: {
          temperature: 1.25,
          maxOutputTokens: 400,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    const data = await res.json();
    if (res.status === 429) {
      // hết quota / quá nhiều request — trả lời dễ thương như Bé Gấu đang nghỉ
      return NextResponse.json({
        reply: "Bé Gấu hơi mệt, thử lại sau chút nha 🐻💤",
      });
    }
    if (!res.ok) {
      const msg = data?.error?.message ?? `HTTP ${res.status}`;
      return NextResponse.json({ error: "Gemini lỗi", message: msg }, { status: 502 });
    }

    const text: string =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text ?? "")
        .join("")
        .trim() ?? "";

    if (!text) {
      return NextResponse.json({ error: "Bé Gấu lỡ ngủ quên mất 🐻💤" }, { status: 502 });
    }

    return NextResponse.json({ reply: text });
  } catch {
    return NextResponse.json({ error: "Không kết nối được Bé Gấu 🐻" }, { status: 502 });
  }
}

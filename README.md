# 🐻 DateApp — Love Date Planner

Ứng dụng hẹn hò dễ thương dành riêng cho hai người: lên kế hoạch đi chơi, gửi lời mời, trò chuyện với Bé Gấu AI và cùng nhau đi dọc bản đồ tình yêu Việt Nam.

## ✨ Tính năng

- **Hẹn hò & gợi ý quán** — chọn món, nhận gợi ý địa điểm.
- **Lời mời hẹn hò** 💌 — gửi & phản hồi, đồng bộ realtime.
- **Bé Gấu AI** 🐻 — người bạn nhỏ trò chuyện, tâm sự.
- **Bản đồ tình yêu** 🗺️ — mini game đi dọc Việt Nam qua nhiệm vụ hằng ngày + chuỗi ngày.
- **Câu hỏi gắn kết** 💭 — mỗi ngày một câu, trả lời xong mới thấy câu của người kia.
- **Hũ kỷ niệm** 🫙 — lắc ra một tấm ảnh kỷ niệm ngẫu nhiên.
- **Sổ tay onboarding** 📖 — quyển sổ chào mừng có hiệu ứng mở & lật trang.
- **Album & lịch sử** 📸 — lưu giữ khoảnh khắc của hai đứa.

## 🛠️ Công nghệ

- Next.js 16 · TypeScript · Tailwind CSS v4
- Supabase (Database · Storage · Realtime)
- Framer Motion

## 🚀 Chạy thử

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

Tạo file `.env.local` với khoá Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 🗄️ Cơ sở dữ liệu

Chạy lần lượt trong Supabase SQL Editor:

```
supabase/schema.sql   # bảng cốt lõi (invites, dates) + storage
supabase/game.sql     # mini game bản đồ tình yêu
supabase/daily.sql    # câu hỏi gắn kết hằng ngày
```

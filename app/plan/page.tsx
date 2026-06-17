"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { getUser } from "@/lib/user";
import { addDate } from "@/lib/dates";
import Navbar from "@/components/Navbar";

interface PlanItem {
  text: string;
  query?: string; // tên địa điểm để mở Google Maps (nếu có)
}

// thời tiết hiện tại lấy từ open-meteo (miễn phí, không cần key)
interface Weather {
  temp: number;
  rain: boolean;
  label: string;
  emoji: string;
}

function mapsUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query + " TP.HCM")}`;
}

/* ---------- dữ liệu lựa chọn ---------- */

interface Option {
  id: string;
  label: string;
  emoji: string;
}

const ACTIVITIES: Option[] = [
  { id: "food", label: "Ăn uống", emoji: "🍜" },
  { id: "cafe", label: "Uống cafe", emoji: "☕" },
  { id: "movie", label: "Xem phim", emoji: "🎬" },
  { id: "walk", label: "Đi dạo", emoji: "🌳" },
  { id: "photo", label: "Chụp ảnh", emoji: "📷" },
  { id: "shopping", label: "Mua sắm", emoji: "🛍️" },
  { id: "home", label: "Ở nhà", emoji: "🏠" },
];

type MoodId = "gentle" | "romantic" | "fun" | "chill" | "active";

const MOODS: (Option & { id: MoodId; intro: string })[] = [
  { id: "gentle", label: "Nhẹ nhàng", emoji: "🌸", intro: "Một ngày nhẹ nhàng bên nhau" },
  { id: "romantic", label: "Lãng mạn", emoji: "✨", intro: "Hẹn hò lãng mạn nè" },
  { id: "fun", label: "Vui vẻ", emoji: "🤣", intro: "Hôm nay quẩy cho vui nha" },
  { id: "chill", label: "Chill", emoji: "😌", intro: "Thư giãn chill chill thôi" },
  { id: "active", label: "Năng động", emoji: "🎉", intro: "Năng động hết mình nào" },
];

const FOODS: Option[] = [
  { id: "sushi", label: "Sushi", emoji: "🍣" },
  { id: "pizza", label: "Pizza", emoji: "🍕" },
  { id: "lau", label: "Lẩu", emoji: "🍲" },
  { id: "bbq", label: "BBQ", emoji: "🥩" },
  { id: "bun", label: "Bún", emoji: "🍜" },
  { id: "com", label: "Cơm", emoji: "🍛" },
  { id: "trasua", label: "Trà sữa", emoji: "🧋" },
  { id: "banhngot", label: "Bánh ngọt", emoji: "🍰" },
];

// quán gợi ý theo từng món (khu vực TP. Hồ Chí Minh)
const FOOD_SPOTS: Record<string, string[]> = {
  sushi: [
    "Sushi Hokkaido Sachi", "Tokyo Deli", "Sushi Kei", "Chiyoda Sushi",
    "Sushi Tei", "Daruma Sushi", "Sushi World", "Kissho Sushi",
    "Hokkaido Marche", "Sushi Rei",
  ],
  pizza: [
    "Pizza 4P's", "The Pizza Company", "Domino's Pizza", "Pizza Hut",
    "Cosa Nostra", "Pendolasco", "Al Fresco's", "Pizza Belga",
    "Don's Pizza", "Capricciosa",
  ],
  lau: [
    "Lẩu Hắc Quán", "Kichi Kichi", "Manwah", "Ashima Mushroom Hotpot",
    "Haidilao", "Lẩu Dê 35", "Lẩu Bò Sài Gòn", "Coca Suki",
    "Lẩu Wang", "Lẩu Phan",
  ],
  bbq: [
    "Gogi House", "King BBQ", "Sumo BBQ", "Meat Plus",
    "Seoul Garden", "Hwang Geum BBQ", "Gyu Kaku", "H3 BBQ",
    "Dolpan Sam", "Bulgogi Brothers",
  ],
  bun: [
    "Bún bò Gánh", "Bún đậu Homemade", "Bún chả Hà Nội", "Bún riêu Gánh",
    "Bún bò Huế Đông Ba", "Bún mắm 444", "Bún thịt nướng Chị Tuyền",
    "Bún cá Châu Đốc", "Bún ốc Bắc", "Bún đậu Cô Khàn",
  ],
  com: [
    "Cơm tấm Ba Ghiền", "Cơm niêu Sài Gòn", "Cơm gà Xối Mỡ", "Cơm tấm Cali",
    "Cơm tấm Phúc Lộc Thọ", "Cơm gà Hải Nam", "Cơm Bắc Hải",
    "Cơm tấm Bụi Sài Gòn", "Cơm chay Hoan Hỷ", "Cơm Thố Anh Nguyễn",
  ],
  trasua: [
    "Phúc Long", "Gong Cha", "KOI Thé", "TocoToco", "The Alley",
    "Bobapop", "DingTea", "Royaltea", "Hot & Cold", "Maycha",
  ],
  banhngot: [
    "Tous les Jours", "Paris Baguette", "ABC Bakery", "Le Castella",
    "Theera Healthy Bakery", "Givral", "Brodard", "Đức Phát Bakery",
    "Maison Marou", "Cộng Cà Phê (bánh)",
  ],
};

// gợi ý địa điểm theo hoạt động — có biến thể theo tâm trạng (mood)
const PLACE_POOL: Record<string, { base: string[]; byMood?: Partial<Record<MoodId, string[]>> }> = {
  cafe: {
    base: [
      "Katinat", "The Coffee House", "Highlands Coffee", "Phúc Long", "Cộng Cà Phê",
      "Trung Nguyên Legend", "Passio Coffee", "Guta Cafe", "Aha Cafe", "Milano Coffee",
    ],
    byMood: {
      romantic: [
        "The Workshop Coffee", "Là Việt Coffee", "Bosgaurus Coffee", "Okkio Caffe",
        "Shin Heritage", "The Married Beans", "Maison Marou", "Runam Bistro",
      ],
      chill: [
        "Nhà Của Thời Thơ Ấu", "Thinker & Dreamer", "Partea Saigon", "Lacàph",
        "The Hidden Elephant", "Cheo Coffee", "Hết Cà Phê", "Năm Cafe",
      ],
      active: ["Starbucks Reserve", "%Arabica", "Phê La", "The Coffee Bean & Tea Leaf", "Cộng Cà Phê (rooftop)"],
      gentle: ["Mặt Trời Bé Con", "An Cafe", "Tranquil Books & Coffee", "Nhã Coffee", "Slow & Chill"],
      fun: ["Trill Rooftop Cafe", "Saigon Oi Cafe", "Boo Coffee", "Sài Gòn Cafe Apartment", "The Yard"],
    },
  },
  movie: {
    base: [
      "CGV Vincom", "Lotte Cinema", "Galaxy Nguyễn Du", "BHD Star Bitexco", "Mega GS Cao Thắng",
      "CGV Crescent Mall", "Galaxy Sala", "BHD Star Vincom 3/2", "CGV Aeon Tân Phú", "Lotte Cinema Nam Sài Gòn",
    ],
  },
  walk: {
    base: [
      "phố đi bộ Nguyễn Huệ", "công viên Tao Đàn", "bờ kè kênh Nhiêu Lộc", "công viên bến Bạch Đằng", "hồ Con Rùa",
      "đường sách Nguyễn Văn Bình", "công viên Lê Thị Riêng", "phố đi bộ Bùi Viện",
    ],
    byMood: {
      romantic: ["cầu Ánh Sao Phú Mỹ Hưng", "bến Bạch Đằng ngắm hoàng hôn", "Landmark 81 SkyView", "du thuyền sông Sài Gòn", "cầu Thủ Thiêm 2 về đêm"],
      active: ["phố Tây Bùi Viện", "công viên 23/9", "Thảo Cầm Viên", "phố đi bộ Nguyễn Huệ", "chợ đêm Bến Thành"],
      gentle: ["công viên Lê Văn Tám", "vườn hoa Tao Đàn", "công viên Gia Định", "công viên Hoàng Văn Thụ"],
      chill: ["The Deck Saigon ven sông", "công viên Vinhomes Central Park", "hồ bán nguyệt Crescent Lake", "bờ sông Thủ Thiêm"],
      fun: ["phố đi bộ Bùi Viện về đêm", "chợ Hồ Thị Kỷ ăn vặt", "phố lồng đèn Lương Nhữ Học"],
    },
  },
  photo: {
    base: [
      "Bưu điện Thành phố", "Nhà thờ Đức Bà", "phố đi bộ Nguyễn Huệ", "Dinh Độc Lập",
      "chợ Bến Thành", "Bảo tàng Mỹ thuật TP.HCM", "phố Tây Bùi Viện",
    ],
    byMood: {
      romantic: ["cầu Mống về đêm", "Landmark 81", "hồ Bán Nguyệt Phú Mỹ Hưng", "Saigon Skydeck Bitexco", "cầu Ba Son"],
      fun: ["phố tường vẽ Hào Sĩ Phường", "chung cư 42 Nguyễn Huệ", "Khu phố cổ Chợ Lớn", "The Cafe Apartment", "phố lồng đèn Quận 5"],
      gentle: ["đường sách Nguyễn Văn Bình", "công viên Tao Đàn", "Bảo tàng Áo Dài", "Thảo Điền yên bình"],
      chill: ["The Deck ven sông", "rooftop ngắm thành phố", "công viên bến Bạch Đằng"],
      active: ["chợ Bến Thành", "phố đi bộ Bùi Viện", "Thảo Cầm Viên"],
    },
  },
  shopping: {
    base: [
      "Vincom Đồng Khởi", "Takashimaya", "Aeon Mall Tân Phú", "Saigon Centre", "Vạn Hạnh Mall",
      "Vincom Landmark 81", "Gigamall Thủ Đức", "SC VivoCity", "Parkson Saigontourist",
    ],
    byMood: {
      active: ["Saigon Square", "chợ Bến Thành", "The New Playground", "chợ Tân Định", "Taka Plaza"],
      chill: ["Diamond Plaza", "Estella Place", "Crescent Mall", "Hùng Vương Plaza"],
      fun: ["The New Playground Lê Lai", "chợ Hồ Thị Kỷ", "phố đi bộ mua sắm Nguyễn Trãi"],
      gentle: ["nhà sách Fahasa", "Artbook", "đường sách Nguyễn Văn Bình"],
      romantic: ["Diamond Plaza", "Union Square", "Saigon Centre"],
    },
  },
  home: {
    base: [
      "nấu một bữa tối nho nhỏ", "cuộn chăn xem phim", "chơi board game", "làm bánh cùng nhau",
      "cùng pha cà phê tự tay", "trồng vài chậu cây nhỏ", "vẽ tranh cho nhau",
    ],
    byMood: {
      romantic: ["thắp nến ăn tối lãng mạn", "xem phim tình cảm cùng nhau", "cùng cắm hoa, nghe nhạc"],
      fun: ["chơi game đối kháng", "hát karaoke tại nhà", "thi nấu ăn cùng nhau", "chơi Uno/board game"],
      chill: ["pha trà, nghe nhạc nhẹ", "đắp mặt nạ thư giãn cho nhau", "nằm xem series cả buổi"],
      gentle: ["đọc sách cho nhau nghe", "cùng nhau xếp hình puzzle", "ôn lại album ảnh kỷ niệm"],
      active: ["tập yoga đôi", "thử công thức nấu ăn mới", "dọn nhà & decor cùng nhau"],
    },
  },
};

const rand = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// lấy 1 gợi ý theo hoạt động, ưu tiên trộn thêm lựa chọn hợp mood
function pickPlace(activity: string, mood: MoodId | ""): string {
  const pool = PLACE_POOL[activity];
  if (!pool) return "";
  const moodList = (mood && pool.byMood?.[mood]) || [];
  return rand([...pool.base, ...moodList]);
}

/* ---------- animation ---------- */

const stepVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

const listContainer = {
  show: { transition: { staggerChildren: 0.05 } },
};
const listItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

/* ---------- component ---------- */

type Step = "invite" | "activities" | "mood" | "food" | "result";

export default function PlanPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("invite");
  const [activities, setActivities] = useState<string[]>([]);
  const [mood, setMood] = useState<MoodId | "">("");
  const [foods, setFoods] = useState<string[]>([]);
  const [plan, setPlan] = useState<PlanItem[]>([]);
  const [planByAI, setPlanByAI] = useState(false);
  const [rerollKey, setRerollKey] = useState(0);
  const [saving, setSaving] = useState(false);

  // thời tiết
  const [weather, setWeather] = useState<Weather | null>(null);

  // AI tự lên kế hoạch
  const [aiPlanLoading, setAiPlanLoading] = useState(false);

  // AI: lời mời dễ thương do Gemini viết
  const [aiMessage, setAiMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [copied, setCopied] = useState(false);

  // nút "lười" chạy trốn khi định bấm 😝
  const [dodge, setDodge] = useState({ x: 0, y: 0 });
  const [dodgeCount, setDodgeCount] = useState(0);
  const TAUNTS = ["Hông cho lười đâu 😝", "Bắt được nè 🤭", "Chạy đâu cho thoát 😆", "Đi chơi điii 🥺", "Hết đường rồi nha 😚"];

  const runAway = () => {
    const pick = (min: number, max: number) =>
      (Math.random() < 0.5 ? -1 : 1) * (min + Math.random() * (max - min));
    setDodge({ x: pick(70, 150), y: pick(50, 160) });
    setDodgeCount((c) => c + 1);
  };

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const wantsFood = activities.includes("food");
  const moodMeta = MOODS.find((m) => m.id === mood);

  /* tạo (hoặc đổi) gợi ý kế hoạch theo thứ tự tự nhiên của buổi hẹn */
  const buildPlan = () => {
    const order = ["food", "cafe", "movie", "shopping", "walk", "photo", "home"];
    const chosenFoods = FOODS.filter((f) => foods.includes(f.id));
    const items: PlanItem[] = [];

    for (const id of order) {
      if (!activities.includes(id)) continue;
      switch (id) {
        case "food":
          if (chosenFoods.length) {
            const f = chosenFoods[0];
            const spot = FOOD_SPOTS[f.id] ? rand(FOOD_SPOTS[f.id]) : null;
            items.push({
              text: `${f.emoji} Ăn ${chosenFoods.map((x) => x.label).join(" + ")}${spot ? ` tại ${spot}` : ""}`,
              query: spot ?? undefined,
            });
          } else {
            items.push({ text: "🍜 Kiếm gì đó ngon ngon ăn" });
          }
          break;
        case "cafe": {
          const p = pickPlace("cafe", mood);
          items.push({ text: `☕ Ghé ${p}`, query: p });
          break;
        }
        case "movie": {
          const p = pickPlace("movie", mood);
          items.push({ text: `🎬 Xem phim ở ${p}`, query: p });
          break;
        }
        case "shopping": {
          const p = pickPlace("shopping", mood);
          items.push({ text: `🛍️ Lượn ${p}`, query: p });
          break;
        }
        case "walk": {
          const p = pickPlace("walk", mood);
          items.push({ text: `🌇 Đi dạo ${p}`, query: p });
          break;
        }
        case "photo": {
          const p = pickPlace("photo", mood);
          items.push({ text: `📷 Chụp ${rand([3, 5, 7])} tấm hình ở ${p}`, query: p });
          break;
        }
        case "home":
          items.push({ text: `🏠 Về nhà ${pickPlace("home", mood)}` });
          break;
      }
    }
    setPlan(items);
    setPlanByAI(false);
    setRerollKey((k) => k + 1);
  };

  // lấy thời tiết TP.HCM (open-meteo, miễn phí)
  const fetchWeather = async () => {
    try {
      const res = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=10.78&longitude=106.70&current=temperature_2m,weather_code"
      );
      const data = await res.json();
      const code: number = data?.current?.weather_code ?? 0;
      const temp = Math.round(data?.current?.temperature_2m ?? 0);
      // weather_code >= 51 là mưa phùn/mưa/dông
      const rain = code >= 51;
      let emoji = "☀️", label = "Trời nắng đẹp";
      if (code === 0) { emoji = "☀️"; label = "Trời quang"; }
      else if (code <= 3) { emoji = "⛅"; label = "Có mây"; }
      else if (code <= 48) { emoji = "🌫️"; label = "Sương mù"; }
      else if (code <= 67) { emoji = "🌧️"; label = "Có mưa"; }
      else if (code <= 82) { emoji = "🌦️"; label = "Mưa rào"; }
      else { emoji = "⛈️"; label = "Mưa dông"; }
      setWeather({ temp, rain, label, emoji });
    } catch {
      setWeather(null);
    }
  };

  // AI (Gemini) tự lên cả kế hoạch
  const generateAIPlan = async () => {
    setAiPlanLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "plan",
          mood,
          activities,
          foods: FOODS.filter((f) => foods.includes(f.id)).map((f) => f.label),
          weather: weather ? `${weather.label}, ${weather.temp}°C` : "",
        }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.steps) && data.steps.length) {
        setPlan(data.steps.map((s: string) => ({ text: s })));
        setPlanByAI(true);
        setRerollKey((k) => k + 1);
      }
    } catch {
      /* giữ nguyên kế hoạch cũ nếu lỗi */
    } finally {
      setAiPlanLoading(false);
    }
  };

  const goResult = () => {
    buildPlan();
    setAiMessage("");
    setAiError("");
    setWeather(null);
    fetchWeather();
    setStep("result");
  };

  // gọi Gemini viết lời mời dễ thương
  const generateMessage = async () => {
    const user = getUser();
    const partner = user === "Nam" ? "Trúc Anh" : "Nam";
    setAiLoading(true);
    setAiError("");
    setCopied(false);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partner,
          mood,
          activities,
          foods: FOODS.filter((f) => foods.includes(f.id)).map((f) => f.label),
          plan: plan.map((p) => p.text),
        }),
      });
      const data = await res.json();
      if (!res.ok) setAiError(data.message || data.error || "Có lỗi xảy ra");
      else setAiMessage(data.message);
    } catch {
      setAiError("Không kết nối được");
    } finally {
      setAiLoading(false);
    }
  };

  const copyMessage = () => {
    navigator.clipboard?.writeText(aiMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // pháo giấy + âm thanh khi chốt kèo 🎉
  const celebrate = () => {
    confetti({ particleCount: 120, spread: 75, origin: { y: 0.7 }, colors: ["#ec4899", "#f472b6", "#fbcfe8", "#fff"] });
    setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0 } }), 200);
    setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1 } }), 200);
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ac = new Ctx();
      [523, 659, 784, 1047].forEach((freq, i) => {
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = "sine";
        o.frequency.value = freq;
        o.connect(g);
        g.connect(ac.destination);
        const t = ac.currentTime + i * 0.12;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
        o.start(t);
        o.stop(t + 0.26);
      });
    } catch { /* trình duyệt không hỗ trợ âm thanh thì bỏ qua */ }
  };

  const handleConfirm = async () => {
    const user = getUser();
    if (!user) { router.push("/login"); return; }
    setSaving(true);
    celebrate();
    try {
      await addDate({
        created_by: user,
        foods: FOODS.filter((f) => foods.includes(f.id)).map((f) => f.label),
        title: `${moodMeta?.emoji ?? "💕"} ${moodMeta?.intro ?? "Kế hoạch hẹn hò"}`,
        plan: plan.map((p) => p.text).join(" · "),
      });
    } catch {
      /* nếu lưu lỗi vẫn cho qua trang lịch sử */
    }
    setTimeout(() => router.push("/history"), 1200);
  };

  const restart = () => {
    setActivities([]); setMood(""); setFoods([]); setPlan([]);
    setPlanByAI(false); setWeather(null);
    setStep("invite");
  };

  /* ---------- UI ---------- */

  return (
    <div className="flex min-h-screen flex-col bg-pink-50">
      <Navbar />
      <div className="flex flex-1 flex-col items-center px-4 py-8">
        <AnimatePresence mode="wait">
          {/* B1: lời rủ */}
          {step === "invite" && (
            <motion.div
              key="invite"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex flex-1 flex-col items-center justify-center gap-6 text-center"
            >
              <motion.span
                className="text-7xl"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
              >
                ❤️
              </motion.span>
              <h1 className="text-2xl font-bold text-pink-600">Hôm nay mình đi chơi hongggg?</h1>

              {dodgeCount > 0 && (
                <motion.p
                  key={dodgeCount}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-sm font-medium text-pink-400"
                >
                  {TAUNTS[(dodgeCount - 1) % TAUNTS.length]}
                </motion.p>
              )}

              <div className="relative flex w-64 flex-col items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep("activities")}
                  className="h-12 w-full rounded-full bg-pink-500 font-semibold text-white text-lg shadow-sm hover:bg-pink-600"
                >
                  Đồng ý 🥰
                </motion.button>
                <motion.button
                  type="button"
                  animate={dodge}
                  transition={{ type: "spring", stiffness: 500, damping: 18 }}
                  onMouseEnter={runAway}
                  onPointerDown={(e) => { e.preventDefault(); runAway(); }}
                  onClick={(e) => { e.preventDefault(); runAway(); }}
                  className="h-12 w-full rounded-full bg-white border border-zinc-200 font-medium text-zinc-500"
                >
                  Hôm nay em lười 😴
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* B2: chọn hoạt động */}
          {step === "activities" && (
            <motion.div
              key="activities"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full max-w-md"
            >
              <StepHeader title="Hôm nay em muốn gì nè?" subtitle="Chọn một hoặc nhiều mục" />
              <motion.div variants={listContainer} initial="hidden" animate="show" className="grid grid-cols-2 gap-3">
                {ACTIVITIES.map((a) => (
                  <CheckCard
                    key={a.id}
                    option={a}
                    checked={activities.includes(a.id)}
                    onClick={() => toggle(activities, setActivities, a.id)}
                  />
                ))}
              </motion.div>
              <NavButtons
                onBack={() => setStep("invite")}
                onNextOverride={() => setStep("mood")}
                nextDisabled={activities.length === 0}
              />
            </motion.div>
          )}

          {/* B3: chọn mood */}
          {step === "mood" && (
            <motion.div
              key="mood"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full max-w-md"
            >
              <StepHeader title="Hôm nay em đang thích kiểu nào?" subtitle="Chọn một tâm trạng 💕" />
              <motion.div variants={listContainer} initial="hidden" animate="show" className="flex flex-col gap-3">
                {MOODS.map((m) => (
                  <motion.button
                    key={m.id}
                    variants={listItem}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setMood(m.id)}
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${
                      mood === m.id ? "border-pink-400 bg-pink-100" : "border-zinc-200 bg-white hover:border-pink-200"
                    }`}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="font-semibold text-zinc-800">{m.label}</span>
                  </motion.button>
                ))}
              </motion.div>
              <NavButtons
                onBack={() => setStep("activities")}
                onNextOverride={() => (wantsFood ? setStep("food") : goResult())}
                nextDisabled={!mood}
              />
            </motion.div>
          )}

          {/* B4: chọn món (nếu có) */}
          {step === "food" && (
            <motion.div
              key="food"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full max-w-md"
            >
              <StepHeader title="Em muốn ăn gì nè?" subtitle="Chọn một hoặc nhiều món 🍽️" />
              <motion.div variants={listContainer} initial="hidden" animate="show" className="grid grid-cols-2 gap-3">
                {FOODS.map((f) => (
                  <CheckCard
                    key={f.id}
                    option={f}
                    checked={foods.includes(f.id)}
                    onClick={() => toggle(foods, setFoods, f.id)}
                  />
                ))}
              </motion.div>
              <NavButtons onBack={() => setStep("mood")} onNextOverride={goResult} />
            </motion.div>
          )}

          {/* B5: gợi ý kế hoạch */}
          {step === "result" && (
            <motion.div
              key="result"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full max-w-md"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rounded-3xl border-2 border-pink-300 bg-white p-6 shadow-sm"
              >
                <h1 className="text-center text-xl font-bold text-pink-600">💕 Kế hoạch hôm nay nè</h1>
                {moodMeta && (
                  <p className="mt-1 text-center text-sm text-zinc-400">
                    {moodMeta.emoji} {moodMeta.intro}
                  </p>
                )}

                {/* thời tiết */}
                {weather && (
                  <div className="mt-3 flex flex-col items-center gap-1">
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-600">
                      {weather.emoji} {weather.label} · {weather.temp}°C
                    </span>
                    {weather.rain && (
                      <span className="text-[11px] text-amber-500">☔ Trời có thể mưa, cân nhắc hoạt động trong nhà nha</span>
                    )}
                  </div>
                )}

                {planByAI && (
                  <p className="mt-3 text-center text-[11px] font-medium text-pink-400">✨ Kế hoạch do AI gợi ý</p>
                )}

                <motion.div
                  key={rerollKey}
                  variants={listContainer}
                  initial="hidden"
                  animate="show"
                  className="mt-4 flex flex-col gap-3"
                >
                  {plan.map((item, i) => (
                    <motion.div
                      key={i}
                      variants={listItem}
                      className="flex items-center justify-between gap-2 rounded-2xl bg-pink-50 px-4 py-3 text-zinc-700"
                    >
                      <span className="min-w-0 flex-1">{item.text}</span>
                      {item.query && (
                        <a
                          href={mapsUrl(item.query)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 rounded-full bg-white border border-pink-200 px-2.5 py-1 text-[11px] font-medium text-pink-500 hover:bg-pink-100"
                        >
                          🗺️ Chỉ đường
                        </a>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              {/* lời mời dễ thương do AI viết */}
              <div className="mt-4">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={generateMessage}
                  disabled={aiLoading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-pink-200 bg-white font-medium text-pink-500 hover:bg-pink-50 disabled:opacity-60"
                >
                  {aiLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-pink-200 border-t-pink-500" />
                      Đang nghĩ lời ngọt...
                    </>
                  ) : aiMessage ? (
                    "Viết lời khác 💌"
                  ) : (
                    "Viết lời mời dễ thương 💌"
                  )}
                </motion.button>

                {aiError && <p className="mt-2 text-center text-xs text-red-500">{aiError}</p>}

                <AnimatePresence>
                  {aiMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-3 rounded-2xl border border-pink-200 bg-pink-50/60 p-4"
                    >
                      <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-700">{aiMessage}</p>
                      <button
                        onClick={copyMessage}
                        className="mt-2 text-xs font-medium text-pink-500 hover:underline"
                      >
                        {copied ? "Đã copy ✓" : "Copy lời nhắn"}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-5 flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleConfirm}
                  disabled={saving}
                  className="h-12 rounded-full bg-pink-500 font-semibold text-white text-lg shadow-sm hover:bg-pink-600 disabled:opacity-50"
                >
                  {saving ? "Đang lưu..." : "Chốt kèo ❤️"}
                </motion.button>
                <div className="flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.95, rotate: -3 }}
                    onClick={buildPlan}
                    className="h-11 flex-1 rounded-full bg-white border border-pink-200 font-medium text-pink-500 hover:bg-pink-50"
                  >
                    Đổi gợi ý 🎲
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={generateAIPlan}
                    disabled={aiPlanLoading}
                    className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-violet-400 to-pink-400 font-medium text-white disabled:opacity-60"
                  >
                    {aiPlanLoading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    ) : (
                      "✨ AI lên kế hoạch"
                    )}
                  </motion.button>
                </div>
                <button onClick={restart} className="text-sm text-zinc-400 hover:text-pink-500">
                  Làm lại từ đầu
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ---------- UI phụ ---------- */

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5 text-center">
      <h1 className="text-xl font-bold text-pink-600">❤️ {title}</h1>
      <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
    </div>
  );
}

function CheckCard({
  option,
  checked,
  onClick,
}: {
  option: Option;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      variants={listItem}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative flex items-center gap-2 rounded-2xl border p-4 text-left transition-colors ${
        checked ? "border-pink-400 bg-pink-100" : "border-zinc-200 bg-white hover:border-pink-200"
      }`}
    >
      <span className="text-2xl">{option.emoji}</span>
      <span className="font-medium text-zinc-800">{option.label}</span>
      {checked && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-[11px] text-white"
        >
          ✓
        </motion.span>
      )}
    </motion.button>
  );
}

function NavButtons({
  onBack,
  onNextOverride,
  nextDisabled,
}: {
  onBack: () => void;
  onNextOverride: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <div className="mt-6 flex gap-3">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onBack}
        className="h-11 flex-1 rounded-full bg-white border border-zinc-200 font-medium text-zinc-500 hover:bg-zinc-50"
      >
        ← Quay lại
      </motion.button>
      <motion.button
        whileHover={!nextDisabled ? { scale: 1.02 } : undefined}
        whileTap={!nextDisabled ? { scale: 0.95 } : undefined}
        onClick={onNextOverride}
        disabled={nextDisabled}
        className="h-11 flex-[2] rounded-full bg-pink-500 font-semibold text-white hover:bg-pink-600 disabled:opacity-40"
      >
        Tiếp tục →
      </motion.button>
    </div>
  );
}

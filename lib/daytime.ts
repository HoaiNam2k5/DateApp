// Phân loại thời điểm trong ngày để đổi gradient / lời chào / nền sao
export type DayPeriod = "morning" | "afternoon" | "evening" | "night";

export interface PeriodTheme {
  period: DayPeriod;
  greeting: string;
  // gradient nền (hồng pastel, đổi theo giờ)
  gradient: string;
  // độ hiện của sao (0 = ẩn, 1 = rõ) — tối thì sao rõ hơn
  starOpacity: number;
  // tên icon lucide tương ứng
  icon: "Sun" | "CloudSun" | "Sunset" | "Moon";
}

export function periodOf(hour: number): DayPeriod {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 16) return "afternoon";
  if (hour >= 16 && hour < 19) return "evening";
  return "night";
}

const THEMES: Record<DayPeriod, Omit<PeriodTheme, "period">> = {
  morning: {
    greeting: "Chào buổi sáng",
    gradient: "linear-gradient(160deg, #fff1f6 0%, #ffe3ef 40%, #ffe9d6 100%)",
    starOpacity: 0.15,
    icon: "Sun",
  },
  afternoon: {
    greeting: "Chào buổi trưa",
    gradient: "linear-gradient(160deg, #ffe9f3 0%, #fbe0ff 45%, #e7e9ff 100%)",
    starOpacity: 0.1,
    icon: "CloudSun",
  },
  evening: {
    greeting: "Chào buổi chiều",
    gradient: "linear-gradient(160deg, #ffd9e6 0%, #ffc6c9 40%, #c9a7ff 100%)",
    starOpacity: 0.55,
    icon: "Sunset",
  },
  night: {
    greeting: "Chào buổi tối",
    gradient: "linear-gradient(160deg, #3a2150 0%, #5b2a63 45%, #8e3b6e 100%)",
    starOpacity: 1,
    icon: "Moon",
  },
};

export function themeOf(hour: number): PeriodTheme {
  const period = periodOf(hour);
  return { period, ...THEMES[period] };
}

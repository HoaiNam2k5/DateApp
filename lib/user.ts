const USER_KEY = "ldp_user";
const HISTORY_KEY = "ldp_history";

export type UserName = "Nam" | "Trúc Anh";

export interface HistoryItem {
  id: string;
  created_at: string;
  user: UserName;
  foods: string[];
  place_name: string;
  place_address: string;
}

export function getUser(): UserName | null {
  if (typeof window === "undefined") return null;
  return (localStorage.getItem(USER_KEY) as UserName) ?? null;
}

export function setUser(name: UserName) {
  localStorage.setItem(USER_KEY, name);
}

export function clearUser() {
  localStorage.removeItem(USER_KEY);
}

/* ---------- Onboarding (sổ tay Bé Gấu, hiện lần đầu cho mỗi người) ---------- */

function onboardKey(user: UserName) {
  return user === "Nam" ? "ldp_onboarded_nam" : "ldp_onboarded_trucanh";
}

export function hasOnboarded(user: UserName): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(onboardKey(user)) === "1";
}

export function setOnboarded(user: UserName) {
  localStorage.setItem(onboardKey(user), "1");
}

export function getHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function addHistory(entry: Omit<HistoryItem, "id" | "created_at">) {
  const items = getHistory();
  items.unshift({
    ...entry,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

function avatarKey(user: UserName) {
  return user === "Nam" ? "ldp_avatar_nam" : "ldp_avatar_trucanh";
}

export function getAvatar(user: UserName): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(avatarKey(user));
}

export function setAvatar(user: UserName, url: string) {
  localStorage.setItem(avatarKey(user), url);
}

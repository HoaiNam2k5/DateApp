import { supabase } from "./supabase";
import type { UserName } from "./user";

/* ---------- Lịch sử hẹn hò (dùng chung qua Supabase) ---------- */

export interface DateRecord {
  id: string;
  created_at: string;
  created_by: UserName;
  foods: string[];
  title: string;
  plan: string;
}

export async function addDate(entry: {
  created_by: UserName;
  foods: string[];
  title: string;
  plan: string;
}): Promise<void> {
  const { error } = await supabase.from("dates").insert(entry);
  if (error) throw error;
}

export async function getDates(): Promise<DateRecord[]> {
  const { data, error } = await supabase
    .from("dates")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DateRecord[];
}

export async function deleteDate(id: string): Promise<void> {
  const { error } = await supabase.from("dates").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- Lời mời hẹn hò ---------- */

export type InviteStatus = "pending" | "accepted" | "declined";

export interface Invite {
  id: string;
  created_at: string;
  from_user: UserName;
  to_user: UserName;
  message: string | null;
  date_time: string | null;
  status: InviteStatus;
}

export function partnerOf(user: UserName): UserName {
  return user === "Nam" ? "Trúc Anh" : "Nam";
}

export async function createInvite(entry: {
  from_user: UserName;
  to_user: UserName;
  message: string;
  date_time: string;
}): Promise<void> {
  const { error } = await supabase.from("invites").insert({ ...entry, status: "pending" });
  if (error) throw error;
}

export async function getInvites(): Promise<Invite[]> {
  const { data, error } = await supabase
    .from("invites")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Invite[];
}

export async function respondInvite(id: string, status: InviteStatus): Promise<void> {
  const { error } = await supabase.from("invites").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteInvite(id: string): Promise<void> {
  const { error } = await supabase.from("invites").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- Quản trị (chỉ Nam) ---------- */

// Xóa toàn bộ dữ liệu của cả 2 bảng. neq id sentinel = match mọi dòng.
const ALL_ROWS = "00000000-0000-0000-0000-000000000000";

export async function wipeAllData(): Promise<void> {
  const inv = await supabase.from("invites").delete().neq("id", ALL_ROWS);
  if (inv.error) throw inv.error;
  const dt = await supabase.from("dates").delete().neq("id", ALL_ROWS);
  if (dt.error) throw dt.error;
}

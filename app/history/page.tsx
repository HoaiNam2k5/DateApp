"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/user";
import { getDates, type DateRecord } from "@/lib/dates";
import Navbar from "@/components/Navbar";

export default function HistoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<DateRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getUser()) { router.push("/login"); return; }
    getDates()
      .then(setItems)
      .catch(() => setError("Không tải được lịch sử (kiểm tra bảng Supabase)"))
      .finally(() => setLoaded(true));
  }, [router]);

  if (!loaded) {
    return (
      <div className="flex min-h-screen flex-col bg-pink-50">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-200 border-t-pink-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-pink-50">
      <Navbar />
      <div className="flex flex-col items-center px-4 py-10">
        <div className="flex w-full max-w-lg items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-pink-600">Lịch sử hẹn hò</h1>
          <button
            onClick={() => router.push("/plan")}
            className="rounded-full bg-pink-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-pink-600 transition-colors"
          >
            + Hẹn mới
          </button>
        </div>

        {error && (
          <div className="mb-4 w-full max-w-lg rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-center text-sm text-red-500">
            {error}
          </div>
        )}

        {!error && items.length === 0 && (
          <div className="mt-16 flex flex-col items-center gap-3 text-center">
            <span className="text-5xl">💝</span>
            <p className="text-zinc-400">Chưa có buổi hẹn nào.</p>
            <button
              onClick={() => router.push("/plan")}
              className="mt-2 text-sm text-pink-500 hover:underline"
            >
              Lên kế hoạch ngay
            </button>
          </div>
        )}

        <div className="flex flex-col gap-4 w-full max-w-lg">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-white shadow-sm border border-zinc-100 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-zinc-400">
                  {new Date(item.created_at).toLocaleString("vi-VN")}
                </p>
                <span className="text-xs text-zinc-400">
                  {item.created_by === "Nam" ? "🧑 Nam" : "👧 Trúc Anh"}
                </span>
              </div>
              {item.foods.length > 0 && (
                <p className="text-xs text-zinc-500 mb-1">
                  Món: <span className="text-pink-500">{item.foods.join(", ")}</span>
                </p>
              )}
              <h2 className="font-semibold text-zinc-800">{item.title}</h2>
              {item.plan && (
                <p className="text-xs text-zinc-400 mt-1 whitespace-pre-line">
                  {item.plan.split(" · ").join("\n")}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

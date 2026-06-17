"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/user";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (user === "Nam") {
      router.replace("/admin");
    } else if (user) {
      router.replace("/home");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-zinc-400">Đang tải...</p>
    </div>
  );
}

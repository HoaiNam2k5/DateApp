"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, setOnboarded, type UserName } from "@/lib/user";
import OnboardingBook from "@/components/onboarding/OnboardingBook";

export default function WelcomePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserName | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const finish = () => {
    if (user) setOnboarded(user);
    router.replace(user ? "/home" : "/login");
  };

  // tên gọi thân mật trong sổ (chưa đăng nhập thì gọi chung "cậu")
  const name = user === "Nam" ? "Nam" : user === "Trúc Anh" ? "Trúc Anh" : "cậu";

  return <OnboardingBook name={name} onFinish={finish} />;
}

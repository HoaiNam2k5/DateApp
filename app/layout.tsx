import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Quicksand, Nunito, Patrick_Hand } from "next/font/google";
import "./globals.css";
import FloatingBear from "@/components/FloatingBear";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Font cho sổ tay onboarding (Bé Gấu) — Quicksand/Nunito cho thân, Patrick Hand cho tiêu đề
const quicksand = Quicksand({
  variable: "--ff-quicksand",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--ff-nunito",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const patrickHand = Patrick_Hand({
  variable: "--ff-patrick",
  subsets: ["latin", "vietnamese"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Date With Cục Vàng",
  description: "Lên kế hoạch hẹn hò cùng người thương",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Cục Vàng",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#ec4899",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${quicksand.variable} ${nunito.variable} ${patrickHand.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <FloatingBear />
      </body>
    </html>
  );
}

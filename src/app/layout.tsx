import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "板块调研看板",
  description: "展示板块调研、快讯与快讯简报",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <header
          style={{
            borderBottom: "1px solid #eee",
            padding: "12px 24px",
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <Link href="/" style={{ fontWeight: 600 }}>
            板块看板
          </Link>
          <Link href="/jin10" style={{ color: "#2563eb", fontWeight: 600 }}>
            快讯
          </Link>
          <Link href="/briefs" style={{ color: "#2563eb", fontWeight: 600 }}>
            快讯简报
          </Link>
        </header>
        {children}
      </body>
    </html>
  );
}

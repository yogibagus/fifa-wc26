import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FIFA World Cup 2026 — Live Stream & Results",
  description:
    "Follow every match of the 2026 FIFA World Cup. Live scores, group standings, knockout brackets, and top scorers. 48 teams across USA, Mexico & Canada.",
  keywords: [
    "FIFA World Cup 2026",
    "World Cup",
    "live scores",
    "football",
    "soccer",
    "bracket",
    "groups",
    "standings",
  ],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "FIFA World Cup 2026 — Live Stream & Results",
    description:
      "Follow every match of the 2026 FIFA World Cup. Live scores, group standings, knockout brackets, and top scorers.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import MobileNav from "@/components/MobileNav";
import { PlayerProvider } from "@/components/PlayerProvider";
import PlayerShell from "@/components/PlayerShell";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MusicNest — Pemutar Musik Pribadi & Self-Hosted Library",
    template: "%s | MusicNest",
  },
  description:
    "Aplikasi streaming musik pribadi modern berbasis web yang self-hosted di jaringan lokal. Dirancang dengan Next.js 16, React 19, Tailwind CSS v4, dan MySQL.",
  keywords: [
    "MusicNest",
    "music streamer",
    "self-hosted",
    "local music player",
    "Next.js",
    "React 19",
    "Tailwind CSS",
    "MySQL",
  ],
  authors: [{ name: "MusicNest" }],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "MusicNest",
    title: "MusicNest — Pemutar Musik Pribadi & Self-Hosted Library",
    description:
      "Pemutar musik pribadi modern berbasis web untuk koleksi audio lokal Anda dengan antarmuka responsif dan audio streaming cepat.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MusicNest — Pemutar Musik Pribadi & Self-Hosted Library",
    description:
      "Aplikasi pemutar musik pribadi modern berbasis web yang self-hosted di jaringan lokal.",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent focus:text-sm focus:font-semibold">
          Lewati ke konten
        </a>
        <PlayerProvider>
          <div className="flex flex-1">
            <Sidebar />
            <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
              <MobileHeader />
              <main id="main" className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 pb-44 sm:pb-28">
                <div className="content-container">{children}</div>
              </main>
            </div>
          </div>
          <MobileNav />
          <PlayerShell />
        </PlayerProvider>
      </body>
    </html>
  );
}

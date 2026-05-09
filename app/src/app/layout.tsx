import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-serif",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jornada Intensiva",
  description: "Organização documental clínica por leito.",
  // icon.svg e manifest.ts são resolvidos automaticamente pelo App Router.
  // apple-touch-icon manual: a convention apple-icon do Next só aceita png/jpg, então
  // apontamos diretamente para o SVG (iOS 11+ suporta SVG; devices antigos fazem fallback).
  icons: {
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    title: "Jornada",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#fbf9f4",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${serif.variable} ${mono.variable}`}>
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}

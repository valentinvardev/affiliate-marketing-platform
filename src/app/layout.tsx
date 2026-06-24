import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TRPCReactProvider } from "@/trpc/react";
import { SessionProvider } from "@/components/session-provider";
import { LiveChatProvider } from "@/components/live-chat";

export const metadata: Metadata = {
  title: { default: "Aff CMS", template: "%s — Aff CMS" },
  description: "Gestor de plantillas de afiliados",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <SessionProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
          <LiveChatProvider />
        </SessionProvider>
      </body>
    </html>
  );
}

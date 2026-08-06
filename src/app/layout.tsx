import "@/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TRPCReactProvider } from "@/trpc/react";
import { SessionProvider } from "@/components/session-provider";
import { LiveChatProvider } from "@/components/live-chat";

export const metadata: Metadata = {
  title: { default: "TapSur", template: "%s — TapSur" },
  description: "TapSur — command center de marketing de afiliados",
  applicationName: "TapSur",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    // iOS no lee los iconos del manifest para "Agregar a inicio": usa este.
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "TapSur",
    // Deja que el contenido llegue debajo de la barra de estado, que en un
    // fondo negro se ve como una app nativa en vez de una franja blanca.
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
  // Respeta el notch cuando corre como app instalada en iOS.
  viewportFit: "cover",
};

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* Next emite `mobile-web-app-capable` (estándar nuevo). iOS anterior a
            16.4 solo entiende el prefijado, y sin esto la app instalada abre
            con la barra de Safari en vez de a pantalla completa. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap"
        />
      </head>
      <body>
        <SessionProvider>
          <TRPCReactProvider>
            {children}
            <LiveChatProvider />
          </TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

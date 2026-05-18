import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Bloom — Your faith. Your season. God's word for you.",
  description:
    "A personalized Christian devotional companion that meets you where you are and walks with you toward God.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-512.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bloom",
  },
  openGraph: {
    title: "Bloom",
    description: "Your faith. Your season. God's word for you.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#F472A0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Bloom" />
        <link rel="apple-touch-icon" href="/icons/icon-512.png" />
      </head>
      <body className={`${geist.variable} font-sans min-h-screen`}>
        {children}
      </body>
    </html>
  );
}

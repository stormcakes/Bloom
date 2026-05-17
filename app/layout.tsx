import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Bloom — Your faith. Your season. God's word for you.",
  description:
    "A personalized Christian devotional companion that meets you where you are and walks with you toward God.",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "Bloom",
    description: "Your faith. Your season. God's word for you.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#F7C5C0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} font-sans min-h-screen`}>
        {children}
      </body>
    </html>
  );
}

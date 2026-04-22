import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import CommandPalette from "../components/CommandPalette";
import AppInitializer from "../components/AppInitializer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Motion",
  description: "Motion is starting...",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        {children}
        <AppInitializer />
        <CommandPalette />
      </body>
    </html>
  );
}

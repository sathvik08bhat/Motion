import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import CommandPalette from "../components/CommandPalette";
import AppInitializer from "../components/AppInitializer";
import ActionConfirmationModal from "../components/agent/ActionConfirmationModal";
import UndoBanner from "../components/agent/UndoBanner";
import Sidebar from "../components/navigation/Sidebar";
import Topbar from "../components/navigation/Topbar";
import ThemeProvider from "../components/providers/ThemeProvider";
import { AnimatePresence } from "framer-motion";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Motion OS",
  description: "Autonomous productivity operating system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased overflow-hidden" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
        <ThemeProvider>
          <div className="flex h-screen w-full">
            {/* Global Sidebar Navigation */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col md:ml-64 relative h-full overflow-hidden">
              {/* Global Topbar */}
              <Topbar />

              {/* Page Content (Scrollable) */}
              <div className="flex-1 overflow-y-auto" style={{ background: "var(--bg-primary)" }}>
                <AnimatePresence mode="wait">
                  {children}
                </AnimatePresence>
              </div>
            </main>
          </div>

          {/* Global Overlays & Utilities */}
          <AppInitializer />
          <CommandPalette />
          <ActionConfirmationModal />
          <UndoBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}

"use client";

import { usePathname } from "next/navigation";
import Topbar from "./Topbar";
import PageTransition from "../providers/PageTransition";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWorkspace = pathname.startsWith("/workspace");

  return (
    <main className={`flex-1 flex flex-col relative h-full overflow-hidden transition-all duration-300 ${isWorkspace ? "md:ml-16" : "md:ml-64"}`}>
      <Topbar />
      <div className="flex-1 overflow-y-auto" style={{ background: "var(--bg-primary)" }}>
        <PageTransition>
          {children}
        </PageTransition>
      </div>
    </main>
  );
}

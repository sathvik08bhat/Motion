"use client";

import { usePathname } from "next/navigation";
import Topbar from "./Topbar";
import PageTransition from "../providers/PageTransition";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="flex-1 flex flex-col relative h-full overflow-hidden transition-all duration-500 ease-out md:ml-[90px] xl:ml-[100px]">
      <Topbar />
      <div className="flex-1 overflow-y-auto scrollbar-hide relative z-10">
        <PageTransition>
          {children}
        </PageTransition>
      </div>
    </main>
  );
}

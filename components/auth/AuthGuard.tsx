"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "../../core/auth/store";
import { Loader2, BrainCircuit } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== "/login") {
        router.push("/login");
      } else if (user && pathname === "/login") {
        router.push("/workspace");
      } else {
        setIsReady(true);
      }
    }
  }, [user, loading, pathname, router]);

  if (loading || (!isReady && pathname !== "/login")) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-2 border-indigo-500/20 rounded-2xl animate-pulse" />
          <BrainCircuit className="w-8 h-8 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Decrypting Identity</p>
          </div>
          <p className="text-[8px] font-bold text-zinc-800 uppercase tracking-[0.5em]">Secure Boot Sequence</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

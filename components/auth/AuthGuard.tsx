"use client";

import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { getFirebaseAuth } from "../../lib/firebase/client";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signingIn = useRef(false); // Prevent concurrent signInAnonymously calls

  useEffect(() => {
    let unsub = () => {};

    try {
      const auth = getFirebaseAuth();
      unsub = onAuthStateChanged(auth, async (user) => {
        try {
          if (!user) {
            if (signingIn.current) return; // Already in-flight, skip
            signingIn.current = true;
            try { await signInAnonymously(auth); } finally { signingIn.current = false; }
            return; // onAuthStateChanged will fire again once user is set
          }
          setReady(true);
        } catch (e: any) {
          setError(e?.message || "Failed to authenticate.");
        }
      });
    } catch (e: any) {
      setError(e?.message || "Firebase initialization failed (check env vars).");
    }

    return () => unsub();
  }, []);

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center p-6">
        <div className="max-w-lg w-full rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm font-black text-white">Auth unavailable</p>
          <p className="mt-2 text-xs text-zinc-400">{error}</p>
          <p className="mt-3 text-[11px] text-zinc-500">
            Add Firebase web config to <code className="px-1 py-0.5 rounded bg-black/30">.env.local</code> (see{" "}
            <code className="px-1 py-0.5 rounded bg-black/30">.env.example</code>).
          </p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

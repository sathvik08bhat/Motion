"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BrainCircuit, LogIn, Terminal, Mail, ArrowRight, Loader2, ShieldCheck, Zap } from "lucide-react";
import { signInWithGoogle } from "../../core/auth/service";
import { useAuthStore } from "../../core/auth/store";
import { fadeIn, slideUp, staggerContainer } from "../../lib/animations";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuthStore();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  if (user && !loading) {
    router.push("/workspace");
    return null;
  }

  const handleGoogleLogin = async () => {
    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "your_api_key") {
      setError("CONFIGURATION ERROR: Please update your .env.local file with real Firebase keys.");
      return;
    }

    setIsAuthenticating(true);
    setError(null);
    const { error } = await signInWithGoogle();
    
    if (error) {
      setError(error);
      setIsAuthenticating(false);
    } else {
      router.push("/workspace");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 overflow-hidden relative">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="max-w-md w-full z-10 space-y-10"
      >
        
        {/* Brand Header */}
        <motion.div variants={fadeIn} className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <BrainCircuit className="w-8 h-8 text-indigo-500 relative z-10" />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight uppercase italic">Motion<span className="text-indigo-500">OS</span></h1>
            <p className="text-zinc-500 text-sm font-medium">The Autonomous Intelligence Layer for your Life.</p>
          </div>
        </motion.div>

        {/* Login Card */}
        <motion.div variants={slideUp} className="card p-8 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Welcome Back</h2>
            <p className="text-xs text-zinc-500 leading-relaxed">Login to synchronize your agent, tasks, and proactive intelligence across all devices.</p>
          </div>

          <div className="space-y-3">
            <button 
              onClick={handleGoogleLogin}
              disabled={isAuthenticating}
              className="w-full flex items-center justify-between p-4 bg-white text-black rounded-2xl font-bold text-sm hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                {isAuthenticating ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                Continue with Google
              </div>
              <ArrowRight className="w-4 h-4 opacity-30" />
            </button>

            <button 
              disabled={true}
              className="w-full flex items-center justify-between p-4 bg-zinc-900 text-zinc-500 rounded-2xl font-bold text-sm border border-zinc-800 cursor-not-allowed opacity-50"
            >
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5" />
                Email / Password
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest bg-zinc-800 px-2 py-0.5 rounded">Coming Soon</span>
            </button>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest text-center">{error}</p>
            </motion.div>
          )}

          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Enterprise Security</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Instant Sync</span>
            </div>
          </div>
        </motion.div>

        {/* Footer Info */}
        <motion.div variants={fadeIn} className="text-center space-y-4">
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
            By continuing, you agree to our <span className="text-zinc-400 hover:text-white cursor-pointer transition-colors">Terms of Service</span>
          </p>
          <div className="flex justify-center gap-6">
            <Terminal className="w-5 h-5 text-zinc-800 hover:text-zinc-600 cursor-pointer transition-colors" />
            <BrainCircuit className="w-5 h-5 text-zinc-800 hover:text-zinc-600 cursor-pointer transition-colors" />
          </div>
        </motion.div>

      </motion.div>

      {/* Decorative Elements */}
      <div className="absolute bottom-10 left-10 text-[8px] font-black text-zinc-900 uppercase tracking-[1em] select-none rotate-90 origin-bottom-left">
        Intelligence Layer 1.0.4
      </div>
      <div className="absolute top-10 right-10 text-[8px] font-black text-zinc-900 uppercase tracking-[1em] select-none -rotate-90 origin-top-right">
        Secure Handshake Active
      </div>

    </div>
  );
}

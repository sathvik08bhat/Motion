"use client";

import { Search, Command, Zap } from "lucide-react";
import { useStore } from "../../core/store";
import { motion } from "framer-motion";

export default function Topbar() {
  const setPaletteOpen = useStore((state) => state.setPaletteOpen);
  
  const greetingText = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const todayFull = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric"
  });

  return (
    <header className="flex items-center justify-between px-8 py-6 flex-shrink-0 z-20 relative">
      {/* Left: Greeting */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="text-2xl font-black tracking-tighter text-white">
          {greetingText()},{" "}
          <span className="text-gradient">You.</span>
        </h1>
        <p className="text-xs font-semibold tracking-widest text-zinc-500 uppercase mt-1">
          {todayFull}
        </p>
      </motion.div>

      {/* Right: Search + Actions */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
        className="flex items-center gap-4"
      >
        {/* Command Search */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl glass-panel group relative overflow-hidden transition-all duration-500 hover:border-indigo-500/50 hover:bg-white/[0.04]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <Command className="w-4 h-4 text-zinc-400 group-hover:text-indigo-400 transition-colors relative z-10" />
          <span className="text-xs font-semibold text-zinc-500 group-hover:text-zinc-300 transition-colors relative z-10">Access Command Link...</span>
          <kbd className="text-[10px] font-black px-2 py-1 rounded-lg bg-black/40 text-zinc-400 border border-white/5 relative z-10 group-hover:text-white group-hover:border-indigo-500/30 transition-all">
            ⌘K
          </kbd>
        </button>

        {/* Status Indicator */}
        <div className="flex items-center justify-center w-10 h-10 rounded-2xl glass-panel relative group">
          <Zap className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse-ring" />
          <div className="absolute inset-0 rounded-2xl border border-emerald-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </motion.div>
    </header>
  );
}

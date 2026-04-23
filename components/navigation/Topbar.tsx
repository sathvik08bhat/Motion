"use client";

import { Search, Bell, Settings } from "lucide-react";
import { useStore } from "../../core/store";
import { motion } from "framer-motion";
import { fadeIn, slideUp, buttonHover } from "../../lib/animations";

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
    <header
      className="flex items-center justify-between px-8 py-4 border-b flex-shrink-0"
      style={{
        background: "var(--bg-primary)",
        borderColor: "var(--border-default)",
      }}
    >
      {/* Left: Greeting */}
      <motion.div 
        variants={fadeIn}
        initial="initial"
        animate="animate"
      >
        <h1
          className="text-xl font-bold tracking-tight leading-tight"
          style={{ color: "var(--text-primary)" }}
        >
          {greetingText()},{" "}
          <span className="font-serif italic text-gradient">You.</span>
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          {todayFull}
        </p>
      </motion.div>

      {/* Right: Search + Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <motion.button
          {...buttonHover}
          onClick={() => setPaletteOpen(true)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all group shine"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            color: "var(--text-muted)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <Search className="w-4 h-4" />
          <span className="text-xs">Search anything...</span>
          <kbd
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-md ml-2"
            style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}
          >
            ⌘K
          </kbd>
        </motion.button>

        {/* Notification Bell */}
        <motion.button
          {...buttonHover}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            color: "var(--text-secondary)",
          }}
        >
          <Bell className="w-4 h-4" />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-pulse"
            style={{ background: "var(--accent-primary)" }}
          />
        </motion.button>

        {/* Settings */}
        <motion.button
          {...buttonHover}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            color: "var(--text-secondary)",
          }}
        >
          <Settings className="w-4 h-4 transition-transform duration-500" />
        </motion.button>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Focus, CheckSquare, Target,
  FileText, Settings, Plus, Layout, HeartPulse,
  Command, Box
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { href: "/",           label: "Command",    icon: LayoutDashboard },
  { href: "/workspace",  label: "Architect",  icon: Box },
  { href: "/tasks",      label: "Tasks",      icon: CheckSquare },
  { href: "/execution",  label: "Execute",    icon: Focus },
  { href: "/vision",     label: "Vision",     icon: Target },
  { href: "/thinking",   label: "Neural",     icon: FileText },
  { href: "/fitness",    label: "Bio",        icon: HeartPulse },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed left-4 top-4 bottom-4 z-50 flex flex-col items-center py-6 glass-panel transition-all duration-500 ease-out"
      style={{
        width: isHovered ? "220px" : "68px",
        alignItems: isHovered ? "stretch" : "center",
      }}
    >
      {/* ── Logo ──────────────────────────── */}
      <div className={`mb-10 flex items-center ${isHovered ? 'px-6' : 'justify-center'} gap-3`}>
        <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-[0_0_15px_rgba(92,92,255,0.5)] shrink-0">
          <div className="absolute inset-[1px] bg-black/40 rounded-[11px] backdrop-blur-md" />
          <Command className="w-4 h-4 text-white relative z-10" />
        </div>
        
        <AnimatePresence>
          {isHovered && (
            <motion.span 
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="text-white font-bold tracking-widest uppercase text-xs whitespace-nowrap overflow-hidden"
            >
              Motion OS
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ── Quick Add ─────────────────────── */}
      <div className={`mb-6 ${isHovered ? 'px-4' : 'px-0'}`}>
        <button
          onClick={() => {
            const event = new KeyboardEvent("keydown", { key: "k", metaKey: true });
            window.dispatchEvent(event);
          }}
          className={`relative group flex items-center justify-center transition-all duration-300 bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/20 rounded-xl overflow-hidden ${isHovered ? 'w-full py-2.5 px-3' : 'w-10 h-10'}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-indigo-500/0 -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <Plus className={`text-indigo-400 group-hover:text-white transition-colors shrink-0 ${isHovered ? 'w-4 h-4 mr-2' : 'w-5 h-5'}`} />
          {isHovered && <span className="text-xs font-bold text-white tracking-widest uppercase whitespace-nowrap">Construct</span>}
        </button>
      </div>

      {/* ── Navigation ────────────────────── */}
      <nav className="flex-1 w-full space-y-2 px-2 overflow-y-auto scrollbar-hide flex flex-col items-center">
        {NAV_ITEMS.map(({ href, label, icon: Icon }, i) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center transition-all duration-300 rounded-xl overflow-hidden group ${
                isHovered ? 'w-full px-3 py-2.5' : 'w-10 h-10 justify-center'
              }`}
            >
              {/* Active Background */}
              {isActive && (
                <motion.div 
                  layoutId="activeNav"
                  className="absolute inset-0 bg-indigo-500/15 border border-indigo-500/30 rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                />
              )}

              <Icon
                className={`shrink-0 transition-all duration-300 relative z-10 ${
                  isActive ? "w-5 h-5 text-indigo-400 drop-shadow-[0_0_8px_rgba(92,92,255,0.8)]" : "w-5 h-5 text-zinc-500 group-hover:text-zinc-300"
                }`}
              />

              <AnimatePresence>
                {isHovered && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={`ml-3 text-xs tracking-widest uppercase font-semibold whitespace-nowrap relative z-10 ${
                      isActive ? "text-indigo-300 drop-shadow-[0_0_8px_rgba(92,92,255,0.8)]" : "text-zinc-500 group-hover:text-zinc-300"
                    }`}
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* ── Settings / User ───────────────── */}
      <div className={`mt-auto pt-6 border-t border-white/5 w-full flex flex-col items-center ${isHovered ? 'px-4' : 'px-0'}`}>
        <Link href="/settings" className={`flex items-center transition-all duration-300 rounded-xl group ${isHovered ? 'w-full px-3 py-2.5 hover:bg-white/5' : 'w-10 h-10 justify-center hover:bg-white/5'}`}>
          <Settings className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 shrink-0" />
          {isHovered && <span className="ml-3 text-xs tracking-widest uppercase font-semibold text-zinc-600 group-hover:text-zinc-400 whitespace-nowrap">System</span>}
        </Link>
      </div>
    </motion.aside>
  );
}

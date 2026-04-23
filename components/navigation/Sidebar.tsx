"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Focus, Eye, Terminal, CheckSquare, Target,
  CalendarDays, FileText, ScrollText, Settings, Plus, ChevronDown,
  Sun, Moon, Zap
} from "lucide-react";
import { useAppTheme } from "../providers/ThemeProvider";
import { useState } from "react";
import { motion } from "framer-motion";
import { slideUp, buttonHover, listItemHover } from "../../lib/animations";

const NAV_ITEMS = [
  { href: "/",           label: "Dashboard",  icon: LayoutDashboard },
  { href: "/tasks",      label: "Tasks",      icon: CheckSquare },
  { href: "/goals",      label: "Goals",      icon: Target },
  { href: "/workspace",  label: "Notes",      icon: FileText },
  { href: "/agent-log",  label: "Agent Log",  icon: ScrollText },
  { href: "/settings",   label: "Settings",   icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { accentTheme, setAccentTheme, themes } = useAppTheme();
  const [showThemes, setShowThemes] = useState(false);

  const isDarkish = accentTheme === "dark" || accentTheme === "midnight";

  return (
    <aside
      className="fixed left-0 top-0 h-full w-64 flex flex-col z-40 border-r transition-all duration-300"
      style={{
        background: "var(--bg-sidebar)",
        borderColor: "var(--border-default)",
      }}
    >
      {/* ── Logo ──────────────────────────── */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-2.5 mb-1">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shine"
            style={{ background: "var(--accent-primary)" }}
          >
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span
            className="text-lg font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Motion
          </span>
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Autonomous productivity OS
        </p>
      </div>

      {/* ── Quick Add ─────────────────────── */}
      <div className="px-4 mb-4">
        <motion.button
          {...buttonHover}
          className="btn-primary w-full justify-center shine"
          onClick={() => {
            // open command palette
            const event = new KeyboardEvent("keydown", { key: "k", metaKey: true });
            window.dispatchEvent(event);
          }}
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Quick Entry
        </motion.button>
      </div>

      {/* ── Navigation ───────────────────── */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }, i) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <motion.div
              key={href}
              variants={slideUp}
              initial="initial"
              animate="animate"
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={href}
                className={`nav-item flex items-center gap-3 px-3 py-2 rounded-xl transition-all`}
                style={{
                  ...(isActive ? {
                    color: "var(--sidebar-active-text)",
                    background: "var(--sidebar-active-bg)",
                    borderLeft: `3px solid var(--accent-primary)`,
                    fontWeight: 600,
                  } : {})
                }}
              >
                <Icon
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: isActive ? "var(--accent-primary)" : "var(--text-muted)" }}
                />
                <motion.span 
                  initial={false}
                  animate={{ x: isActive ? 2 : 0 }}
                  className="flex-1"
                >
                  {label}
                </motion.span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* ── Theme Switcher ─────────────────── */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "var(--border-default)" }}>
        <button
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-secondary)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          onClick={() => setShowThemes(!showThemes)}
        >
          <div className="flex items-center gap-2 text-xs font-medium">
            {isDarkish ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            Theme
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: themes.find(t => t.id === accentTheme)?.color }}
            />
            <ChevronDown
              className="w-3.5 h-3.5 transition-transform"
              style={{ transform: showThemes ? "rotate(180deg)" : "rotate(0)" }}
            />
          </div>
        </button>

        {showThemes && (
          <div
            className="mt-2 p-3 rounded-xl border animate-scale-in"
            style={{ background: "var(--bg-secondary)", borderColor: "var(--border-default)" }}
          >
            <div className="grid grid-cols-3 gap-2">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setAccentTheme(theme.id)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all group"
                  style={{
                    background: accentTheme === theme.id ? "var(--bg-card)" : "transparent",
                    boxShadow: accentTheme === theme.id ? "var(--shadow-sm)" : "none",
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-full transition-all group-hover:scale-110"
                    style={{
                      background: theme.color,
                      outline: accentTheme === theme.id ? `2px solid ${theme.color}` : "none",
                      outlineOffset: "2px",
                    }}
                  />
                  <span
                    className="text-[9px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {theme.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── User ──────────────────────────── */}
      <div
        className="px-4 pb-4 flex items-center gap-3 cursor-pointer group"
        style={{ color: "var(--text-secondary)" }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all group-hover:scale-105"
          style={{ background: "var(--accent-primary)", color: "white" }}
        >
          U
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>You</p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Focus Mode</p>
        </div>
        <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 transition-transform group-hover:rotate-180" />
      </div>
    </aside>
  );
}

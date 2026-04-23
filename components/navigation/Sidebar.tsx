"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Focus, Eye, Terminal, CheckSquare, Target,
  CalendarDays, FileText, ScrollText, Settings, Plus, ChevronDown,
  Sun, Moon, Zap, Lock, ShieldCheck, Layout
} from "lucide-react";
import { useAppTheme } from "../providers/ThemeProvider";
import { useState } from "react";
import { motion } from "framer-motion";
import { slideUp, buttonHover, listItemHover } from "../../lib/animations";

const NAV_ITEMS = [
  { href: "/",           label: "Dashboard",  icon: LayoutDashboard },
  { href: "/workspace",  label: "Workspace",  icon: Layout },
  { href: "/execution",  label: "Execution Hub", icon: Focus },
  { href: "/tasks",      label: "Tasks",      icon: CheckSquare },
  { href: "/vision",     label: "Vision Hub", icon: Target },
  { href: "/thinking",   label: "Thinking Hub", icon: FileText },
  { href: "/agent",      label: "Control Hub",  icon: ShieldCheck },
  { href: "/vault",      label: "Vault",      icon: Lock },
  { href: "/settings",   label: "Settings",   icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { accentTheme, setAccentTheme, themes } = useAppTheme();
  const [showThemes, setShowThemes] = useState(false);

  const isDarkish = accentTheme === "dark" || accentTheme === "midnight";
  const isCollapsed = pathname.startsWith("/workspace");

  return (
    <aside
      className={`fixed left-0 top-0 h-full flex flex-col z-40 border-r transition-all duration-300 ${
        isCollapsed ? "w-16 md:w-16" : "w-64"
      }`}
      style={{
        background: "var(--bg-sidebar)",
        borderColor: "var(--border-default)",
      }}
    >
      {/* ── Logo ──────────────────────────── */}
      <div className={`pt-6 pb-4 ${isCollapsed ? "px-4 flex justify-center" : "px-6"}`}>
        <div className="flex items-center gap-2.5 mb-1">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shine shrink-0"
            style={{ background: "var(--accent-primary)" }}
          >
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          {!isCollapsed && (
            <span
              className="text-lg font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Motion
            </span>
          )}
        </div>
        {!isCollapsed && (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Autonomous productivity OS
          </p>
        )}
      </div>

      {/* ── Quick Add ─────────────────────── */}
      <div className={`mb-4 ${isCollapsed ? "px-2" : "px-4"}`}>
        <motion.button
          {...buttonHover}
          className={`btn-primary w-full shine ${isCollapsed ? "justify-center p-2" : "justify-center"}`}
          onClick={() => {
            // open command palette
            const event = new KeyboardEvent("keydown", { key: "k", metaKey: true });
            window.dispatchEvent(event);
          }}
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          {!isCollapsed && "Quick Entry"}
        </motion.button>
      </div>

      {/* ── Navigation ───────────────────── */}
      <nav className={`flex-1 space-y-0.5 overflow-y-auto ${isCollapsed ? "px-2" : "px-3"}`}>
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
                className={`nav-item group transition-all duration-300 ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center p-2' : ''}`}
                style={{
                  textDecoration: 'none',
                }}
              >
                <motion.div
                  className={`flex items-center ${isCollapsed ? "" : "gap-3"} w-full`}
                  whileHover={{ x: isCollapsed ? 0 : 6 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Icon
                    className="w-4.5 h-4.5 flex-shrink-0 transition-colors duration-300"
                    style={{ 
                      color: isActive ? "var(--accent-primary)" : "var(--text-muted)" 
                    }}
                  />
                  <span 
                    className="flex-1 transition-colors duration-300"
                    style={{ 
                      color: isActive ? "var(--sidebar-active-text)" : "var(--text-secondary)",
                    }}
                  >
                    {label}
                  </span>
                  
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="w-1 h-4 rounded-full"
                      style={{ background: "var(--accent-primary)" }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </motion.div>
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

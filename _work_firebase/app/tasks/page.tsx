"use client";

import { useEffect, useState } from "react";
import { getTasks, getGoals } from "../../data/db";
import { useStore } from "../../core/store";
import TaskForm from "../../components/tasks/TaskForm";
import TaskList from "../../components/tasks/TaskList";
import { LayoutList, Target, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { fadeIn, slideUp, staggerContainer, cardHover, buttonHover } from "../../lib/animations";

export default function TasksPage() {
  const [viewMode, setViewMode] = useState<"flat" | "goal" | "date">("flat");
  const setGoals = useStore((state) => state.setGoals);
  const setTasks = useStore((state) => state.setTasks);

  useEffect(() => {
    async function hydrate() {
      try {
        const [goals, tasks] = await Promise.all([getGoals(), getTasks()]);
        setGoals(goals);
        setTasks(tasks);
      } catch (error) {
        console.error("Failed to hydrate data:", error);
      }
    }
    hydrate();
  }, [setGoals, setTasks]);

  const VIEW_MODES = [
    { id: "flat" as const, label: "List",  icon: LayoutList },
    { id: "goal" as const, label: "Goal",  icon: Target },
    { id: "date" as const, label: "Date",  icon: Calendar },
  ];

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="p-8 max-w-3xl mx-auto space-y-10"
    >
      {/* Header */}
      <motion.header variants={fadeIn} className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--accent-primary)" }}>
          Manage
        </p>
        <h1 className="text-4xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
          Tasks
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Manage your actionable items and stay on track.
        </p>
      </motion.header>

      {/* Fast Add Form */}
      <motion.section variants={slideUp} className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Quick Add
        </h2>
        <TaskForm />
      </motion.section>

      {/* Task List */}
      <motion.section variants={slideUp} className="space-y-5">
        <div
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4"
          style={{ borderBottom: "1px solid var(--border-default)" }}
        >
          <h2 className="text-sm font-bold" style={{ color: "var(--text-secondary)" }}>Your Tasks</h2>
          
          {/* View Mode Switcher */}
          <div
            className="flex items-center p-1 rounded-xl gap-1"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-default)" }}
          >
            {VIEW_MODES.map(({ id, label, icon: Icon }) => (
              <motion.button
                key={id}
                {...buttonHover}
                onClick={() => setViewMode(id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: viewMode === id ? "var(--bg-card)" : "transparent",
                  color: viewMode === id ? "var(--accent-primary)" : "var(--text-muted)",
                  boxShadow: viewMode === id ? "var(--shadow-sm)" : "none",
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </motion.button>
            ))}
          </div>
        </div>

        <TaskList viewMode={viewMode} />
      </motion.section>
    </motion.div>
  );
}

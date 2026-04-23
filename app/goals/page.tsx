"use client";

import { useEffect } from "react";
import { getGoals } from "../../data/db";
import { useStore } from "../../core/store";
import GoalForm from "../../components/goals/GoalForm";
import GoalList from "../../components/goals/GoalList";
import { motion } from "framer-motion";
import { fadeIn, slideUp, staggerContainer } from "../../lib/animations";

export default function GoalsPage() {
  const setGoals = useStore((state) => state.setGoals);

  useEffect(() => {
    async function loadGoals() {
      try {
        const goals = await getGoals();
        setGoals(goals);
      } catch (error) {
        console.error("Failed to hydrate goals:", error);
      }
    }
    loadGoals();
  }, [setGoals]);

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="p-8 max-w-3xl mx-auto space-y-10"
    >
      <motion.header variants={fadeIn} className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--accent-primary)" }}>
          Vision
        </p>
        <h1 className="text-4xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
          Goals
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Define your core objectives and track your progress.
        </p>
      </motion.header>

      <motion.section variants={slideUp} className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          New Objective
        </h2>
        <GoalForm />
      </motion.section>

      <motion.section variants={slideUp} className="space-y-4">
        <div className="pb-4" style={{ borderBottom: "1px solid var(--border-default)" }}>
          <h2 className="text-sm font-bold" style={{ color: "var(--text-secondary)" }}>Active Pursuits</h2>
        </div>
        <GoalList />
      </motion.section>
    </motion.div>
  );
}

"use client";

import { useStore } from "../../core/store";
import { Target, Calendar, BarChart2 } from "lucide-react";
import { motion } from "framer-motion";
import { slideUp, cardHover } from "../../lib/animations";

export default function GoalList() {
  const goals = useStore((state) => state.goals);

  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-zinc-900/10 border border-dashed border-zinc-800/50 rounded-3xl animate-in fade-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
          <Target className="w-6 h-6 text-zinc-600" />
        </div>
        <p className="text-sm font-medium text-zinc-500 mb-2">No goals established yet.</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Start by creating your first objective above.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {goals.map((goal, i) => {
        const { transition: hoverTransition, ...hoverProps } = cardHover;
        return (
          <motion.div
            key={goal.id}
            variants={slideUp}
            initial="initial"
            animate="animate"
            transition={{ ...hoverTransition, delay: i * 0.1 }}
            {...hoverProps}
            className="bg-zinc-900/40 border border-zinc-800/50 p-5 rounded-2xl cursor-default card"
          >
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-bold text-zinc-100 group-hover:text-white transition-colors">
              {goal.title}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                goal.priority === "high"
                  ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                  : goal.priority === "medium"
                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
              }`}
            >
              {goal.priority}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(goal.deadline).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5" />
              <span className="capitalize">{goal.status}</span>
            </div>
          </div>
        </motion.div>
      )})}
    </div>
  );
}

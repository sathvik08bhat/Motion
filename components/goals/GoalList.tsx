"use client";

import { useStore } from "../../core/store";
import { Target, Calendar, BarChart2 } from "lucide-react";

export default function GoalList() {
  const goals = useStore((state) => state.goals);

  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl text-zinc-500">
        <Target className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm">No goals established yet.</p>
        <p className="text-xs">Start by creating your first objective above.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {goals.map((goal) => (
        <div
          key={goal.id}
          className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl hover:border-zinc-700 transition-colors group cursor-default"
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
              <span>{goal.deadline.toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5" />
              <span className="capitalize">{goal.status}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

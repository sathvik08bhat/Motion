"use client";

import { useStore } from "../../core/store";
import { Target, CheckCircle2, Circle } from "lucide-react";

export default function DashboardStats() {
  const goals = useStore((state) => state.goals);
  const tasks = useStore((state) => state.tasks);

  const activeGoals = goals.filter((g) => g.status !== "completed").length;
  const today = new Date().toDateString();
  const todayTasks = tasks.filter((t) => new Date(t.scheduledAt).toDateString() === today);

  const completedToday = todayTasks.filter((t) => t.status === "done").length;
  const pendingOverall = tasks.filter((t) => t.status !== "done").length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-xl">
            <Target className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Active Goals</p>
            <h3 className="text-2xl font-black text-white">{activeGoals}</h3>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Today</p>
            <h3 className="text-2xl font-black text-white">
              {completedToday}/{todayTasks.length}
            </h3>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl">
            <Circle className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Pending</p>
            <h3 className="text-2xl font-black text-white">{pendingOverall}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}

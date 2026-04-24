"use client";

import { useStore } from "../../core/store";
import { updateTask as updateTaskInDb, type Task } from "../../data/db";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";

export default function PendingView() {
  const tasks = useStore((state) => state.tasks);
  const updateTaskInStore = useStore((state) => state.updateTask);

  const todayStr = new Date().toDateString();
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const pendingTasks = tasks.filter((t) => {
    const isDone = t.status === "done";
    const isNotToday = new Date(t.scheduledAt).toDateString() !== todayStr;

    const isPast = new Date(t.scheduledAt).getTime() < todayDate.getTime();
    return !isDone && (isNotToday || isPast);
  }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());


  const toggleTask = async (task: Task) => {
    const newStatus = task.status === "done" ? "todo" : "done";
    try {
      await updateTaskInDb(task.id!, { status: newStatus });
      updateTaskInStore(task.id!, { status: newStatus });
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  if (pendingTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-zinc-900/10 border border-dashed border-zinc-800/50 rounded-2xl animate-in fade-in zoom-in-95 duration-500">
        <CheckCircle2 className="w-6 h-6 text-emerald-500/50 mb-3" />
        <p className="text-sm font-bold text-zinc-400">All caught up!</p>
        <p className="text-[10px] font-medium text-zinc-600 mt-1 uppercase tracking-widest">No pending tasks outside today</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pendingTasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center gap-4 bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-xl transition-all duration-300 hover:bg-zinc-800/40 hover:border-zinc-600 hover:-translate-y-0.5 hover:shadow-lg group"
        >
          <button
            onClick={() => toggleTask(task)}
            className="text-zinc-600 hover:text-indigo-400 transition-colors"
          >
            <Circle className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-zinc-100 truncate">
              {task.title}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <AlertCircle className="w-3 h-3 text-rose-500/50" />
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tight">
                Overdue / Upcoming: {new Date(task.scheduledAt).toLocaleDateString()}

              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

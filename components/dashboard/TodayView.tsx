"use client";

import { useStore } from "../../core/store";
import { updateTask as updateTaskInDb, type Task } from "../../data/db";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { eventBus, OS_EVENTS } from "../../core/events";

export default function TodayView() {
  const tasks = useStore((state) => state.tasks);
  const updateTaskInStore = useStore((state) => state.updateTask);

  const today = new Date().toDateString();
  const todayTasks = tasks
    .filter((t) => t.scheduledAt.toDateString() === today)
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === "done" ? "todo" : "done";
    try {
      await updateTaskInDb(task.id!, { status: newStatus });
      updateTaskInStore(task.id!, { status: newStatus });
      if (newStatus === "done") {
        eventBus.emit(OS_EVENTS.TASK_COMPLETED, { ...task, status: newStatus });
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  if (todayTasks.length === 0) {
    return (
      <div className="p-8 border border-dashed border-zinc-800 rounded-2xl text-center text-zinc-500 text-sm">
        No tasks scheduled for today.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {todayTasks.map((task) => (
        <div
          key={task.id}
          className={`flex items-center gap-4 bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-xl transition-all ${
            task.status === "done" ? "opacity-50" : "hover:border-zinc-700"
          }`}
        >
          <button
            onClick={() => toggleTask(task)}
            className="text-zinc-600 hover:text-indigo-400 transition-colors"
          >
            {task.status === "done" ? (
              <CheckCircle2 className="w-5 h-5 text-indigo-500" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-semibold truncate ${
              task.status === "done" ? "line-through text-zinc-500" : "text-zinc-100"
            }`}>
              {task.title}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <Clock className="w-3 h-3 text-zinc-600" />
              <span className="text-[10px] font-bold text-zinc-600">
                {task.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

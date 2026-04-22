"use client";

import { useStore } from "../../core/store";
import { updateTask as updateTaskInDb, type Task } from "../../data/db";
import { CheckCircle2, Circle, Clock, Target, Calendar } from "lucide-react";
import { eventBus, OS_EVENTS } from "../../core/events";

interface TaskListProps {
  viewMode: "flat" | "goal" | "date";
}

export default function TaskList({ viewMode }: TaskListProps) {
  const tasks = useStore((state) => state.tasks);
  const goals = useStore((state) => state.goals);
  const updateTaskInStore = useStore((state) => state.updateTask);

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

  const getGoalTitle = (goalId?: number) => {
    return goals.find((g) => g.id === goalId)?.title || "Independent";
  };

  const renderTask = (task: Task) => (
    <div
      key={task.id}
      className={`flex items-center gap-4 bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl transition-all group ${
        task.status === "done" ? "opacity-50" : "hover:border-zinc-700"
      }`}
    >
      <button
        onClick={() => toggleTask(task)}
        className="text-zinc-600 hover:text-indigo-400 transition-colors"
      >
        {task.status === "done" ? (
          <CheckCircle2 className="w-6 h-6 text-indigo-500" />
        ) : (
          <Circle className="w-6 h-6" />
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <h4 className={`text-sm font-semibold text-zinc-100 truncate ${
          task.status === "done" ? "line-through text-zinc-500" : ""
        }`}>
          {task.title}
        </h4>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-medium bg-zinc-950 px-2 py-0.5 rounded-full border border-zinc-800">
            <Target className="w-2.5 h-2.5" /> {getGoalTitle(task.goalId)}
          </span>
          <span className="text-[10px] text-zinc-600 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> {task.duration}m
          </span>
          <span className="text-[10px] text-zinc-600 flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" /> {task.scheduledAt.toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl text-zinc-500 mt-8">
        <p className="text-sm">No tasks found.</p>
      </div>
    );
  }

  if (viewMode === "goal") {
    const grouped = tasks.reduce((acc, task) => {
      const gTitle = getGoalTitle(task.goalId);
      if (!acc[gTitle]) acc[gTitle] = [];
      acc[gTitle].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    return (
      <div className="space-y-8 mt-8">
        {Object.entries(grouped).map(([title, items]) => (
          <div key={title} className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">
              {title}
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {items.map(renderTask)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (viewMode === "date") {
    const grouped = tasks.reduce((acc, task) => {
      const dateKey = task.scheduledAt.toLocaleDateString(undefined, { 
        weekday: 'short', month: 'short', day: 'numeric' 
      });
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    return (
      <div className="space-y-8 mt-8">
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">
              {date}
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {items.map(renderTask)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 mt-8">
      {tasks.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()).map(renderTask)}
    </div>
  );
}

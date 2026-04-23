"use client";

import { useStore } from "../../core/store";
import { updateTask as updateTaskInDb, type Task } from "../../data/db";
import { CheckCircle2, Circle, Clock, Target, Calendar, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cardHover, buttonHover } from "../../lib/animations";
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
    <motion.div
      key={task.id}
      {...cardHover}
      className={`flex items-center gap-4 p-4 rounded-xl transition-all card ${
        task.status === "done" ? "opacity-50" : ""
      }`}
    >
      <motion.button
        {...buttonHover}
        onClick={() => toggleTask(task)}
        className="text-zinc-600 hover:text-indigo-400 transition-colors"
      >
        {task.status === "done" ? (
          <CheckCircle2 className="w-6 h-6 text-indigo-500" />
        ) : (
          <Circle className="w-6 h-6" />
        )}
      </motion.button>
      
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
          <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 uppercase tracking-tighter">
            {task.domain}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-tighter ${
            task.priority === 'high' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 
            task.priority === 'medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 
            'text-zinc-500 bg-zinc-800 border-zinc-700'
          }`}>
            {task.priority}
          </span>
          <span className="text-[10px] text-zinc-600 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> {task.duration}m
          </span>
          <span className="text-[10px] text-zinc-600 flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" /> {new Date(task.scheduledAt).toLocaleDateString()}
          </span>
        </div>

      </div>
    </motion.div>
  );

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-zinc-900/10 border border-dashed border-zinc-800/50 rounded-3xl mt-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
          <Target className="w-6 h-6 text-zinc-600" />
        </div>
        <p className="text-sm font-medium text-zinc-500 mb-6">No active tasks found in this view.</p>
        <a 
          href="/goals" 
          className="group flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-zinc-200 hover:scale-105 active:scale-95"
        >
          Create your first goal
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>
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
      const dateKey = new Date(task.scheduledAt).toLocaleDateString(undefined, { 
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
      {[...tasks].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()).map(renderTask)}
    </div>
  );
}

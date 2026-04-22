"use client";

import { useEffect, useState } from "react";
import { getTasks, getGoals } from "../../data/db";
import { useStore } from "../../core/store";
import TaskForm from "../../components/tasks/TaskForm";
import TaskList from "../../components/tasks/TaskList";
import { MoveLeft, LayoutList, Target, Calendar } from "lucide-react";
import Link from "next/link";

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

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 lg:p-24 selection:bg-indigo-500/30">
      <div className="max-w-2xl mx-auto space-y-12">
        <header className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm font-medium"
          >
            <MoveLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
              Tasks
            </h1>
            <p className="text-zinc-500 font-medium">
              Manage your actionable items and stay on track.
            </p>
          </div>
        </header>

        <section className="space-y-10">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-300">Fast Add</h2>
            <TaskForm />
          </div>

          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <h2 className="text-lg font-semibold text-zinc-300">Your Tasks</h2>
              <div className="flex items-center bg-zinc-900 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("flat")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    viewMode === "flat" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <LayoutList className="w-3.5 h-3.5" /> List
                </button>
                <button
                  onClick={() => setViewMode("goal")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    viewMode === "goal" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Target className="w-3.5 h-3.5" /> Goal
                </button>
                <button
                  onClick={() => setViewMode("date")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    viewMode === "date" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" /> Date
                </button>
              </div>
            </div>

            <TaskList viewMode={viewMode} />
          </div>
        </section>
      </div>
    </div>
  );
}

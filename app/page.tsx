"use client";

import { useEffect } from "react";
import { getGoals, getTasks } from "../data/db";
import { useStore } from "../core/store";
import DashboardStats from "../components/dashboard/DashboardStats";
import TodayView from "../components/dashboard/TodayView";
import PendingView from "../components/dashboard/PendingView";
import { Target, ListTodo, LayoutDashboard, ChevronRight, Sparkles, Wand2, X } from "lucide-react";
import Link from "next/link";
import { calculateSchedule, getAutoRescheduledUpdates, getNextBestTask } from "../lib/scheduler";
import { bulkUpdateTasks, type Task } from "../data/db";
import { useState } from "react";
import { eventBus, OS_EVENTS } from "../core/events";
import ModuleWidgets from "../components/dashboard/ModuleWidgets";


export default function Home() {
  const goals = useStore((state) => state.goals);
  const tasks = useStore((state) => state.tasks);
  const setGoals = useStore((state) => state.setGoals);
  const setTasks = useStore((state) => state.setTasks);
  const bulkUpdateTasksInStore = useStore((state) => state.bulkUpdateTasks);
  const [recommendedTask, setRecommendedTask] = useState<Task | null>(null);

  const handleGetAdvice = async () => {
    const best = await getNextBestTask(tasks, goals);
    setRecommendedTask(best);
  };

  useEffect(() => {
    async function hydrate() {
      try {
        const [fetchedGoals, fetchedTasks] = await Promise.all([getGoals(), getTasks()]);
        setGoals(fetchedGoals);
        setTasks(fetchedTasks);

        // 1. Auto-reschedule overdue tasks
        const rescheduleUpdates = await getAutoRescheduledUpdates(fetchedTasks);
        if (rescheduleUpdates.length > 0) {
          await bulkUpdateTasks(rescheduleUpdates);
          bulkUpdateTasksInStore(rescheduleUpdates);
        }

        // 2. Autonomous "Plan My Day" check
        const lastPlanDate = localStorage.getItem("motion_last_autoplan");
        const todayStr = new Date().toDateString();

        if (lastPlanDate !== todayStr) {
          console.log("New day detected: Auto-optimizing schedule...");
          // We use the latest data from DB to ensure accuracy
          const currentGoals = fetchedGoals;
          const currentTasks = fetchedTasks; 
          
          const planUpdates = await calculateSchedule(currentTasks, currentGoals);
          await bulkUpdateTasks(planUpdates);
          bulkUpdateTasksInStore(planUpdates);
          
          eventBus.emit(OS_EVENTS.PLAN_CREATED, { count: planUpdates.length });
          localStorage.setItem("motion_last_autoplan", todayStr);
        }
      } catch (error) {
        console.error("Failed to hydrate dashboard:", error);
      }
    }
    hydrate();
  }, [setGoals, setTasks, bulkUpdateTasksInStore]);

  const handlePlanDay = async () => {
    try {
      const updates = await calculateSchedule(tasks, goals);
      await bulkUpdateTasks(updates);
      bulkUpdateTasksInStore(updates);
      eventBus.emit(OS_EVENTS.PLAN_CREATED, { count: updates.length });
      alert("Your day has been optimized! 🚀");
    } catch (error) {
      console.error("Failed to plan day:", error);
      alert("Scheduling failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 lg:p-24 selection:bg-indigo-500/30">
      <div className="max-w-4xl mx-auto space-y-16">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-500">
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-[0.2em]">Command Center</span>
            </div>
            <div className="space-y-1">
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter bg-gradient-to-br from-white via-white to-zinc-600 bg-clip-text text-transparent">
                Motion
              </h1>
              <p className="text-zinc-500 font-medium text-lg">
                Welcome back. Here is your focus for today.
              </p>
            </div>
          </div>

          <nav className="flex gap-3">
            <Link
              href="/goals"
              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-4 py-2.5 rounded-xl transition-all group"
            >
              <Target className="w-4 h-4 text-zinc-400 group-hover:text-indigo-400" />
              <span className="text-sm font-bold text-zinc-300">Goals</span>
            </Link>
            <Link
              href="/tasks"
              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-4 py-2.5 rounded-xl transition-all group"
            >
              <ListTodo className="w-4 h-4 text-zinc-400 group-hover:text-indigo-400" />
              <span className="text-sm font-bold text-zinc-300">Tasks</span>
            </Link>
          </nav>
        </header>

        <section className="space-y-12">
          <DashboardStats />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-4 gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <h2 className="text-xl font-bold tracking-tight flex items-center gap-3 whitespace-nowrap">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse flex-shrink-0" />
                    Today&apos;s Focus
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePlanDay}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(79,70,229,0.3)] h-9"
                    >
                      <Wand2 className="w-3 h-3" /> Plan My Day
                    </button>
                    <button
                      onClick={handleGetAdvice}
                      className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-zinc-800 h-9"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-400" /> What now?
                    </button>
                  </div>
                </div>
                <Link href="/tasks" className="text-xs font-bold text-zinc-500 hover:text-indigo-400 flex items-center gap-1 transition-colors whitespace-nowrap">
                  View All <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {recommendedTask && (
                <div className="bg-gradient-to-br from-indigo-600/20 to-transparent border border-indigo-500/30 p-5 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Sparkles className="w-24 h-24" />
                  </div>
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-indigo-400">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Next Best Action</span>
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight text-white">{recommendedTask.title}</h3>
                      <div className="flex items-center gap-4 text-xs font-medium text-zinc-400">
                        <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">{recommendedTask.duration}m duration</span>
                        <span>Priority Focus</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setRecommendedTask(null)}
                      className="p-1 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <TodayView />
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <h2 className="text-xl font-bold tracking-tight text-zinc-400">
                  Pending Actions
                </h2>
              </div>
              <PendingView />
            </div>
          </div>

          {/* Module Widgets */}
          <ModuleWidgets />
        </section>


        <footer className="pt-16 border-t border-zinc-900 flex justify-between items-center text-[10px] font-bold text-zinc-800 uppercase tracking-widest">
          <span>Motion OS v1.0.0</span>
          <span>System Initialized</span>
        </footer>
      </div>
    </div>
  );
}

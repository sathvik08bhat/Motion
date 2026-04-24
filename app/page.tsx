"use client";

import { useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { getGoals, getTasks } from "../data/db";
import { useStore } from "../core/store";
import { Wand2, TrendingUp, CheckCircle2, Clock, Target, ArrowRight, BrainCircuit, Zap, Flame, Footprints, Activity } from "lucide-react";
import { calculateSchedule, getAutoRescheduledUpdates } from "../lib/scheduler";
import { eventBus, OS_EVENTS } from "../core/events";
import { runAgentAction } from "../core/agent/orchestrator";
import { createAgentAction } from "../core/agent/types";
import { motion } from "framer-motion";
import { fadeIn, slideUp, staggerContainer, cardHover } from "../lib/animations";
import Link from "next/link";

// Lazy-loaded widgets
const NextActionHero     = dynamic(() => import("../components/dashboard/NextActionHero"), { ssr: false });
const TodayView          = dynamic(() => import("../components/dashboard/TodayView"), { ssr: false, loading: () => <div className="space-y-2 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl bg-white/[0.03]" />)}</div> });
const DoneView           = dynamic(() => import("../components/dashboard/DoneView"), { ssr: false });
const DomainInsights     = dynamic(() => import("../components/dashboard/DomainInsights"), { ssr: false });
const AgentDecisionWidget = dynamic(() => import("../components/dashboard/AgentDecisionWidget"), { ssr: false });
const FocusCycleWidget   = dynamic(() => import("../components/dashboard/FocusCycleWidget"), { ssr: false });
const IntentHistory      = dynamic(() => import("../components/dashboard/IntentHistory"), { ssr: false });

export default function Home() {
  const goals  = useStore(s => s.goals);
  const tasks  = useStore(s => s.tasks);
  const setGoals = useStore(s => s.setGoals);
  const setTasks = useStore(s => s.setTasks);
  const bulkUpdateTasksInStore = useStore(s => s.bulkUpdateTasks);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayTasks = tasks.filter(t => new Date(t.scheduledAt).toDateString() === today);
    const done  = todayTasks.filter(t => t.status === "done").length;
    const total = todayTasks.length;
    const activeGoals = goals.filter(g => g.status !== "completed").length;
    const focus = done / Math.max(total, 1);
    return { done, total, rate: Math.round(focus * 100), activeGoals, focus };
  }, [tasks, goals]);

  const handlePlanDay = useCallback(async () => {
    try {
      const planUpdates = await calculateSchedule(tasks, goals);
      if (planUpdates.length > 0) {
        const action = createAgentAction("bulk_schedule", { updates: planUpdates }, "System-wide schedule optimization.");
        await runAgentAction(action);
        bulkUpdateTasksInStore(planUpdates);
        eventBus.emit(OS_EVENTS.PLAN_CREATED, { count: planUpdates.length });
      }
    } catch (err) { console.error(err); }
  }, [tasks, goals, bulkUpdateTasksInStore]);

  useEffect(() => {
    const onAction = (action: any) => {
      if (["create_task", "bulk_create_tasks", "create_goal_with_tasks"].includes(action.type)) handlePlanDay();
    };
    eventBus.on(OS_EVENTS.ACTION_EXECUTED, onAction);
    return () => eventBus.off(OS_EVENTS.ACTION_EXECUTED, onAction);
  }, [handlePlanDay]);

  useEffect(() => {
    async function hydrate() {
      try {
        const [fetchedGoals, fetchedTasks] = await Promise.all([getGoals(), getTasks()]);
        setGoals(fetchedGoals);
        setTasks(fetchedTasks);
        const reschedule = await getAutoRescheduledUpdates(fetchedTasks);
        if (reschedule.length > 0) {
          const action = createAgentAction("bulk_schedule", { updates: reschedule }, "Auto-rescheduling overdue tasks.");
          await runAgentAction(action);
          bulkUpdateTasksInStore(reschedule);
        }
        const lastPlan = localStorage.getItem("motion_last_autoplan");
        const todayStr = new Date().toDateString();
        if (lastPlan !== todayStr) {
          const planUpdates = await calculateSchedule(fetchedTasks, fetchedGoals);
          if (planUpdates.length > 0) {
            const action = createAgentAction("bulk_schedule", { updates: planUpdates }, "Optimizing daily schedule.");
            await runAgentAction(action);
            bulkUpdateTasksInStore(planUpdates);
            eventBus.emit(OS_EVENTS.PLAN_CREATED, { count: planUpdates.length });
          }
          localStorage.setItem("motion_last_autoplan", todayStr);
        }
      } catch (err) { console.error("Failed to hydrate dashboard:", err); }
    }
    hydrate();
  }, [setGoals, setTasks, bulkUpdateTasksInStore]);

  return (
    <motion.div
      initial="initial" animate="animate" variants={staggerContainer}
      className="h-full overflow-y-auto scrollbar-hide relative z-10"
    >
      <div className="relative z-10 p-6 xl:p-8 space-y-8 max-w-[1500px] mx-auto">

        {/* ─── HEADER ACTIONS ─────────────────────────────────────────── */}
        <motion.div variants={fadeIn} className="flex justify-end mb-4">
          <button
            onClick={handlePlanDay}
            className="btn-primary group"
          >
            <Wand2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            Optimize Schedule
          </button>
        </motion.div>

        {/* ─── TOP STAT STRIP ─────────────────────────────────────────── */}
        <motion.div variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Neural State",  value: stats.rate > 70 ? "Deep Flow" : stats.rate > 40 ? "Active" : "Warming Up", sub: `${stats.done}/${stats.total} nodes`, icon: Target, accent: "#5C5CFF" },
            { label: "Efficiency",    value: `${stats.rate}%`,   sub: "System rate", icon: TrendingUp, accent: "#00F0FF" },
            { label: "Active Vectors",value: stats.activeGoals,  sub: "Processing",  icon: CheckCircle2, accent: "#F97316" },
            { label: "Computations",  value: stats.done,         sub: `of ${stats.total} reqs`, icon: Clock, accent: "#8B5CF6" },
          ].map((s, i) => (
            <motion.div key={s.label} variants={slideUp} {...cardHover}
              className="glass-panel p-5 card-interactive">
              <div className="flex items-start justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">{s.label}</span>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-inner" style={{ background: `${s.accent}15`, border: `1px solid ${s.accent}30` }}>
                  <s.icon className="w-4 h-4" style={{ color: s.accent }} />
                </div>
              </div>
              <p className="text-3xl font-black tracking-tighter text-white">{s.value}</p>
              <p className="text-[11px] font-semibold text-zinc-600 tracking-wide mt-1 uppercase">{s.sub}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ─── MAIN 3-COLUMN GRID ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr_300px] gap-8">

          {/* LEFT COLUMN ─── Today's Schedule ─── */}
          <motion.div variants={slideUp} className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Execution Queue</span>
              <Link href="/tasks" className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors">
                View All
              </Link>
            </div>
            <div className="glass-panel p-2">
              <TodayView />
              <div className="mt-4 border-t border-white/5 pt-4">
                <DoneView />
              </div>
            </div>
          </motion.div>

          {/* CENTER COLUMN ─── AI Intelligence Core ─── */}
          <motion.div variants={slideUp} className="space-y-6">

            {/* AI Core Header */}
            <div className="glass-panel p-8 relative overflow-hidden group">
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="absolute -inset-24 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
              
              <div className="relative z-10 flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(92,92,255,0.2)]">
                  <BrainCircuit className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight">Intelligence Matrix</h2>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Agent Orchestrator Online</p>
                </div>
                <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-ring" />
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live</span>
                </div>
              </div>
              
              <div className="relative z-10">
                <NextActionHero />
              </div>
            </div>

            {/* Focus Cycle Tracker */}
            <div className="glass-panel p-6">
              <div className="flex items-center gap-2 mb-6 px-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Flow State Sessions</span>
              </div>
              <FocusCycleWidget />
            </div>

            {/* Fitness Snapshot */}
            <Link href="/fitness" className="block">
              <motion.div whileHover={{ scale: 1.01 }} className="glass-panel p-6 card-interactive group hover:border-emerald-500/30">
                <div className="flex items-center justify-between mb-6 px-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Biometrics</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { icon: Footprints, val: "7,842", label: "Steps", color: "#6366f1" },
                    { icon: Flame,      val: "1,840", label: "Kcal",  color: "#f97316" },
                    { icon: Activity,   val: "48m",   label: "Active",color: "#22c55e" },
                  ].map(m => (
                    <div key={m.label} className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 group-hover:border-white/20 transition-colors">
                        <m.icon className="w-5 h-5" style={{ color: m.color }} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-black text-white">{m.val}</p>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">{m.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </Link>
          </motion.div>

          {/* RIGHT COLUMN ─── Intelligence Feeds ─── */}
          <motion.div variants={slideUp} className="space-y-6">
            <div className="glass-panel p-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 block mb-4 px-2">Vector Balance</span>
              <DomainInsights />
            </div>
            <div className="glass-panel p-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 block mb-4 px-2">Autonomy Logs</span>
              <AgentDecisionWidget />
            </div>
            <div className="glass-panel p-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 block mb-4 px-2">Command History</span>
              <IntentHistory />
            </div>
          </motion.div>

        </div>

        {/* ─── FOOTER ─────────────────────────────────────────────────── */}
        <footer className="flex justify-between items-center py-8 opacity-40">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Void UI Pattern Active</span>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">System v1.0.5</span>
        </footer>

      </div>
    </motion.div>
  );
}

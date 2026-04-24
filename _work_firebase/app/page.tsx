"use client";

import { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { getGoals, getTasks } from "../data/db";
import { useStore } from "../core/store";
import { Wand2, TrendingUp, CheckCircle2, Clock, Target, ArrowRight, BrainCircuit, Zap, Flame, Footprints, Activity } from "lucide-react";
import { calculateSchedule, getAutoRescheduledUpdates } from "../lib/scheduler";
import { eventBus, OS_EVENTS } from "../core/events";
import { runAgentAction } from "../core/agent/orchestrator";
import { createAgentAction } from "../core/agent/types";
import { motion } from "framer-motion";
import { fadeIn, slideUp, staggerContainer, cardHover, buttonHover } from "../lib/animations";
import Link from "next/link";

// Lazy-loaded widgets
const NextActionHero     = dynamic(() => import("../components/dashboard/NextActionHero"), { ssr: false });
const TodayView          = dynamic(() => import("../components/dashboard/TodayView"), { ssr: false, loading: () => <div className="space-y-2 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl bg-white/[0.03]" />)}</div> });
const DoneView           = dynamic(() => import("../components/dashboard/DoneView"), { ssr: false });
const DomainInsights     = dynamic(() => import("../components/dashboard/DomainInsights"), { ssr: false });
const AgentDecisionWidget = dynamic(() => import("../components/dashboard/AgentDecisionWidget"), { ssr: false });
const FocusCycleWidget   = dynamic(() => import("../components/dashboard/FocusCycleWidget"), { ssr: false });
const IntentHistory      = dynamic(() => import("../components/dashboard/IntentHistory"), { ssr: false });

const HOUR = new Date().getHours();
const GREETING = HOUR < 12 ? "Good Morning" : HOUR < 17 ? "Good Afternoon" : "Good Evening";

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

  const handlePlanDay = async () => {
    try {
      const planUpdates = await calculateSchedule(tasks, goals);
      if (planUpdates.length > 0) {
        const action = createAgentAction("bulk_schedule", { updates: planUpdates }, "System-wide schedule optimization.");
        await runAgentAction(action);
        bulkUpdateTasksInStore(planUpdates);
        eventBus.emit(OS_EVENTS.PLAN_CREATED, { count: planUpdates.length });
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const onAction = (action: any) => {
      if (["create_task", "bulk_create_tasks", "create_goal_with_tasks"].includes(action.type)) handlePlanDay();
    };
    eventBus.on(OS_EVENTS.ACTION_EXECUTED, onAction);
    return () => eventBus.off(OS_EVENTS.ACTION_EXECUTED, onAction);
  }, [tasks, goals]);

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
      className="h-full overflow-y-auto bg-black"
    >
      {/* ─── AMBIENT BACKGROUND ──────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[10%] w-[50%] h-[50%] bg-indigo-600/[0.06] rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[5%] w-[35%] h-[40%] bg-violet-500/[0.04] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 p-6 xl:p-8 space-y-6 max-w-[1400px] mx-auto">

        {/* ─── HEADER ─────────────────────────────────────────────────── */}
        <motion.div variants={fadeIn} className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-600 mb-1">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className="text-3xl font-black tracking-tight text-white">
              {GREETING} <span className="text-indigo-400">.</span>
            </h1>
          </div>
          <motion.button
            {...buttonHover}
            onClick={handlePlanDay}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Wand2 className="w-4 h-4" />
            Plan My Day
          </motion.button>
        </motion.div>

        {/* ─── TOP STAT STRIP ─────────────────────────────────────────── */}
        <motion.div variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Focus State",   value: stats.rate > 70 ? "Deep Flow" : stats.rate > 40 ? "Active" : "Warming Up", sub: `${stats.done}/${stats.total} tasks`, icon: Target,      accent: "#6366f1" },
            { label: "Today's Rate",  value: `${stats.rate}%`,   sub: "Completion",          icon: TrendingUp,  accent: "#22c55e" },
            { label: "Active Goals",  value: stats.activeGoals,  sub: "In progress",          icon: CheckCircle2,accent: "#f97316" },
            { label: "Tasks Done",    value: stats.done,          sub: `of ${stats.total} today`, icon: Clock,   accent: "#8b5cf6" },
          ].map((s, i) => (
            <motion.div key={s.label} variants={slideUp} {...cardHover}
              className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 hover:bg-white/[0.05] transition-all cursor-default">
              <div className="flex items-start justify-between mb-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">{s.label}</span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${s.accent}20` }}>
                  <s.icon className="w-3.5 h-3.5" style={{ color: s.accent }} />
                </div>
              </div>
              <p className="text-2xl font-black tracking-tight text-white">{s.value}</p>
              <p className="text-[10px] text-zinc-600 mt-1">{s.sub}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ─── MAIN 3-COLUMN GRID ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_280px] gap-6">

          {/* LEFT COLUMN ─── Today's Schedule ─── */}
          <motion.div variants={slideUp} className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">Today's Agenda</span>
              <Link href="/tasks" className="text-[9px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1 hover:text-indigo-300 transition-colors">
                All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <TodayView />
            <DoneView />
          </motion.div>

          {/* CENTER COLUMN ─── AI Intelligence Core ─── */}
          <motion.div variants={slideUp} className="space-y-5">

            {/* AI Core Header */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
                  <BrainCircuit className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">Motion Intelligence</p>
                  <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Autonomous Agent · Active</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Live</span>
                </div>
              </div>
              <NextActionHero />
            </div>

            {/* Focus Cycle Tracker */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Focus Cycles</span>
              </div>
              <FocusCycleWidget />
            </div>

            {/* Fitness Snapshot */}
            <Link href="/fitness">
              <motion.div whileHover={{ scale: 1.01 }} className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-5 cursor-pointer hover:bg-white/[0.05] hover:border-emerald-500/20 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Fitness Snapshot</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-emerald-400 transition-colors" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Footprints, val: "7,842", label: "Steps", color: "#6366f1" },
                    { icon: Flame,      val: "1,840", label: "kcal",  color: "#f97316" },
                    { icon: Activity,   val: "48m",   label: "Active",color: "#22c55e" },
                  ].map(m => (
                    <div key={m.label} className="flex flex-col items-center gap-1.5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${m.color}20` }}>
                        <m.icon className="w-4.5 h-4.5" style={{ color: m.color }} />
                      </div>
                      <p className="text-sm font-black text-white">{m.val}</p>
                      <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">{m.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </Link>
          </motion.div>

          {/* RIGHT COLUMN ─── Intelligence Feeds ─── */}
          <motion.div variants={slideUp} className="space-y-5">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 block mb-3">Life Balance</span>
              <DomainInsights />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 block mb-3">Agent Decisions</span>
              <AgentDecisionWidget />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 block mb-3">Recent Intents</span>
              <IntentHistory />
            </div>
          </motion.div>

        </div>

        {/* ─── FOOTER ─────────────────────────────────────────────────── */}
        <footer className="flex justify-between items-center pt-6 border-t border-white/[0.04]">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-800">Motion OS · v1.0.4</span>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-800">Intelligence Layer Active</span>
        </footer>

      </div>
    </motion.div>
  );
}

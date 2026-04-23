"use client";

import { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { getGoals, getTasks } from "../data/db";
import { useStore } from "../core/store";
import { Wand2, TrendingUp, CheckCircle2, Clock, Target, ArrowRight } from "lucide-react";
import { calculateSchedule, getAutoRescheduledUpdates } from "../lib/scheduler";
import { eventBus, OS_EVENTS } from "../core/events";
import { runAgentAction } from "../core/agent/orchestrator";
import { createAgentAction } from "../core/agent/types";
import { motion } from "framer-motion";
import { fadeIn, slideUp, staggerContainer, cardHover, buttonHover } from "../lib/animations";

// Lazy-loaded widgets
const NextActionHero = dynamic(() => import("../components/dashboard/NextActionHero"), { ssr: false });
const TodayView      = dynamic(() => import("../components/dashboard/TodayView"), {
  ssr: false,
  loading: () => (
    <div className="space-y-3 animate-pulse">
      {[1,2,3].map(i => (
        <div key={i} className="h-16 rounded-2xl" style={{ background: "var(--bg-card)", borderColor: "var(--border-default)", border: "1px solid" }} />
      ))}
    </div>
  ),
});
const DoneView      = dynamic(() => import("../components/dashboard/DoneView"), { ssr: false });
const DomainInsights = dynamic(() => import("../components/dashboard/DomainInsights"), { ssr: false });
const AgentDecisionWidget = dynamic(() => import("../components/dashboard/AgentDecisionWidget"), { ssr: false });
const ModuleWidgets = dynamic(() => import("../components/dashboard/ModuleWidgets"), { ssr: false });
const IntentHistory = dynamic(() => import("../components/dashboard/IntentHistory"), { ssr: false });
const FocusCycleWidget = dynamic(() => import("../components/dashboard/FocusCycleWidget"), { ssr: false });

export default function Home() {
  const goals = useStore((state) => state.goals);
  const tasks = useStore((state) => state.tasks);
  const setGoals = useStore((state) => state.setGoals);
  const setTasks = useStore((state) => state.setTasks);
  const bulkUpdateTasksInStore = useStore((state) => state.bulkUpdateTasks);

  // Quick stats
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayTasks = tasks.filter(t => new Date(t.scheduledAt).toDateString() === today);
    const done = todayTasks.filter(t => t.status === "done").length;
    const total = todayTasks.length;
    const activeGoals = goals.filter(g => g.status !== "completed").length;
    return { done, total, rate: total > 0 ? Math.round((done / total) * 100) : 0, activeGoals };
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
    } catch (error) {
      console.error("Plan optimization failed:", error);
    }
  };

  useEffect(() => {
    const handleActionExecuted = (action: any) => {
      const isCreation = ["create_task", "bulk_create_tasks", "create_goal_with_tasks"].includes(action.type);
      if (isCreation) handlePlanDay();
    };
    eventBus.on(OS_EVENTS.ACTION_EXECUTED, handleActionExecuted);
    return () => eventBus.off(OS_EVENTS.ACTION_EXECUTED, handleActionExecuted);
  }, [tasks, goals]);

  useEffect(() => {
    async function hydrate() {
      try {
        const [fetchedGoals, fetchedTasks] = await Promise.all([getGoals(), getTasks()]);
        setGoals(fetchedGoals);
        setTasks(fetchedTasks);

        const rescheduleUpdates = await getAutoRescheduledUpdates(fetchedTasks);
        if (rescheduleUpdates.length > 0) {
          const action = createAgentAction("bulk_schedule", { updates: rescheduleUpdates }, "Auto-rescheduling overdue tasks.");
          await runAgentAction(action);
          bulkUpdateTasksInStore(rescheduleUpdates);
        }

        const lastPlanDate = localStorage.getItem("motion_last_autoplan");
        const todayStr = new Date().toDateString();
        if (lastPlanDate !== todayStr) {
          const planUpdates = await calculateSchedule(fetchedTasks, fetchedGoals);
          if (planUpdates.length > 0) {
            const action = createAgentAction("bulk_schedule", { updates: planUpdates }, "Optimizing daily schedule.");
            await runAgentAction(action);
            bulkUpdateTasksInStore(planUpdates);
            eventBus.emit(OS_EVENTS.PLAN_CREATED, { count: planUpdates.length });
          }
          localStorage.setItem("motion_last_autoplan", todayStr);
        }
      } catch (error) {
        console.error("Failed to hydrate dashboard:", error);
      }
    }
    hydrate();
  }, [setGoals, setTasks, bulkUpdateTasksInStore]);

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="p-8 space-y-8 max-w-6xl mx-auto"
    >

      {/* ── Quick Stats Bar ───────────────────────────────────── */}
      <motion.div 
        variants={staggerContainer}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          {
            label: "FOCUS STATE",
            value: stats.rate > 70 ? "Deep" : stats.rate > 40 ? "Moderate" : "Light",
            sub: `${stats.done} of ${stats.total} tasks done`,
            icon: Target,
            color: "var(--accent-primary)",
          },
          {
            label: "TODAY'S RATE",
            value: `${stats.rate}%`,
            sub: "Completion rate",
            icon: TrendingUp,
            color: "var(--accent-primary)",
          },
          {
            label: "ACTIVE GOALS",
            value: stats.activeGoals,
            sub: "In progress",
            icon: CheckCircle2,
            color: "var(--accent-primary)",
          },
          {
            label: "TASKS DONE",
            value: stats.done,
            sub: `of ${stats.total} scheduled`,
            icon: Clock,
            color: "var(--accent-primary)",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            variants={slideUp}
            {...cardHover}
            className="card p-5 card-interactive"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-[9px] font-black uppercase tracking-[0.15em]" style={{ color: "var(--text-muted)" }}>
                {stat.label}
              </span>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "var(--accent-primary-light)" }}
              >
                <stat.icon className="w-3.5 h-3.5" style={{ color: "var(--accent-primary)" }} />
              </div>
            </div>
            <p className="text-3xl font-black tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>
              {stat.value}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{stat.sub}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Hero: Next Action ──────────────────────────────────── */}
      <motion.div variants={slideUp}>
        <NextActionHero />
      </motion.div>

      {/* ── Plan Day Button ────────────────────────────────────── */}
      <motion.div 
        variants={fadeIn}
        className="flex items-center gap-4"
      >
        <div className="flex-1 h-px" style={{ background: "var(--border-default)" }} />
        <motion.button
          {...buttonHover}
          onClick={handlePlanDay}
          className="btn-primary shine"
        >
          <Wand2 className="w-4 h-4" />
          Plan My Day
        </motion.button>
        <div className="flex-1 h-px" style={{ background: "var(--border-default)" }} />
      </motion.div>

      {/* ── Main Content Grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Today Timeline ──────────────── */}
        <motion.div variants={slideUp} className="lg:col-span-2 space-y-6">
          {/* Section header */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Today's Agenda
            </h2>
            <button
              className="flex items-center gap-1 text-xs font-semibold transition-all group"
              style={{ color: "var(--accent-primary)" }}
            >
              View All
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div>
            <TodayView />
          </div>

          {/* Focus Cycles */}
          <div>
            <FocusCycleWidget />
          </div>
        </motion.div>

        {/* Right: Sidebar Widgets ─────────────── */}
        <div className="space-y-6">
          <motion.div variants={slideUp}>
            <DomainInsights />
          </motion.div>
          <motion.div variants={slideUp}>
            <AgentDecisionWidget />
          </motion.div>
        </div>
      </div>

      {/* ── Have-Done List ─────────────────────────────────────── */}
      <motion.div variants={slideUp} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Completed Today
          </h2>
        </div>
        <DoneView />
      </motion.div>

      {/* ── Intent History + Modules ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={slideUp}>
          <IntentHistory />
        </motion.div>
        <motion.div variants={slideUp}>
          <ModuleWidgets />
        </motion.div>
      </div>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="pt-8 pb-4 flex justify-between text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border-subtle)" }}>
        <span>Motion OS v1.0</span>
        <span>Autonomous</span>
      </footer>
    </motion.div>
  );
}

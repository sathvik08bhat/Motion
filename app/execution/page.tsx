"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { getTasks, getGoals, type Task, type Goal } from "../../data/db";
import { useStore } from "../../core/store";
import { calculateSchedule } from "../../lib/scheduler";
import { runAgentAction } from "../../core/agent/orchestrator";
import { createAgentAction } from "../../core/agent/types";
import {
  Clock, CalendarDays, CalendarRange, ListTodo, Sparkles, Loader2,
  CheckCircle2, Circle, ChevronLeft, ChevronRight, Play, Pause,
  ExternalLink, Zap, Sun, Moon as MoonIcon, CloudSun
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn, slideUp, staggerContainer, buttonHover } from "../../lib/animations";
import {
  signInWithGoogle, isSignedIn, signOut,
  fetchTodayEvents, fetchMonthEvents,
  type CalendarEvent
} from "../../lib/services/googleCalendar";

type CalendarView = "day" | "month";

interface UnifiedTimelineItem {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  duration?: number;
  type: "task" | "event";
  status?: string;
  priority?: string;
  color?: string;
  source: "motion" | "google";
  htmlLink?: string;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM – 9 PM

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good Morning", icon: Sun };
  if (h < 17) return { text: "Good Afternoon", icon: CloudSun };
  return { text: "Good Evening", icon: MoonIcon };
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function ExecutionHubPage() {
  const { tasks, goals, setTasks, setGoals, updateTask } = useStore();
  const [calView, setCalView] = useState<CalendarView>("day");
  const [isPlanning, setIsPlanning] = useState(false);
  const [planResult, setPlanResult] = useState<string | null>(null);
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);
  const [gSignedIn, setGSignedIn] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [monthDate, setMonthDate] = useState(new Date());
  const [monthEvents, setMonthEvents] = useState<CalendarEvent[]>([]);

  const greeting = getGreeting();
  const GreetIcon = greeting.icon;
  const today = new Date();

  // Hydrate from DB
  useEffect(() => {
    (async () => {
      try {
        const [g, t] = await Promise.all([getGoals(), getTasks()]);
        setGoals(g);
        setTasks(t);
      } catch (e) { console.error(e); }
    })();
  }, [setGoals, setTasks]);

  // Check Google sign-in on mount
  useEffect(() => {
    setGSignedIn(isSignedIn());
  }, []);

  // Fetch Google events when signed in
  useEffect(() => {
    if (!gSignedIn) return;
    (async () => {
      try {
        const evts = await fetchTodayEvents();
        setGoogleEvents(evts);
      } catch (e) { console.error(e); }
    })();
  }, [gSignedIn]);

  // Fetch month events
  useEffect(() => {
    if (!gSignedIn || calView !== "month") return;
    (async () => {
      try {
        const evts = await fetchMonthEvents(monthDate.getFullYear(), monthDate.getMonth());
        setMonthEvents(evts);
      } catch (e) { console.error(e); }
    })();
  }, [gSignedIn, calView, monthDate]);

  // Build unified timeline
  const timeline = useMemo<UnifiedTimelineItem[]>(() => {
    const items: UnifiedTimelineItem[] = [];

    // Scheduled Motion tasks (today)
    tasks.filter(t => t.status !== "done" && t.scheduledAt && isSameDay(new Date(t.scheduledAt), today))
      .forEach(t => items.push({
        id: `task-${t.id}`,
        title: t.title,
        start: new Date(t.scheduledAt),
        duration: t.duration,
        type: "task",
        status: t.status,
        priority: t.priority,
        source: "motion",
      }));

    // Google Calendar events
    googleEvents.filter(e => !e.allDay).forEach(e => items.push({
      id: `gcal-${e.id}`,
      title: e.title,
      start: e.start,
      end: e.end,
      type: "event",
      color: e.color,
      source: "google",
      htmlLink: e.htmlLink,
    }));

    items.sort((a, b) => a.start.getTime() - b.start.getTime());
    return items;
  }, [tasks, googleEvents]);

  // Unscheduled tasks
  const unscheduledTasks = useMemo(() =>
    tasks.filter(t => t.status !== "done" && (!t.scheduledAt || !isSameDay(new Date(t.scheduledAt), today))),
    [tasks]
  );

  // Stats
  const todayDone = tasks.filter(t => t.status === "done" && t.scheduledAt && isSameDay(new Date(t.scheduledAt), today)).length;
  const todayTotal = tasks.filter(t => t.scheduledAt && isSameDay(new Date(t.scheduledAt), today)).length;

  // AI Plan My Day
  const handlePlanMyDay = useCallback(async () => {
    setIsPlanning(true);
    setPlanResult(null);
    try {
      const updates = await calculateSchedule(tasks, goals);
      const action = createAgentAction("bulk_schedule", { updates }, "AI-powered daily schedule optimization");
      await runAgentAction(action);
      setPlanResult(`Optimized ${updates.length} tasks for today.`);
    } catch (e) {
      console.error(e);
      setPlanResult("Failed to plan. Try again.");
    } finally {
      setIsPlanning(false);
    }
  }, [tasks, goals]);

  // Google sign-in
  const handleGoogleSignIn = async () => {
    setGLoading(true);
    try {
      await signInWithGoogle();
      setGSignedIn(true);
      const evts = await fetchTodayEvents();
      setGoogleEvents(evts);
    } catch (e) { console.error(e); }
    finally { setGLoading(false); }
  };

  // Complete task
  const handleComplete = (taskId: number) => {
    updateTask(taskId, { status: "done" });
  };

  // Now marker position (percentage of the day 7AM-9PM)
  const nowPercent = useMemo(() => {
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    return Math.max(0, Math.min(100, ((mins - 420) / 840) * 100));
  }, []);

  // Month calendar grid
  const monthGrid = useMemo(() => {
    const y = monthDate.getFullYear();
    const m = monthDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      week.push(d);
      if (week.length === 7) { weeks.push(week); week = []; }
    }
    if (week.length) { while (week.length < 7) week.push(null); weeks.push(week); }
    return weeks;
  }, [monthDate]);

  const priorityColor = (p?: string) => {
    if (p === "high") return "#ef4444";
    if (p === "medium") return "var(--accent-primary)";
    return "var(--text-muted)";
  };

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <motion.header variants={fadeIn} className="space-y-1">
        <div className="flex items-center gap-2 mb-1">
          <GreetIcon className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--accent-primary)" }}>{greeting.text}</p>
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>Execution Hub</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Your unified command center for today&apos;s tasks and calendar.</p>
      </motion.header>

      {/* Stats + Actions Row */}
      <motion.div variants={slideUp} className="flex flex-wrap items-center gap-3">
        {/* Progress Pill */}
        <div className="card px-4 py-2.5 flex items-center gap-3">
          <div className="relative w-9 h-9">
            <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--border-default)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--accent-primary)" strokeWidth="3"
                strokeDasharray={`${todayTotal ? (todayDone / todayTotal) * 94.2 : 0} 94.2`}
                strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black" style={{ color: "var(--accent-primary)" }}>
              {todayTotal ? Math.round((todayDone / todayTotal) * 100) : 0}%
            </span>
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{todayDone}/{todayTotal} done</p>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Today&apos;s progress</p>
          </div>
        </div>

        {/* AI Plan Button */}
        <motion.button {...buttonHover} onClick={handlePlanMyDay} disabled={isPlanning}
          className="btn-primary gap-2 shine" style={{ opacity: isPlanning ? 0.7 : 1 }}>
          {isPlanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {isPlanning ? "Planning..." : "Plan My Day"}
        </motion.button>

        {/* Google Sync */}
        {!gSignedIn ? (
          <motion.button {...buttonHover} onClick={handleGoogleSignIn} disabled={gLoading} className="btn-ghost gap-2">
            {gLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarDays className="w-3.5 h-3.5" />}
            Sync Google Calendar
          </motion.button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider"
            style={{ background: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
            <CheckCircle2 className="w-3 h-3" /> Google Synced
          </div>
        )}

        {/* Calendar Toggle */}
        <div className="ml-auto flex items-center p-1 rounded-xl gap-1"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-default)" }}>
          {(["day", "month"] as const).map(v => (
            <button key={v} onClick={() => setCalView(v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: calView === v ? "var(--bg-card)" : "transparent",
                color: calView === v ? "var(--accent-primary)" : "var(--text-muted)",
                boxShadow: calView === v ? "var(--shadow-sm)" : "none",
              }}>
              {v === "day" ? <Clock className="w-3.5 h-3.5" /> : <CalendarRange className="w-3.5 h-3.5" />}
              {v === "day" ? "Day" : "Month"}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Plan Result Banner */}
      <AnimatePresence>
        {planResult && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className="card px-4 py-3 flex items-center gap-3"
              style={{ borderColor: "var(--accent-primary)", background: "var(--accent-primary-light)" }}>
              <Zap className="w-4 h-4 flex-shrink-0" style={{ color: "var(--accent-primary)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--accent-primary)" }}>{planResult}</p>
              <button onClick={() => setPlanResult(null)} className="ml-auto text-xs font-bold" style={{ color: "var(--text-muted)" }}>✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Timeline / Calendar */}
        <motion.div variants={slideUp} className="lg:col-span-2 space-y-4">
          {calView === "day" ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                  <Clock className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                  Today&apos;s Timeline
                </h2>
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                  {today.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                </span>
              </div>

              {/* Timeline */}
              <div className="card overflow-hidden" style={{ padding: 0 }}>
                <div className="relative" style={{ minHeight: 600 }}>
                  {/* Hour lines */}
                  {HOURS.map(h => {
                    const pct = ((h - 7) / 14) * 100;
                    return (
                      <div key={h} className="absolute left-0 right-0 flex items-start" style={{ top: `${pct}%` }}>
                        <span className="w-14 text-right pr-3 text-[10px] font-semibold flex-shrink-0 -translate-y-1/2"
                          style={{ color: "var(--text-muted)" }}>
                          {h > 12 ? `${h - 12} PM` : h === 12 ? "12 PM" : `${h} AM`}
                        </span>
                        <div className="flex-1 border-t" style={{ borderColor: "var(--border-subtle)" }} />
                      </div>
                    );
                  })}

                  {/* Now indicator */}
                  <div className="absolute left-14 right-0 flex items-center z-10 pointer-events-none" style={{ top: `${nowPercent}%` }}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#ef4444" }} />
                    <div className="flex-1 border-t-2" style={{ borderColor: "#ef4444" }} />
                  </div>

                  {/* Events + Tasks */}
                  {timeline.map(item => {
                    const startMins = item.start.getHours() * 60 + item.start.getMinutes();
                    const top = ((startMins - 420) / 840) * 100;
                    const dur = item.duration || (item.end ? (item.end.getTime() - item.start.getTime()) / 60000 : 30);
                    const height = Math.max((dur / 840) * 100, 2.5);
                    const isEvent = item.type === "event";

                    return (
                      <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        className="absolute right-2 rounded-lg px-3 py-2 cursor-pointer group transition-all"
                        style={{
                          top: `${Math.max(0, Math.min(97, top))}%`,
                          height: `${height}%`,
                          minHeight: 32,
                          left: 64,
                          background: isEvent ? (item.color || "var(--accent-primary-light)") : "var(--bg-card)",
                          border: `1px solid ${isEvent ? "transparent" : "var(--border-default)"}`,
                          borderLeft: `3px solid ${isEvent ? (item.color || "var(--accent-primary)") : priorityColor(item.priority)}`,
                          zIndex: 5,
                        }}>
                        <div className="flex items-center gap-2 h-full overflow-hidden">
                          {!isEvent && (
                            <button onClick={() => { const id = parseInt(item.id.replace("task-", "")); handleComplete(id); }}
                              className="flex-shrink-0 transition-colors" style={{ color: "var(--text-muted)" }}>
                              <Circle className="w-3.5 h-3.5 group-hover:hidden" />
                              <CheckCircle2 className="w-3.5 h-3.5 hidden group-hover:block" style={{ color: "var(--accent-primary)" }} />
                            </button>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate" style={{ color: isEvent ? "white" : "var(--text-primary)" }}>{item.title}</p>
                            <p className="text-[9px]" style={{ color: isEvent ? "rgba(255,255,255,0.7)" : "var(--text-muted)" }}>
                              {formatTime(item.start)}{item.duration ? ` · ${item.duration}m` : ""}
                            </p>
                          </div>
                          {item.htmlLink && (
                            <a href={item.htmlLink} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ExternalLink className="w-3 h-3" style={{ color: "rgba(255,255,255,0.7)" }} />
                            </a>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}

                  {timeline.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <CalendarDays className="w-8 h-8 mx-auto" style={{ color: "var(--text-muted)" }} />
                        <p className="text-sm" style={{ color: "var(--text-muted)" }}>No scheduled items today</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Click &quot;Plan My Day&quot; to get started</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Month View */
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                  <CalendarRange className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                  {monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                </h2>
                <div className="flex items-center gap-1">
                  <button className="btn-ghost p-1.5" onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1))}>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button className="btn-ghost px-2 py-1 text-xs" onClick={() => setMonthDate(new Date())}>Today</button>
                  <button className="btn-ghost p-1.5" onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1))}>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="card overflow-hidden" style={{ padding: 0 }}>
                {/* Weekday headers */}
                <div className="grid grid-cols-7 border-b" style={{ borderColor: "var(--border-default)" }}>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                    <div key={d} className="py-2 text-center text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{d}</div>
                  ))}
                </div>

                {/* Days */}
                {monthGrid.map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7 border-b last:border-b-0" style={{ borderColor: "var(--border-subtle)" }}>
                    {week.map((day, di) => {
                      const isToday = day && isSameDay(new Date(monthDate.getFullYear(), monthDate.getMonth(), day), today);
                      const dayEvents = day ? monthEvents.filter(e => {
                        const d = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
                        return isSameDay(e.start, d);
                      }) : [];
                      const dayTasks = day ? tasks.filter(t => {
                        if (!t.scheduledAt) return false;
                        const d = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
                        return isSameDay(new Date(t.scheduledAt), d);
                      }) : [];

                      return (
                        <div key={di} className="min-h-[80px] p-1.5 transition-colors"
                          style={{ background: isToday ? "var(--accent-primary-light)" : "transparent" }}>
                          {day && (
                            <>
                              <span className={`text-xs font-bold block mb-1 ${isToday ? "text-center" : ""}`}
                                style={{
                                  color: isToday ? "var(--accent-primary)" : "var(--text-secondary)",
                                  ...(isToday ? { background: "var(--accent-primary)", color: "white", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 } : {}),
                                }}>
                                {day}
                              </span>
                              {dayEvents.slice(0, 2).map(e => (
                                <div key={e.id} className="text-[9px] font-medium truncate px-1 py-0.5 rounded mb-0.5"
                                  style={{ background: e.color || "var(--accent-primary)", color: "white" }}>
                                  {e.title}
                                </div>
                              ))}
                              {dayTasks.slice(0, 2).map(t => (
                                <div key={t.id} className="text-[9px] font-medium truncate px-1 py-0.5 rounded mb-0.5"
                                  style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
                                  {t.title}
                                </div>
                              ))}
                              {(dayEvents.length + dayTasks.length) > 4 && (
                                <span className="text-[8px] font-bold" style={{ color: "var(--text-muted)" }}>
                                  +{dayEvents.length + dayTasks.length - 4} more
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>

        {/* RIGHT: Unscheduled Task List */}
        <motion.div variants={slideUp} className="space-y-4">
          <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
            <ListTodo className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
            Backlog
            {unscheduledTasks.length > 0 && (
              <span className="badge badge-accent ml-1">{unscheduledTasks.length}</span>
            )}
          </h2>

          <div className="space-y-2">
            {unscheduledTasks.length === 0 ? (
              <div className="card p-6 text-center">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--accent-primary)" }} />
                <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>All caught up!</p>
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>No unscheduled tasks remaining.</p>
              </div>
            ) : (
              unscheduledTasks.slice(0, 15).map((task, i) => (
                <motion.div key={task.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="card px-3 py-2.5 flex items-center gap-3 group cursor-pointer"
                  style={{ borderLeft: `3px solid ${priorityColor(task.priority)}` }}>
                  <button onClick={() => task.id && handleComplete(task.id)} className="flex-shrink-0 transition-colors"
                    style={{ color: "var(--text-muted)" }}>
                    <Circle className="w-4 h-4 group-hover:hidden" />
                    <CheckCircle2 className="w-4 h-4 hidden group-hover:block" style={{ color: "var(--accent-primary)" }} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{task.title}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{task.duration}m · {task.priority}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Heart, Flame, Moon, Footprints, TrendingUp, Zap, BrainCircuit, RefreshCw } from "lucide-react";
import { staggerContainer, slideUp, fadeIn } from "../../lib/animations";

interface FitnessData {
  steps: number;
  heartRate: number;
  calories: number;
  sleepHours: number;
  activeMinutes: number;
  weeklySteps: number[];
}

const MOCK_DATA: FitnessData = {
  steps: 7842,
  heartRate: 72,
  calories: 1840,
  sleepHours: 7.2,
  activeMinutes: 48,
  weeklySteps: [6200, 8100, 5400, 9200, 7842, 0, 0],
};

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const maxSteps = 10000;

function RingChart({ value, max, color, size = 80 }: { value: number; max: number; color: string; size?: number }) {
  const pct = Math.min(value / max, 1);
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />
    </svg>
  );
}

export default function FitnessPage() {
  const [data, setData] = useState<FitnessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState("");

  useEffect(() => {
    setTimeout(() => {
      setData(MOCK_DATA);
      setAiInsight("Your step count is 78% of your goal. Based on your pattern, a 15-min walk after dinner will close the gap. Heart rate trend looks healthy — keep up the consistency.");
      setLoading(false);
    }, 800);
  }, []);

  const metrics = data ? [
    { label: "Steps", value: data.steps.toLocaleString(), goal: "10,000", icon: Footprints, color: "#6366f1", ring: data.steps, ringMax: 10000 },
    { label: "Heart Rate", value: `${data.heartRate} bpm`, goal: "Resting", icon: Heart, color: "#ef4444", ring: data.heartRate, ringMax: 120 },
    { label: "Calories", value: data.calories.toLocaleString(), goal: "2,200 kcal", icon: Flame, color: "#f97316", ring: data.calories, ringMax: 2200 },
    { label: "Sleep", value: `${data.sleepHours}h`, goal: "8h target", icon: Moon, color: "#8b5cf6", ring: data.sleepHours, ringMax: 8 },
    { label: "Active Min", value: `${data.activeMinutes}m`, goal: "60 min goal", icon: Activity, color: "#22c55e", ring: data.activeMinutes, ringMax: 60 },
  ] : [];

  return (
    <motion.div
      initial="initial" animate="animate" variants={staggerContainer}
      className="p-8 max-w-6xl mx-auto space-y-8"
    >
      {/* Header */}
      <motion.div variants={fadeIn} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Fitness <span className="text-indigo-400">Hub</span></h1>
          <p className="text-zinc-500 text-sm mt-1">Synced from Google Fit · Updated just now</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-400 text-sm hover:bg-white/[0.08] transition-all">
          <RefreshCw className="w-4 h-4" /> Sync
        </button>
      </motion.div>

      {/* Metric Cards */}
      <motion.div variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {loading ? Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-40 rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse" />
        )) : metrics.map((m) => (
          <motion.div key={m.label} variants={slideUp}
            className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 flex flex-col items-center gap-3 hover:bg-white/[0.05] transition-all">
            <div className="relative">
              <RingChart value={m.ring} max={m.ringMax} color={m.color} size={72} />
              <div className="absolute inset-0 flex items-center justify-center">
                <m.icon className="w-5 h-5" style={{ color: m.color }} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-white font-black text-lg">{m.value}</p>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{m.label}</p>
              <p className="text-[9px] text-zinc-700 mt-0.5">{m.goal}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Weekly Steps Chart + AI Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Steps */}
        <motion.div variants={slideUp} className="lg:col-span-2 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">Weekly Steps</h2>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-end gap-3 h-32">
            {MOCK_DATA.weeklySteps.map((s, i) => {
              const h = s > 0 ? Math.max((s / maxSteps) * 100, 8) : 8;
              const isToday = i === 4;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                    className="w-full rounded-lg"
                    style={{
                      background: isToday
                        ? "linear-gradient(180deg, #6366f1, #4f46e5)"
                        : s === 0 ? "rgba(255,255,255,0.04)" : "rgba(99,102,241,0.25)"
                    }}
                  />
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${isToday ? "text-indigo-400" : "text-zinc-600"}`}>
                    {days[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* AI Insight */}
        <motion.div variants={slideUp} className="bg-indigo-500/[0.08] border border-indigo-500/20 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-indigo-400">AI Health Coach</p>
              <p className="text-[9px] text-zinc-600">Powered by Motion Agent</p>
            </div>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed flex-1">{aiInsight || "Analyzing your health data..."}</p>
          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Auto-optimizing your schedule</span>
          </div>
        </motion.div>
      </div>

      {/* Activity Timeline */}
      <motion.div variants={slideUp} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-4">Activity Today</h2>
        <div className="space-y-3">
          {[
            { time: "07:15 AM", label: "Morning Walk", detail: "2,100 steps · 18 min", color: "#22c55e" },
            { time: "12:30 PM", label: "Active Break", detail: "800 steps · 8 min", color: "#f97316" },
            { time: "06:00 PM", label: "Evening Run", detail: "4,942 steps · 22 min", color: "#6366f1" },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-zinc-600 w-16 shrink-0">{a.time}</span>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: a.color }} />
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{a.label}</p>
                <p className="text-[10px] text-zinc-500">{a.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

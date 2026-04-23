"use client";

import React from 'react';
import { useStore } from "../../core/store";
import { CheckCircle2, Trophy, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { fadeIn, cardHover } from "../../lib/animations";

export default function DoneView() {
  const tasks = useStore((state) => state.tasks);

  const todayStr = new Date().toDateString();
  const doneToday = tasks.filter((t) => 
    t.status === "done" && 
    new Date(t.scheduledAt).toDateString() === todayStr
  );

  if (doneToday.length === 0) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between border-b border-zinc-800/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Trophy className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tighter text-white">
              Accomplishments
            </h2>
            <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest">
              You completed {doneToday.length} tasks today
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {doneToday.map((task) => (
          <motion.div
            key={task.id}
            variants={fadeIn}
            initial="initial"
            animate="animate"
            {...cardHover}
            className="flex items-center gap-4 bg-emerald-500/[0.02] border border-emerald-500/10 p-4 rounded-2xl"
          >
            <div className="flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-500/50" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-zinc-400 truncate line-through decoration-zinc-700">
                {task.title}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                  Validated by Agent
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

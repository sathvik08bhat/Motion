"use client";

import React, { useEffect, useState } from 'react';
import { eventBus, OS_EVENTS } from '../../core/events';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export default function SuccessOverlay() {
  const [show, setShow] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');

  useEffect(() => {
    const unsub = eventBus.on(OS_EVENTS.TASK_COMPLETED, (task: any) => {
      setTaskTitle(task.title);
      setShow(true);
      setTimeout(() => setShow(false), 3000);
    });
    return unsub;
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center p-6">
      <div className="bg-zinc-950 border border-emerald-500/30 p-6 rounded-[2.5rem] shadow-[0_0_50px_rgba(16,185,129,0.2)] animate-in zoom-in fade-in duration-500 flex flex-col items-center text-center space-y-4 max-w-sm">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 animate-pulse"></div>
          <div className="relative p-4 bg-emerald-500/20 rounded-full">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2 text-emerald-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Momentum Gained</span>
          </div>
          <h3 className="text-xl font-black text-white tracking-tight leading-tight">
            Task Accomplished
          </h3>
          <p className="text-sm font-bold text-zinc-400">
            {taskTitle}
          </p>
        </div>

        <div className="pt-2">
          <span className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest px-4 py-1.5 bg-emerald-500/5 rounded-full border border-emerald-500/10">
            +10 Mastery Points
          </span>
        </div>
      </div>
    </div>
  );
}

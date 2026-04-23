import React, { useMemo, useState, useEffect } from 'react';
import { useStore } from '../../core/store';
import { Wind, Coffee, Zap, Brain, Play, Pause, RotateCcw } from 'lucide-react';

export default function FocusCycleWidget() {
  const tasks = useStore((state) => state.tasks);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90 * 60); // 90 minutes in seconds
  const [cycle, setCycle] = useState(1);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Logic for break would go here
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const cycleData = useMemo(() => {
    const now = new Date();
    const todayTasks = tasks
      .filter(t => t.status !== 'done' && new Date(t.scheduledAt).toDateString() === now.toDateString())
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

    const currentTask = todayTasks.find(t => t.status === 'doing') || todayTasks[0];
    
    return {
      currentTaskTitle: currentTask?.title || "No active task"
    };
  }, [tasks]);

  return (
    <div className="p-6 rounded-3xl bg-emerald-600/10 border border-emerald-500/30 backdrop-blur-2xl space-y-6 shadow-[0_20px_50px_rgba(16,185,129,0.1)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/20 rounded-2xl">
            <Zap className={`w-6 h-6 text-emerald-400 ${isActive ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">Focus Cycle</h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em]">Deep Work</span>
              <span className="w-1 h-1 bg-emerald-500/30 rounded-full" />
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Cycle {cycle}/4</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsActive(!isActive)}
            className={`p-3 rounded-xl transition-all active:scale-95 ${
              isActive 
                ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' 
                : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-400'
            }`}
          >
            {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
          </button>
          <button 
            onClick={() => { setTimeLeft(90 * 60); setIsActive(false); }}
            className="p-3 bg-zinc-800 text-zinc-500 hover:text-white rounded-xl transition-all"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center py-4 space-y-2">
        <span className="text-6xl font-black tracking-tighter text-white tabular-nums">
          {formatTime(timeLeft)}
        </span>
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
          {isActive ? 'Session in progress' : 'Paused'}
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-zinc-950/40 rounded-2xl border border-white/5 flex items-center gap-4">
          <Brain className="w-5 h-5 text-zinc-600" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Active Target</p>
            <p className="text-sm font-bold text-zinc-200 truncate">{cycleData.currentTaskTitle}</p>
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-600 px-2">
          <span>0m</span>
          <span>Next Break: {formatTime(timeLeft)}</span>
          <span>90m</span>
        </div>
      </div>
    </div>
  );
}


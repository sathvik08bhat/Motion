"use client";

import { useEffect, useState } from "react";
import { 
  ShieldCheck, Activity, Cpu, Sliders, History, 
  CheckCircle2, AlertCircle, Clock, Zap, Eye, 
  MessageSquare, BrainCircuit, Target, Lock, 
  ChevronRight, ArrowRight, Loader2, Info, Wand2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useControlMode, type ControlMode } from "../../core/agent/control";
import { getAgentLogs, db, type ActionLog } from "../../data/db";
import { fadeIn, slideUp, staggerContainer, buttonHover } from "../../lib/animations";

export default function AgentControlHub() {
  const { currentMode, settings, setControlMode, updateSettings } = useControlMode();
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    async function loadLogs() {
      try {
        // Fetch action logs from the db
        const data = await db.action_logs.orderBy('timestamp').reverse().limit(50).toArray();
        setLogs(data);
      } catch (error) {
        console.error("Failed to load agent logs:", error);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  const modes: { id: ControlMode; label: string; desc: string; icon: any; color: string }[] = [
    { 
      id: "suggest_only", 
      label: "Suggest Only", 
      desc: "Agent identifies optimizations but never takes action. You are 100% in control.", 
      icon: Eye,
      color: "zinc"
    },
    { 
      id: "semi_auto", 
      label: "Semi-Auto", 
      desc: "Agent prepares actions and waits for your one-click approval. Maximum safety.", 
      icon: ShieldCheck,
      color: "indigo"
    },
    { 
      id: "full_auto", 
      label: "Full-Auto", 
      desc: "Agent manages your schedule autonomously. Best for hands-free productivity.", 
      icon: Zap,
      color: "amber"
    }
  ];

  const formatPayload = (payloadStr: string) => {
    try {
      const payload = JSON.parse(payloadStr);
      return JSON.stringify(payload, null, 2);
    } catch {
      return payloadStr;
    }
  };

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="p-6 md:p-10 max-w-6xl mx-auto space-y-10 pb-20">
      
      {/* Header Section */}
      <motion.header variants={fadeIn} className="space-y-1">
        <div className="flex items-center gap-2 mb-1">
          <BrainCircuit className="w-5 h-5 text-indigo-500" />
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Autonomous Core</p>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[var(--text-primary)]">Control Hub</h1>
        <p className="text-sm text-[var(--text-muted)] max-w-lg">
          Configure the Motion Agent's level of autonomy, behavior profiles, and audit the decision-making history for total transparency.
        </p>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Controls & Settings */}
        <div className="lg:col-span-1 space-y-10">
          
          {/* Autonomy Mode Selector */}
          <motion.section variants={slideUp} className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
              <Cpu className="w-4 h-4" /> Autonomy Mode
            </h2>
            <div className="space-y-3">
              {modes.map((mode) => (
                <div 
                  key={mode.id}
                  onClick={() => setControlMode(mode.id)}
                  className={`card p-4 cursor-pointer transition-all border-2 ${
                    currentMode === mode.id 
                      ? mode.id === 'full_auto' ? 'border-amber-500 bg-amber-500/5' : 'border-indigo-500 bg-indigo-500/5' 
                      : 'border-transparent hover:border-zinc-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      currentMode === mode.id 
                        ? mode.id === 'full_auto' ? 'bg-amber-500 text-black' : 'bg-indigo-500 text-white'
                        : 'bg-zinc-900 text-zinc-500'
                    }`}>
                      <mode.icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className={`text-sm font-bold ${currentMode === mode.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                        {mode.label}
                      </p>
                      <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                        {mode.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* AI Behavior Settings */}
          <motion.section variants={slideUp} className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
              <Sliders className="w-4 h-4" /> Behavior Profile
            </h2>
            <div className="card p-6 space-y-6">
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                  <span>Communication Tone</span>
                  <span className="text-indigo-400">{settings.tone}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {["concise", "helpful", "formal"].map((t) => (
                    <button 
                      key={t}
                      onClick={() => updateSettings({ tone: t as any })}
                      className={`text-[10px] font-bold py-2 rounded-lg border transition-all ${
                        settings.tone === t 
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' 
                          : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                  <span>Priority Sensitivity</span>
                  <span className="text-indigo-400">{Math.round(settings.priorityBias * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  value={settings.priorityBias}
                  onChange={(e) => updateSettings({ priorityBias: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-zinc-600">
                  <span>Relaxed</span>
                  <span>Strict</span>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-800 space-y-3">
                <button 
                  onClick={() => {
                    const { useModuleBuilder } = require("../../core/agent/moduleBuilder");
                    useModuleBuilder.getState().startBuilder("Manual Trigger");
                  }}
                  className="w-full btn-primary text-[10px] py-3 gap-2 shine"
                >
                  <Wand2 className="w-4 h-4" /> Build New Module
                </button>
                <div className="flex items-center gap-2 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                  <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                  <p className="text-[10px] text-indigo-300/80 leading-relaxed">
                    Behavior changes are applied instantly to the next proactive audit cycle.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

        </div>

        {/* Right Column: Transparency Logs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
            <h2 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
              <History className="w-5 h-5 text-zinc-500" /> Transparency Log
            </h2>
            <div className="flex items-center gap-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
              <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-green-500" /> Live Stream</span>
              <button onClick={() => window.location.reload()} className="hover:text-white transition-colors">Refresh</button>
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-700" />
              <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Decrypting logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-20 text-center space-y-4 border-2 border-dashed border-zinc-900 rounded-3xl">
              <History className="w-10 h-10 text-zinc-800 mx-auto" />
              <p className="text-zinc-500 text-sm">No actions recorded yet. Proactive audits occur every 5 minutes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {logs.map((log, i) => (
                  <motion.div 
                    key={log.id} 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: i * 0.05 }}
                    className="card group overflow-hidden"
                  >
                    <div 
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            log.status === 'executed' ? 'bg-green-500/10 text-green-500' : 
                            log.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 
                            'bg-indigo-500/10 text-indigo-500'
                          }`}>
                            {log.status === 'executed' ? <CheckCircle2 className="w-4 h-4" /> : 
                             log.status === 'rejected' ? <AlertCircle className="w-4 h-4" /> : 
                             <Zap className="w-4 h-4" />}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">
                                {log.type.replace('_', ' ')}
                              </p>
                              <span className="text-[10px] text-zinc-600 font-mono">
                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">
                              {log.reason}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                            log.status === 'executed' ? 'border-green-500/20 text-green-500' : 
                            log.status === 'rejected' ? 'border-red-500/20 text-red-500' : 
                            'border-indigo-500/20 text-indigo-500'
                          }`}>
                            {log.status}
                          </span>
                          <ChevronRight className={`w-4 h-4 text-zinc-700 transition-transform ${expandedLog === log.id ? 'rotate-90' : ''}`} />
                        </div>
                      </div>
                    </div>

                    {expandedLog === log.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-zinc-800 bg-black/40"
                      >
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                          
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                              <MessageSquare className="w-3.5 h-3.5" /> System Rationale
                            </h4>
                            <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 min-h-[80px]">
                              <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
                                "{log.reason}"
                              </p>
                            </div>
                            <p className="text-[10px] text-zinc-600 flex items-center gap-1.5">
                              <Info className="w-3 h-3" /> This action was determined to be optimal by the AI Core.
                            </p>
                          </div>

                          <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                              <Zap className="w-3.5 h-3.5" /> Payload Data
                            </h4>
                            <pre className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 text-[10px] font-mono text-zinc-400 overflow-x-auto">
                              {formatPayload(log.payload)}
                            </pre>
                          </div>

                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

      </div>

    </motion.div>
  );
}

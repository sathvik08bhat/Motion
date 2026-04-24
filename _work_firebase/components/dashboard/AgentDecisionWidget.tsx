"use client";

import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { Sparkles, History, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { listItemHover } from '../../lib/animations';

export default function AgentDecisionWidget() {
  const logs = useLiveQuery(() => db.agentLogs.orderBy('timestamp').reverse().limit(5).toArray()) || [];

  if (logs.length === 0) return null;

  return (
    <div className="p-5 rounded-2xl bg-indigo-600/5 border border-indigo-500/20 backdrop-blur-xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Agent Decisions</h3>
            <p className="text-[10px] text-indigo-400/60 font-black uppercase tracking-widest">Autonomous Trace</p>
          </div>
        </div>
        <History className="w-4 h-4 text-zinc-600" />
      </div>

      <div className="space-y-4">
        {logs.map((log) => (
          <motion.div 
            key={log.id} 
            {...listItemHover}
            className="relative pl-6 pb-4 border-l border-zinc-800 last:pb-0 p-2 rounded-lg"
          >
            <div className={`absolute -left-1.5 top-0 w-3 h-3 rounded-full border-2 border-black ${
              log.success ? 'bg-emerald-500' : 'bg-red-500'
            }`} />
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  {log.action.replace('_', ' ')}
                </span>
                <span className="text-[9px] font-medium text-zinc-600 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs font-bold text-zinc-200 leading-relaxed">
                {log.rationale}
              </p>
              {log.success ? (
                <div className="flex items-center gap-1.5 pt-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500/50" />
                  <span className="text-[9px] font-bold text-emerald-500/50 uppercase">Executed successfully</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 pt-1">
                  <AlertCircle className="w-3 h-3 text-red-500/50" />
                  <span className="text-[9px] font-bold text-red-500/50 uppercase">Blocked by safeguard</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

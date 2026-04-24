"use client";

import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getTasks } from '../../data/db';
import { analyzeDomains, detectImbalance } from '../../core/agent/domainEngine';
import { PieChart, AlertTriangle, TrendingUp, Activity, Book, Briefcase, User, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { listItemHover } from '../../lib/animations';

export default function DomainInsights() {
  const tasks = useLiveQuery(() => getTasks(), []);

  if (!tasks) return null;

  const stats = analyzeDomains(tasks);
  const imbalance = detectImbalance(stats);

  const domainIcons = {
    study: <Book className="w-3 h-3" />,
    health: <Activity className="w-3 h-3" />,
    work: <Briefcase className="w-3 h-3" />,
    personal: <User className="w-3 h-3" />,
    relationships: <Heart className="w-3 h-3" />
  };

  const domainColors = {
    study: "bg-blue-500",
    health: "bg-emerald-500",
    work: "bg-amber-500",
    personal: "bg-indigo-500",
    relationships: "bg-rose-500"
  };

  return (
    <div className="bg-zinc-900/30 border border-zinc-800/50 p-6 rounded-[2.5rem] space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl">
            <PieChart className="w-4 h-4 text-indigo-400" />
          </div>
          <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">Life Balance</h2>
        </div>
      </div>

      <div className="space-y-4">
        {/* Distribution Bars */}
        <div className="grid grid-cols-1 gap-3">
          {(Object.entries(stats) as [keyof typeof stats, number][]).map(([domain, percentage]) => (
            <motion.div 
              key={domain} 
              {...listItemHover}
              className="space-y-1.5 p-1 rounded-lg"
            >
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                <div className="flex items-center gap-2 text-zinc-500">
                  {domainIcons[domain]}
                  {domain}
                </div>
                <span className="text-zinc-300">{percentage}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800/50 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${domainColors[domain]} transition-all duration-1000 ease-out`} 
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Warnings */}
        {(imbalance.overfocused || imbalance.neglected.length > 0) && (
          <div className="pt-4 border-t border-zinc-800/50 space-y-3">
            {imbalance.overfocused && (
              <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <TrendingUp className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="text-xs font-bold text-amber-200">
                  Overfocused on <span className="uppercase">{imbalance.overfocused}</span>. Watch for burnout.
                </p>
              </div>
            )}
            
            {imbalance.neglected.map(domain => (
              <div key={domain} className="flex items-center gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <p className="text-xs font-bold text-rose-200 uppercase tracking-tight">
                  {domain} is being neglected
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

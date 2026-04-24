"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, X, BrainCircuit, Calendar, PlusCircle } from 'lucide-react';
import { usePendingStore } from '../../core/agent/pending';
import { executeAction } from '../../core/agent/executor';
import { logAction } from '../../core/agent/log';
import { humanizeAction } from '../../core/agent/humanize';
import { useUndoStore } from '../../core/agent/undo';

export default function SuggestionsFeed() {
  const { suggestions, removeSuggestion } = usePendingStore();

  if (suggestions.length === 0) return null;

  const handleApprove = async (action: any) => {
    removeSuggestion(action.id);
    const result = await executeAction(action);
    await logAction(action, result.success ? "executed" : "failed");
    if (result.success) {
      useUndoStore.getState().setUndoVisible(true);
    }
  };

  const handleReject = async (action: any) => {
    removeSuggestion(action.id);
    await logAction(action, "rejected");
  };

  return (
    <div className="fixed bottom-24 right-8 z-[100] flex flex-col gap-4 w-80 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {suggestions.map((action) => {
          const humanized = humanizeAction(action);
          return (
            <motion.div
              key={action.id}
              layout
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              className="pointer-events-auto bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl overflow-hidden group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-xl shrink-0">
                  {action.type === 'schedule_task' ? (
                    <Calendar className="w-4 h-4 text-indigo-400" />
                  ) : action.type === 'create_task' ? (
                    <PlusCircle className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <BrainCircuit className="w-4 h-4 text-indigo-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black text-white truncate uppercase tracking-wider">
                    Agent Suggestion
                  </h4>
                  <p className="text-[13px] font-bold text-zinc-200 mt-1 leading-tight">
                    {humanized.title}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2 italic">
                    "{action.reason}"
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleApprove(action)}
                  className="flex-1 bg-white text-black text-[10px] font-black py-2 rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3 h-3" strokeWidth={3} />
                  ACCEPT
                </button>
                <button
                  onClick={() => handleReject(action)}
                  className="px-3 bg-zinc-800 text-zinc-400 text-[10px] font-black py-2 rounded-lg hover:bg-zinc-700 hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" strokeWidth={3} />
                </button>
              </div>
              
              {/* Subtle progress bar (decoration) */}
              <div className="absolute bottom-0 left-0 h-0.5 bg-indigo-500/30 w-full overflow-hidden">
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "0%" }}
                  transition={{ duration: 15, ease: "linear" }}
                  className="h-full bg-indigo-500"
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

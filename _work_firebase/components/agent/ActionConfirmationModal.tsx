"use client";

import React from 'react';
import { usePendingStore } from '../../core/agent/pending';
import { generateExplanation } from '../../core/agent/explain';
import { humanizeAction } from '../../core/agent/humanize';


import { executeAction } from '../../core/agent/executor';
import { logAction } from '../../core/agent/log';
import { useUndoStore } from '../../core/agent/undo';
import { Sparkles, Check, X, AlertCircle } from 'lucide-react';


export default function ActionConfirmationModal() {
  const { pendingAction, clearPendingAction } = usePendingStore();

  if (!pendingAction) return null;

  const explanation = generateExplanation(pendingAction);
  const humanized = humanizeAction(pendingAction);

  const handleApprove = async () => {

    const action = pendingAction;
    clearPendingAction(); // Close modal
    
    const result = await executeAction(action);
    await logAction(action, result.success ? "executed" : "failed");
    
    if (result.success) {
      useUndoStore.getState().setUndoVisible(true);
    }
  };


  const handleReject = async () => {
    const action = pendingAction;
    clearPendingAction(); // Close modal
    
    await logAction(action, "rejected");
  };



  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-zinc-950 border border-indigo-500/30 p-8 rounded-[2.5rem] shadow-[0_0_80px_rgba(79,70,229,0.2)] max-w-lg w-full space-y-8 animate-in zoom-in-95 duration-300">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-500/20 rounded-3xl">
            <Sparkles className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Agent Decision</h2>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Confirmation Required</p>
          </div>
        </div>

          <div className="flex flex-col gap-6">
            {/* 1 & 2: Title and Description */}
            <div className="flex flex-col gap-2">
              <h3 className="text-2xl font-black text-white tracking-tight leading-tight">
                {pendingAction.type === "create_goal_with_tasks" 
                  ? pendingAction.payload.goal 
                  : humanized.title}
              </h3>
              <p className="text-base text-zinc-400 leading-relaxed font-medium">
                {humanized.description}
              </p>
            </div>

            {/* 3: Task Preview */}
            {pendingAction.type === "create_goal_with_tasks" && pendingAction.payload.tasks && (
              <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-5 shadow-inner">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-4">Proposed Roadmap Preview</span>
                <ul className="flex flex-col gap-3">
                  {pendingAction.payload.tasks.slice(0, 4).map((task: any, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-200">{task.title}</span>
                          <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-1 rounded border border-indigo-500/20">
                            {task.domain}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-zinc-500 mt-0.5">{task.duration} minutes</span>
                      </div>

                    </li>
                  ))}
                  {pendingAction.payload.tasks.length > 4 && (
                    <li className="text-xs font-bold text-zinc-600 pl-4 pt-2 uppercase tracking-widest">
                      + {pendingAction.payload.tasks.length - 4} more actions hidden
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* 4: Reason (Small Text) */}
            <div className="pt-4 border-t border-white/5 flex flex-col gap-1">
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">System Rationale</span>
              <p className="text-xs text-zinc-400 leading-relaxed italic">
                {explanation}
              </p>
            </div>
          </div>



        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <button
            onClick={handleApprove}
            className="flex-1 flex items-center justify-center gap-2 bg-white text-black px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            Approve Action
          </button>
          <button
            onClick={handleReject}
            className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 text-zinc-400 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-800 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

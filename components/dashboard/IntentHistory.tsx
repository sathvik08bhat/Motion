"use client";

import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getIntents } from '../../data/db';
import { History, Play, Calendar, Trash2 } from 'lucide-react';
import { processIntent, validateIntentResponse } from '../../core/agent/intent';

import { runAgentAction } from '../../core/agent/orchestrator';
import { createAction } from '../../core/agent/types';
import { useStore } from '../../core/store';


export default function IntentHistory() {
  const intents = useLiveQuery(() => getIntents(), []);
  const { goals, tasks } = useStore();

  const handleReRun = async (text: string) => {
    try {
      const result = await processIntent(text, { goals, tasks });
      validateIntentResponse(result);

      const action = createAction(

        "create_goal_with_tasks",
        { goal: result.goal, tasks: result.tasks },
        `Re-running roadmap for objective: "${text}"`
      );
      
      await runAgentAction(action);

    } catch (error) {
      console.error("Re-run failed:", error);
    }
  };

  const handleDelete = async (id: number) => {
    await db.intents.delete(id);
  };

  if (!intents || intents.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-zinc-400 flex items-center gap-3">
          <History className="w-5 h-5 text-indigo-500" />
          Intent History
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {intents.slice(0, 5).map((intent) => (
          <div 
            key={intent.id}
            className="group relative bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-2xl hover:border-indigo-500/30 transition-all overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button 
                onClick={() => intent.id && handleReRun(intent.text)}
                className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-400 transition-colors shadow-lg"
                title="Re-run Goal Generation"
              >
                <Play className="w-3 h-3 fill-current" />
              </button>
              <button 
                onClick={() => intent.id && handleDelete(intent.id)}
                className="p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                title="Delete from history"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                <Calendar className="w-3 h-3" />
                {new Date(intent.timestamp).toLocaleDateString()}
              </div>
              <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors pr-16">
                "{intent.text}"
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

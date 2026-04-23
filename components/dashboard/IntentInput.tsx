"use client";

import React, { useState } from 'react';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { processIntent, validateIntentResponse } from '../../core/agent/intent';

import { runAgentAction } from '../../core/agent/orchestrator';
import { createAction } from '../../core/agent/types';
import { addIntent } from '../../data/db';
import { useStore } from '../../core/store';





export default function IntentInput() {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  
  const { goals, tasks } = useStore();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    setFeedback(null);

    try {
      // 1. Save Intent to History
      await addIntent({
        text: input,
        timestamp: Date.now()
      });

      const result = await processIntent(input, { goals, tasks });
      validateIntentResponse(result);


      // Trigger the Agentic Pipeline

      const action = createAction(
        "create_goal_with_tasks",
        { goal: result.goal, tasks: result.tasks },
        `Planning roadmap for objective: "${input}"`
      );
      
      await runAgentAction(action);
      
      setFeedback(`Objective: "${result.goal}". I've prepared ${result.tasks.length} tasks for your roadmap.`);
      setInput('');


      
      // Clear feedback after 3 seconds
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error("Intent Submission Failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <form 
        onSubmit={handleSubmit}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
        
        <div className="relative flex items-center gap-4 bg-zinc-900/50 border border-zinc-800 p-2 rounded-2xl backdrop-blur-md focus-within:border-indigo-500/50 transition-all shadow-2xl">
          <div className="pl-4">
            <Sparkles className={`w-5 h-5 ${isProcessing ? 'text-indigo-400 animate-pulse' : 'text-zinc-500'}`} />
          </div>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What do you want to achieve?"
            className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-zinc-600 font-medium py-3"
            disabled={isProcessing}
          />
          
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="bg-white text-black p-3 rounded-xl hover:bg-indigo-500 hover:text-white transition-all disabled:opacity-0 disabled:scale-90"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>

      {feedback && (
        <div className="flex items-center gap-3 px-6 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl animate-in slide-in-from-top-2 fade-in duration-500">
          <div className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse" />
          <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">{feedback}</p>
        </div>
      )}
    </div>
  );
}

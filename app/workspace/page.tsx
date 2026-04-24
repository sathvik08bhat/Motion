"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, BrainCircuit, Loader2 } from "lucide-react";
import { generateWorkspaceFromIntent } from "../../core/agent/workspaceBuilder";

export default function UniversalWorkspace() {
  const [intent, setIntent] = useState("");
  const [isBuilding, setIsBuilding] = useState(false);
  const router = useRouter();

  const handleBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intent.trim() || isBuilding) return;

    setIsBuilding(true);
    try {
      const result = await generateWorkspaceFromIntent(intent);
      if (result && result.pages && result.pages.length > 0) {
        router.push(`/thinking?pageId=${result.pages[0].id}`);
      }
    } catch (error) {
      console.error("Failed to build workspace", error);
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex flex-col items-center justify-center p-6 relative">
      
      {/* Decorative Core Elements */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0">
        <div className="absolute w-[600px] h-[600px] rounded-full border-[1px] border-indigo-500/10" />
        <div className="absolute w-[400px] h-[400px] rounded-full border-[1px] border-indigo-500/20 animate-spin-slow" />
        <div className="absolute w-[800px] h-[800px] bg-indigo-500/5 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl text-center space-y-10 z-10"
      >
        <div className="space-y-6">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full glass-panel border border-indigo-500/30 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(92,92,255,0.2)]">
            <Sparkles className="w-3.5 h-3.5" />
            Neural Architecture System
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white drop-shadow-2xl">
            What shall we <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">architect</span> today?
          </h1>
          <p className="text-lg text-zinc-400 font-medium tracking-wide max-w-xl mx-auto">
            Input your macro-intent. Motion OS will autonomously provision the required cognitive nodes, logic structures, and execution plans.
          </p>
        </div>

        <form onSubmit={handleBuild} className="relative group mx-auto max-w-xl">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-[28px] blur-lg opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          
          <div className="relative flex items-center glass-panel p-2 rounded-[24px]">
            <BrainCircuit className="w-6 h-6 text-zinc-500 ml-4 hidden sm:block" />
            <input
              type="text"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="e.g. Build a SaaS MVP, Prepare for marathon..."
              className="flex-1 bg-transparent border-none outline-none px-4 py-4 text-lg text-white placeholder-zinc-600 w-full"
              disabled={isBuilding}
              autoFocus
            />
            <button
              type="submit"
              disabled={isBuilding || !intent.trim()}
              className="w-14 h-14 flex items-center justify-center bg-indigo-500 hover:bg-indigo-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-2xl transition-all shadow-[0_0_20px_rgba(92,92,255,0.3)] disabled:shadow-none mr-1"
            >
              {isBuilding ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <ArrowRight className="w-6 h-6" />
              )}
            </button>
          </div>
        </form>

        {isBuilding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] animate-pulse"
          >
            Provisioning logic layers and task nodes...
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

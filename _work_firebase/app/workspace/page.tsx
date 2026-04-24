"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, BrainCircuit } from "lucide-react";
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
      // AI generation logic
      const result = await generateWorkspaceFromIntent(intent);
      
      // Navigate to the generated workspace
      if (result && result.pages && result.pages.length > 0) {
        // Navigate to the first page (or overview page)
        router.push(`/thinking?pageId=${result.pages[0].id}`);
      }
    } catch (error) {
      console.error("Failed to build workspace", error);
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 relative">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
        <BrainCircuit className="w-96 h-96 text-indigo-500" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl text-center space-y-8 z-10"
      >
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-black uppercase tracking-widest border border-indigo-500/20">
            <Sparkles className="w-3 h-3" />
            Universal AI Workspace
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter bg-gradient-to-br from-white via-white to-zinc-600 bg-clip-text text-transparent">
            What do you want to build?
          </h1>
          <p className="text-xl text-zinc-500 font-medium">
            Describe your goal, and Motion will architect a complete system.
          </p>
        </div>

        <form onSubmit={handleBuild} className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl p-2 shadow-2xl">
            <input
              type="text"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="e.g. Prepare for GATE 2027, Lose 10kg, Build a startup..."
              className="flex-1 bg-transparent border-none outline-none px-6 py-4 text-lg text-white placeholder-zinc-500 w-full"
              disabled={isBuilding}
              autoFocus
            />
            <button
              type="submit"
              disabled={isBuilding || !intent.trim()}
              className="p-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:shadow-none"
            >
              {isBuilding ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
            className="text-sm font-bold text-indigo-400 uppercase tracking-widest animate-pulse"
          >
            Architecting intelligent structure...
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

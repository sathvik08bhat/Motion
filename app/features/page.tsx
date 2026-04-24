"use client";

import { motion } from "framer-motion";
import { 
  Layout, 
  BrainCircuit, 
  Zap, 
  Settings, 
  ShieldCheck, 
  Database, 
  Link as LinkIcon, 
  Mic, 
  MousePointer2, 
  History, 
  CheckCircle2, 
  Clock,
  ArrowRight
} from "lucide-react";
import { fadeIn, slideUp, staggerContainer } from "../../lib/animations";

const features = [
  {
    category: "Core Workspace",
    icon: Layout,
    items: [
      { name: "Nested Page System", status: "Done", desc: "Infinite hierarchy with clean navigation" },
      { name: "Block-based Editor", status: "Done", desc: "Rich blocks (Text, Heading, Stat, Progress, etc.)" },
      { name: "Smart Databases", status: "Planned", desc: "Relational tables, boards, and calendars" }
    ]
  },
  {
    category: "AI Intelligence (JARVIS)",
    icon: BrainCircuit,
    items: [
      { name: "Talk Mode (JARVIS)", status: "Done", desc: "Conversational voice/text control with wake word" },
      { name: "Autonomous Builder", status: "Done", desc: "AI builds entire multi-page systems from commands" },
      { name: "Predictive Planning", status: "Done", desc: "AI optimizes daily schedule based on habits" }
    ]
  },
  {
    category: "Execution & Automation",
    icon: Zap,
    items: [
      { name: "External API Integration", status: "Done", desc: "Calendar (Google) and Messaging (Simulation) sync" },
      { name: "Screen Control (RPA)", status: "Done", desc: "AI plans and simulates screen/web interactions" },
      { name: "Background Agent", status: "Done", desc: "Always-on listener for 'Motion' wake word" }
    ]
  },
  {
    category: "Data & Sync",
    icon: Database,
    items: [
      { name: "Universal Sync Engine", status: "Done", desc: "Bidirectional sync between Motion and External APIs" },
      { name: "Object-based Storage", status: "Done", desc: "Everything is a trackable, linked entity" },
      { name: "Conflict Resolution", status: "Planned", desc: "Smart handling of external data changes" }
    ]
  },
  {
    category: "Trust & Transparency",
    icon: ShieldCheck,
    items: [
      { name: "Action Logs", status: "Planned", desc: "Full history of every AI action and change" },
      { name: "Confirmation Layer", status: "Planned", desc: "Approval required for sensitive actions" },
      { name: "Version History", status: "Planned", desc: "Full rollback for UI and data structures" }
    ]
  }
];

export default function FeaturesPage() {
  return (
    <motion.div 
      initial="initial" 
      animate="animate" 
      variants={staggerContainer}
      className="min-h-screen bg-black text-white p-8 pb-24"
    >
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <motion.div variants={fadeIn} className="space-y-4">
          <div className="flex items-center gap-3 text-indigo-400">
            <Settings className="w-5 h-5 animate-spin-slow" />
            <span className="text-xs font-black uppercase tracking-[0.3em]">System Manifest</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight">
            Motion OS <span className="text-indigo-500">Capabilities</span>
          </h1>
          <p className="text-zinc-500 max-w-2xl text-lg leading-relaxed">
            The complete blueprint of the world's first agentic operating system. 
            From conversational building to real-world execution.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((section, idx) => (
            <motion.div 
              key={section.category}
              variants={slideUp}
              className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6 space-y-6 hover:bg-white/[0.05] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                  <section.icon className="w-5 h-5 text-indigo-400" />
                </div>
                <h2 className="text-lg font-black tracking-tight">{section.category}</h2>
              </div>

              <div className="space-y-4">
                {section.items.map((item) => (
                  <div key={item.name} className="group cursor-default">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">{item.name}</h3>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        item.status === "Done" ? "bg-emerald-500/10 text-emerald-400" :
                        item.status === "In Progress" ? "bg-amber-500/10 text-amber-400" :
                        "bg-zinc-500/10 text-zinc-500"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Roadmap Footer */}
        <motion.div 
          variants={fadeIn}
          className="bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="space-y-2">
            <h3 className="text-xl font-black tracking-tight">Ready to initiate Phase 1?</h3>
            <p className="text-zinc-400 text-sm">Building the core workspace foundation and nested page architecture.</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20">
            Start Execution <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

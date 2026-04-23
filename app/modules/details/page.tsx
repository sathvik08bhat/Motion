"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useModuleRegistry } from '../../../core/agent/moduleRegistry';
import { 
  ArrowLeft, Layout, Settings, Trash2, 
  BookOpen, Activity, Briefcase, Zap, 
  BarChart3, Clock, CheckCircle2 
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Icon Map for Components
const ICON_MAP: Record<string, any> = {
  BookOpen, Activity, Briefcase, Zap, BarChart3, Clock, CheckCircle2
};

function ModuleContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();
  const { modules, uninstallModule } = useModuleRegistry();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const module = modules.find(m => m.id === id);

  if (!mounted) return null;

  if (!module) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-6">
        <h1 className="text-4xl font-black text-white mb-4">Module Not Found</h1>
        <p className="text-zinc-500 mb-8 text-lg">The module you're looking for doesn't exist or has been removed.</p>
        <Link href="/modules" className="btn-primary py-3 px-8">Back to Extensions</Link>
      </div>
    );
  }

  const { layout } = module;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/50 backdrop-blur-xl border-b border-zinc-800/50 p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/modules" className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <Layout className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">{layout.title}</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  AI-Architected Module • {new Date(module.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="btn-ghost p-3">
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                if (confirm("Are you sure you want to uninstall this module?")) {
                  uninstallModule(module.id);
                  router.push("/modules");
                }
              }}
              className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/20"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto p-8 space-y-12">
        {layout.sections.map((section) => (
          <section key={section.id} className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-black uppercase tracking-widest text-zinc-400">{section.title}</h2>
              <div className="flex-1 h-px bg-zinc-800/50" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {section.components.map((comp, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-zinc-900/30 border border-zinc-800/50 p-6 rounded-3xl hover:border-indigo-500/30 transition-all group"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-colors">
                      {comp.props.icon && ICON_MAP[comp.props.icon] ? 
                        React.createElement(ICON_MAP[comp.props.icon], { className: "w-5 h-5" }) : 
                        <Zap className="w-5 h-5" />
                      }
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">{comp.title}</h3>
                      <div className="text-3xl font-black tabular-nums">
                        {comp.type === "StatCard" && (
                          <>
                            {comp.props.value || 0}
                            <span className="text-sm text-zinc-600 ml-1 font-bold">{comp.props.suffix || ""}</span>
                          </>
                        )}
                        {comp.type === "ProgressBar" && (
                          <div className="space-y-3 pt-2">
                            <div className="flex justify-between items-end">
                              <span className="text-sm text-zinc-400 font-bold">{comp.props.target} {comp.props.unit} Goal</span>
                            </div>
                            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                              <div className="w-1/3 h-full bg-indigo-500 rounded-full" />
                            </div>
                          </div>
                        )}
                        {comp.type === "TaskList" && (
                          <div className="space-y-2 pt-2">
                            {(comp.props.items || ["Focus Session", "Research"]).map((item: string, i: number) => (
                              <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl text-xs font-bold border border-white/5">
                                <div className="w-4 h-4 rounded border border-zinc-700" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}

export default function DynamicModulePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ModuleContent />
    </Suspense>
  );
}

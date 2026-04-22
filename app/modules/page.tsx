"use client";

import React, { useState, useEffect } from 'react';
import { useStore } from '../../core/store';
import { AVAILABLE_MODULES } from '../../modules';
import { LayoutDashboard, Box, Download, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function ModuleInstallerPage() {
  const { installedModules, installModule, uninstallModule } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 lg:p-24 selection:bg-indigo-500/30">
      <div className="max-w-4xl mx-auto space-y-16">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-500">
              <Box className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-[0.2em]">Module Installer</span>
            </div>
            <div className="space-y-1">
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter bg-gradient-to-br from-white via-white to-zinc-600 bg-clip-text text-transparent">
                Extensions
              </h1>
              <p className="text-zinc-500 font-medium text-lg">
                Expand your OS with specialized capabilities.
              </p>
            </div>
          </div>

          <nav className="flex gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-4 py-2.5 rounded-xl transition-all group"
            >
              <LayoutDashboard className="w-4 h-4 text-zinc-400 group-hover:text-indigo-400" />
              <span className="text-sm font-bold text-zinc-300">Dashboard</span>
            </Link>
          </nav>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {AVAILABLE_MODULES.map((module) => {
            const isInstalled = installedModules.includes(module.name);
            
            return (
              <div 
                key={module.name} 
                className={`group relative p-8 rounded-3xl border transition-all duration-500 ${
                  isInstalled 
                    ? 'bg-indigo-600/5 border-indigo-500/30' 
                    : 'bg-zinc-900/30 border-zinc-800/50 hover:border-zinc-700'
                }`}
              >
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div className={`p-4 rounded-2xl ${isInstalled ? 'bg-indigo-500/20' : 'bg-zinc-800'}`}>
                      <Box className={`w-8 h-8 ${isInstalled ? 'text-indigo-400' : 'text-zinc-500'}`} />
                    </div>
                    {isInstalled ? (
                      <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full">
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Available</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-black tracking-tight">{module.name}</h2>
                    <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                      Specialized logic for {module.name.toLowerCase()} management, including custom agent behaviors and dashboard widgets.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Actions Provided</p>
                      <p className="text-xs font-bold text-zinc-300">{module.actions.length} Commands</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">System Hook</p>
                      <p className="text-xs font-bold text-zinc-300">{module.onTick ? 'Agent-Sync' : 'Event-Only'}</p>
                    </div>
                  </div>

                  {isInstalled ? (
                    <button
                      onClick={() => {
                        uninstallModule(module.name);
                        // Refresh to deactivate logic (simple approach)
                        window.location.reload();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-4 bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 font-black text-xs uppercase tracking-widest rounded-2xl border border-zinc-700 hover:border-red-500/30 transition-all active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" /> Uninstall Module
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        installModule(module.name);
                        // Refresh to activate logic
                        window.location.reload();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(79,70,229,0.2)] transition-all active:scale-95"
                    >
                      <Download className="w-4 h-4" /> Install Module
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        <footer className="pt-16 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 text-zinc-700">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Modules require system restart for logic activation</span>
          </div>
          <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest">Motion OS Repository</span>
        </footer>
      </div>
    </div>
  );
}

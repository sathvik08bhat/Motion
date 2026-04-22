"use client";

import React from 'react';
import { registry } from '../../core/modules/registry';
import { Box } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ModuleWidgets() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const modules = registry.getModules();
  
  // Filter modules that have a 'Widget' component
  const modulesWithWidgets = modules.filter(m => m.components && m.components.Widget);

  if (!mounted || modulesWithWidgets.length === 0) return null;


  return (
    <div className="space-y-6 pt-12 border-t border-zinc-900">
      <div className="flex items-center gap-3">
        <Box className="w-5 h-5 text-indigo-500" />
        <h2 className="text-xl font-bold tracking-tight text-white">Module Extensions</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modulesWithWidgets.map(module => {
          const Widget = module.components!.Widget;
          return (
            <div key={module.name} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{module.name}</span>
              </div>
              <Widget />
            </div>
          );
        })}
      </div>
    </div>
  );
}

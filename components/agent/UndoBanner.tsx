"use client";

import React, { useEffect } from 'react';
import { useUndoStore, undoLastAction } from '../../core/agent/undo';
import { RotateCcw, X } from 'lucide-react';

export default function UndoBanner() {
  const { isUndoVisible, setUndoVisible, lastAction } = useUndoStore();

  useEffect(() => {
    if (isUndoVisible) {
      const timer = setTimeout(() => {
        setUndoVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isUndoVisible, setUndoVisible]);

  if (!isUndoVisible || !lastAction) return null;

  const handleUndo = async () => {
    setUndoVisible(false);
    await undoLastAction();
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-8 duration-500">
      <div className="bg-zinc-950 border border-white/10 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Action Completed</span>
        </div>
        
        <div className="w-px h-4 bg-white/10" />

        <button
          onClick={handleUndo}
          className="flex items-center gap-2 text-indigo-400 hover:text-white transition-colors text-xs font-black uppercase tracking-widest group"
        >
          <RotateCcw className="w-3 h-3 group-hover:-rotate-45 transition-transform" />
          Undo
        </button>

        <button
          onClick={() => setUndoVisible(false)}
          className="text-zinc-600 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

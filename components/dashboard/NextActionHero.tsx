"use client";

import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, updateTask, type Task } from '../../data/db';
import { Play, Clock, Sparkles, ArrowRight } from 'lucide-react';
import { useStore } from '../../core/store';
import { useAppTheme } from '../providers/ThemeProvider';
import { motion } from 'framer-motion';
import { cardHover, buttonHover } from '../../lib/animations';

export default function NextActionHero() {
  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];
  const updateTaskInStore = useStore((state) => state.updateTask);
  const { accentTheme } = useAppTheme();

  const nextTask = useMemo(() => {
    const today = new Date().toDateString();
    return tasks
      .filter(t => t.status !== 'done' && new Date(t.scheduledAt).toDateString() === today)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];
  }, [tasks]);

  const handleStart = async (task: Task) => {
    try {
      await updateTask(task.id!, { status: 'doing' });
      updateTaskInStore(task.id!, { status: 'doing' });
    } catch (error) {
      console.error("Failed to start task:", error);
    }
  };

  if (!nextTask) {
    return (
      <motion.div
        {...cardHover}
        className="card p-10 text-center space-y-5"
        style={{ borderStyle: "dashed" }}
      >
        <div
          className="w-14 h-14 rounded-full mx-auto flex items-center justify-center animate-float"
          style={{ background: "var(--accent-primary-light)" }}
        >
          <Sparkles className="w-6 h-6" style={{ color: "var(--accent-primary)" }} />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Your schedule is open.
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Let the AI analyze your goals and propose the next move.
          </p>
        </div>
        <motion.button
          {...buttonHover}
          className="btn-primary mx-auto shine"
          onClick={() => {
            const { useStore } = require('../../core/store');
            useStore.getState().setPaletteOpen?.(true);
          }}
        >
          <Sparkles className="w-4 h-4" />
          What should I do now?
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      {...cardHover}
      className="card p-7 shine overflow-hidden relative group"
      style={{ borderColor: "var(--border-strong)" }}
    >
      {/* Ambient background gradient */}
      <div
        className="absolute -top-8 -right-8 w-48 h-48 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-700"
        style={{ background: `radial-gradient(circle, var(--accent-primary), transparent)` }}
      />

      <div className="flex flex-col md:flex-row md:items-center gap-7 relative z-10">
        {/* Content */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2">
            <span
              className="badge badge-accent animate-pulse-ring"
              style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--accent-primary)" }}
              />
              Next Best Action
            </span>
            <span
              className="badge"
              style={{
                color: "var(--text-muted)",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-default)",
              }}
            >
              <Clock className="w-2.5 h-2.5 mr-1" />
              {new Date(nextTask.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div>
            <h2
              className="text-3xl font-black tracking-tight leading-tight mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              {nextTask.title}
            </h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Focused effort for{" "}
              <strong style={{ color: "var(--text-secondary)" }}>{nextTask.duration} minutes</strong>
              {nextTask.domain && (
                <>
                  {" "}·{" "}
                  <span
                    className="capitalize font-semibold"
                    style={{ color: "var(--accent-primary)" }}
                  >
                    {nextTask.domain}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Priority</p>
            <p className="text-sm font-bold capitalize" style={{ color: "var(--accent-primary)" }}>
              {nextTask.priority || "High"} Impact
            </p>
          </div>
          <motion.button
            {...buttonHover}
            onClick={() => handleStart(nextTask)}
            className="btn-primary text-base px-7 py-4 rounded-2xl shine"
          >
            <Play className="w-5 h-5 fill-current" />
            Start
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

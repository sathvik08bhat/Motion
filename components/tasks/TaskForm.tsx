"use client";

import { useState } from "react";
import { PlusCircle, Target, Clock, Calendar, Shield, Hash, Sparkles } from "lucide-react";
import { addTask as addTaskToDb, type Task } from "../../data/db";
import { useStore } from "../../core/store";
import { LifeDomain, getDefaultDomains } from "../../core/agent/domains";

export default function TaskForm() {
  const [title, setTitle] = useState("");
  const [goalId, setGoalId] = useState<string>("");
  const [duration, setDuration] = useState("30");
  const [scheduledAt, setScheduledAt] = useState("");
  const [domain, setDomain] = useState<LifeDomain>("personal");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  
  const goals = useStore((state) => state.goals);
  const addTaskToStore = useStore((state) => state.addTask);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !scheduledAt) return;

    const newTask: Omit<Task, "id"> = {
      title,
      goalId: goalId ? parseInt(goalId) : undefined,
      duration: parseInt(duration),
      scheduledAt: new Date(scheduledAt),
      status: "todo",
      priority,
      domain,
      createdAt: new Date(),
    };

    try {
      const id = await addTaskToDb(newTask);
      addTaskToStore({ ...newTask, id: id as number });
      setTitle("");
      setDuration("30");
      setScheduledAt("");
      setGoalId("");
      setDomain("personal");
      setPriority("medium");
    } catch (error) {
      console.error("Failed to add task:", error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="card p-6 space-y-4"
    >
      <div className="space-y-2 relative">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Task Title
          </label>
          {title.trim().length > 5 && (
            <button 
              type="button"
              onClick={async () => {
                const { callAI } = await import('../../lib/ai');
                const improved = await callAI(
                  `Refine this task title to be highly actionable, specific, and concise (max 7 words). Task: "${title}"\nReturn ONLY the improved string.`
                );
                setTitle(improved.trim().replace(/['"]/g, ''));
              }}
              className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3 h-3" /> Suggest Improvements
            </button>
          )}
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="w-full px-4 py-3"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
            <Target className="w-3 h-3" /> Assign to Goal
          </label>
          <select
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
            className="w-full px-4 py-3"
          >
            <option value="">No Goal (Independent)</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
            <Clock className="w-3 h-3" /> Duration (min)
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-4 py-3"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
            <Shield className="w-3 h-3" /> Life Domain
          </label>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value as LifeDomain)}
            className="w-full px-4 py-3"
          >
            {getDefaultDomains().map((d) => (
              <option key={d} value={d}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
            <Hash className="w-3 h-3" /> Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
            className="w-full px-4 py-3"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
          <Calendar className="w-3 h-3" /> Scheduled At
        </label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="w-full px-4 py-3"
        />
      </div>


      <button
        type="submit"
        className="btn-primary w-full justify-center py-3 shine"
      >
        <PlusCircle className="w-5 h-5" />
        Add Task
      </button>
    </form>
  );
}

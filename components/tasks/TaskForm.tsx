"use client";

import { useState } from "react";
import { PlusCircle, Target, Clock, Calendar } from "lucide-react";
import { addTask as addTaskToDb, type Task } from "../../data/db";
import { useStore } from "../../core/store";

export default function TaskForm() {
  const [title, setTitle] = useState("");
  const [goalId, setGoalId] = useState<string>("");
  const [duration, setDuration] = useState("30");
  const [scheduledAt, setScheduledAt] = useState("");
  
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
      createdAt: new Date(),
    };

    try {
      const id = await addTaskToDb(newTask);
      addTaskToStore({ ...newTask, id: id as number });
      setTitle("");
      setDuration("30");
      setScheduledAt("");
      setGoalId("");
    } catch (error) {
      console.error("Failed to add task:", error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl space-y-4 backdrop-blur-sm"
    >
      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Task Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <Target className="w-3 h-3" /> Assign to Goal
          </label>
          <select
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
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
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-3 h-3" /> Duration (min)
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-3 h-3" /> Scheduled At
        </label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors duration-200 active:scale-[0.98]"
      >
        <PlusCircle className="w-5 h-5" />
        Add Task
      </button>
    </form>
  );
}

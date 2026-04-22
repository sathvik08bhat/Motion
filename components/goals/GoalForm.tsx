"use client";

import { useState } from "react";
import { PlusCircle, Calendar, Flag, Sparkles, Loader2 } from "lucide-react";
import { addGoal as addGoalToDb, addTask as addTaskToDb, type Goal, type Task } from "../../data/db";
import { useStore } from "../../core/store";
import { generateTasksFromGoal } from "../../lib/services/aiService";

export default function GoalForm() {
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const addGoalToStore = useStore((state) => state.addGoal);
  const addTaskToStore = useStore((state) => state.addTask);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadline) return;

    const newGoal: Omit<Goal, "id"> = {
      title,
      deadline: new Date(deadline),
      priority,
      status: "not-started",
    };

    try {
      // 1. Create the Goal
      const id = await addGoalToDb(newGoal);
      const goalId = id as number;
      addGoalToStore({ ...newGoal, id: goalId });
      
      // Clear form
      setTitle("");
      setDeadline("");
      setPriority("medium");

      // 2. Automatically generate tasks using AI
      setIsGenerating(true);
      try {
        const generatedTasks = await generateTasksFromGoal(newGoal.title);
        
        // 3. Persist and store newly generated tasks
        for (const genTask of generatedTasks) {
          const newTask: Omit<Task, "id"> = {
            title: genTask.title,
            duration: genTask.duration,
            goalId: goalId,
            scheduledAt: new Date(), // Default to today
            status: "todo",
            createdAt: new Date(),
          };
          
          const taskId = await addTaskToDb(newTask);
          addTaskToStore({ ...newTask, id: taskId as number });
        }
      } catch (aiError) {
        console.error("AI Task Generation failed:", aiError);
      } finally {
        setIsGenerating(false);
      }

    } catch (error) {
      console.error("Failed to add goal:", error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl space-y-4 backdrop-blur-sm relative overflow-hidden"
    >
      {isGenerating && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex items-center justify-center animate-in fade-in duration-300">
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-6 py-3 rounded-2xl shadow-2xl">
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
            <span className="text-sm font-bold text-zinc-200">AI is architecting your tasks...</span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Goal Title
        </label>
        <div className="relative">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What do you want to achieve?"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all pr-10"
          />
          <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-3 h-3" /> Deadline
          </label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <Flag className="w-3 h-3" /> Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isGenerating}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors duration-200 active:scale-[0.98]"
      >
        <PlusCircle className="w-5 h-5" />
        Create Goal
      </button>
    </form>
  );
}

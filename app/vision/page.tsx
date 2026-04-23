"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  Target, Sparkles, TrendingUp, Calendar, ListTodo, 
  ChevronRight, Plus, Loader2, CheckCircle2, 
  AlertCircle, BarChart3, Rocket, Compass, Trash2, Edit2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  fadeIn, slideUp, staggerContainer, buttonHover 
} from "../../lib/animations";
import { useStore } from "../../core/store";
import { 
  getGoals, getTasks, addGoal, deleteGoal, updateGoal, addTask, 
  type Goal, type Task 
} from "../../data/db";
import { callAI, generateTasksFromGoal } from "../../lib/ai";

export default function VisionHubPage() {
  const { goals, tasks, setGoals, setTasks, addGoal: addGoalToStore, deleteGoal: deleteGoalFromStore, updateGoal: updateGoalInStore, addTask: addTaskToStore } = useStore();
  const [loading, setLoading] = useState(true);
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [isDecomposing, setIsDecomposing] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New Goal State
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDesc, setNewGoalDesc] = useState("");
  const [newGoalDeadline, setNewGoalDeadline] = useState("");
  const [newGoalPriority, setNewGoalPriority] = useState<"low" | "medium" | "high">("medium");

  useEffect(() => {
    async function loadData() {
      try {
        const [g, t] = await Promise.all([getGoals(), getTasks()]);
        setGoals(g);
        setTasks(t);
      } catch (error) {
        console.error("Failed to load Vision data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [setGoals, setTasks]);

  // Calculations
  const goalStats = useMemo(() => {
    return goals.map(goal => {
      const goalTasks = tasks.filter(t => t.goalId === goal.id);
      const completed = goalTasks.filter(t => t.status === "done").length;
      const total = goalTasks.length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { ...goal, progress, totalTasks: total, completedTasks: completed };
    });
  }, [goals, tasks]);

  const overallProgress = useMemo(() => {
    if (goalStats.length === 0) return 0;
    return Math.round(goalStats.reduce((acc, g) => acc + g.progress, 0) / goalStats.length);
  }, [goalStats]);

  // AI: Suggest Vision
  const handleSuggestVision = async () => {
    setIsAiSuggesting(true);
    try {
      const existingGoals = goals.map(g => g.title).join(", ");
      const prompt = `Based on these existing goals: [${existingGoals}], suggest 3 ambitious and inspiring new long-term goals. 
      Return ONLY a JSON array of objects with "title", "description", and "priority" (low/medium/high). 
      Format: [{"title": "...", "description": "...", "priority": "..."}]`;
      
      const response = await callAI(prompt, { temperature: 0.8 });
      const content = typeof response === 'string' ? response : response.choices?.[0]?.message?.content || "";
      const suggested = JSON.parse(content.replace(/```json|```/g, "").trim());
      
      if (Array.isArray(suggested)) {
        // Just take the first suggestion for now to show user or let them pick? 
        // For simplicity, we'll just prepopulate the form with the first one.
        setNewGoalTitle(suggested[0].title);
        setNewGoalDesc(suggested[0].description);
        setNewGoalPriority(suggested[0].priority as any);
        setShowAddModal(true);
      }
    } catch (error) {
      console.error("Vision suggestion failed:", error);
    } finally {
      setIsAiSuggesting(false);
    }
  };

  // AI: Decompose Goal into Tasks
  const handleDecomposeGoal = async (goal: Goal) => {
    if (!goal.id) return;
    setIsDecomposing(goal.id);
    try {
      const suggestedTasks = await generateTasksFromGoal(`${goal.title}: ${goal.description || ""}`);
      
      // Create tasks in DB and Store
      for (const t of suggestedTasks) {
        const newTask: Task = {
          title: t.title,
          duration: t.duration,
          goalId: goal.id,
          status: "todo",
          priority: goal.priority,
          domain: "work", // Default
          createdAt: new Date(),
          scheduledAt: new Date(Date.now() + 86400000) // Tomorrow by default
        };
        const id = await addTask(newTask);
        addTaskToStore({ ...newTask, id });
      }
      
      // Update goal status if needed
      if (goal.status === "not-started") {
        const updates = { status: "in-progress" as const };
        await updateGoal(goal.id, updates);
        updateGoalInStore(goal.id, updates);
      }
    } catch (error) {
      console.error("Goal decomposition failed:", error);
    } finally {
      setIsDecomposing(null);
    }
  };

  const handleCreateGoal = async () => {
    if (!newGoalTitle.trim()) return;

    const goal: Goal = {
      title: newGoalTitle,
      description: newGoalDesc,
      deadline: new Date(newGoalDeadline || Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
      priority: newGoalPriority,
      status: "not-started"
    };

    const id = await addGoal(goal);
    addGoalToStore({ ...goal, id });
    
    // Reset form
    setNewGoalTitle("");
    setNewGoalDesc("");
    setNewGoalDeadline("");
    setNewGoalPriority("medium");
    setShowAddModal(false);
  };

  const handleDeleteGoal = async (id: number) => {
    await deleteGoal(id);
    deleteGoalFromStore(id);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="p-6 md:p-10 max-w-6xl mx-auto space-y-10">
      
      {/* Header Section */}
      <motion.header variants={fadeIn} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <Compass className="w-5 h-5 text-indigo-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Long-Term Strategy</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[var(--text-primary)]">Vision Hub</h1>
          <p className="text-sm text-[var(--text-muted)] max-w-lg">
            Architect your future. Define your core objectives, track multi-dimensional progress, and use AI to bridge the gap between vision and execution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <motion.button {...buttonHover} onClick={handleSuggestVision} disabled={isAiSuggesting}
            className="btn-ghost text-xs gap-2 py-2.5">
            {isAiSuggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            AI Suggestion
          </motion.button>
          <motion.button {...buttonHover} onClick={() => setShowAddModal(true)}
            className="btn-primary text-xs gap-2 py-2.5 shine">
            <Plus className="w-4 h-4" /> Define New Goal
          </motion.button>
        </div>
      </motion.header>

      {/* Progress Overview Cards */}
      <motion.div variants={slideUp} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Overall Progress</p>
            <h3 className="text-2xl font-black text-[var(--text-primary)]">{overallProgress}%</h3>
          </div>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
            <Target className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Active Goals</p>
            <h3 className="text-2xl font-black text-[var(--text-primary)]">{goals.length}</h3>
          </div>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
            <ListTodo className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Linked Tasks</p>
            <h3 className="text-2xl font-black text-[var(--text-primary)]">{tasks.filter(t => t.goalId).length}</h3>
          </div>
        </div>
      </motion.div>

      {/* Main Vision Board */}
      <motion.section variants={slideUp} className="space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
          <h2 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
            <BarChart3 className="w-5 h-5" /> Active Vision Board
          </h2>
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)]">
            <span>Filter:</span>
            <select className="bg-transparent border-none outline-none cursor-pointer hover:text-white transition-colors">
              <option>All Goals</option>
              <option>High Priority</option>
              <option>Closing Soon</option>
            </select>
          </div>
        </div>

        {goalStats.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Compass className="w-10 h-10 text-zinc-700" />
            </div>
            <p className="text-zinc-500 max-w-xs mx-auto">Your vision board is clear. Start by defining your first major objective or use the AI suggestion tool.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goalStats.map((goal, i) => (
              <motion.div key={goal.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="card p-6 group hover:border-indigo-500/50 transition-all cursor-default overflow-hidden relative">
                
                {/* Priority Indicator */}
                <div className={`absolute top-0 left-0 w-1 h-full ${
                  goal.priority === "high" ? "bg-red-500" : goal.priority === "medium" ? "bg-indigo-500" : "bg-zinc-500"
                }`} />

                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <h3 className="font-black text-xl text-[var(--text-primary)] line-clamp-1">{goal.title}</h3>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(goal.deadline).toLocaleDateString()}</span>
                      <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">{goal.priority}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => goal.id && handleDeleteGoal(goal.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500/50 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] line-clamp-3 mb-6 min-h-[48px]">
                  {goal.description || "No plan details defined. Use the AI decomposition tool to generate a roadmap."}
                </p>

                {/* Progress Bar */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span style={{ color: "var(--text-muted)" }}>Execution Progress</span>
                    <span style={{ color: "var(--accent-primary)" }}>{goal.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${goal.progress}%` }} 
                      className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-[var(--text-muted)]">
                    <span>{goal.completedTasks} tasks finished</span>
                    <span>{goal.totalTasks} total</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <motion.button {...buttonHover} onClick={() => handleDecomposeGoal(goal)} disabled={isDecomposing === goal.id}
                    className="flex-1 btn-ghost text-[10px] py-2 gap-2">
                    {isDecomposing === goal.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
                    Decompose into Tasks
                  </motion.button>
                  <motion.button {...buttonHover} className="btn-ghost p-2">
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Add Goal Modal Overlay */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="card w-full max-w-md p-8 space-y-6 relative border border-zinc-800 shadow-2xl">
              
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-[var(--text-primary)]">Define Objective</h2>
                <p className="text-xs text-[var(--text-muted)]">Set a clear, ambitious destination.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Goal Title</label>
                  <input autoFocus type="text" value={newGoalTitle} onChange={e => setNewGoalTitle(e.target.value)}
                    placeholder="e.g. Master Quantitative Finance" className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Long-Term Plan / Context</label>
                  <textarea value={newGoalDesc} onChange={e => setNewGoalDesc(e.target.value)} rows={3}
                    placeholder="Describe the end state and why this matters..." className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 outline-none focus:border-indigo-500 transition-colors resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Deadline</label>
                    <input type="date" value={newGoalDeadline} onChange={e => setNewGoalDeadline(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 outline-none focus:border-indigo-500 transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Priority</label>
                    <select value={newGoalPriority} onChange={e => setNewGoalPriority(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 outline-none focus:border-indigo-500 transition-colors appearance-none">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAddModal(false)} className="flex-1 btn-ghost py-3">Cancel</button>
                <button onClick={handleCreateGoal} className="flex-1 btn-primary py-3 shine">Establish Goal</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

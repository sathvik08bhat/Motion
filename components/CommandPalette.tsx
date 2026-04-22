"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "../core/store";
import { Command, Search, Target, ListTodo, X, Sparkles, Wand2, Calendar, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { parseCommand, generateTasksFromGoal } from "../lib/ai";
import { calculateSchedule } from "../lib/scheduler";
import { addGoal as addGoalToDb, addTask as addTaskToDb } from "../data/db";
import { eventBus, OS_EVENTS } from "../core/events";

const COMMANDS = [
  { id: "create-goal", title: "Create Goal", icon: Target, route: "/goals", description: "Set a new high-level objective" },
  { id: "create-task", title: "Create Task", icon: ListTodo, route: "/tasks", description: "Add a new actionable item" },
  { id: "view-dashboard", title: "Go to Dashboard", icon: Command, route: "/", description: "Back to Command Center" }
];

export default function CommandPalette() {
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<{ intent: string; data: any } | null>(null);
  
  const { 
    isPaletteOpen, setPaletteOpen, 
    tasks, goals, 
    addGoal: addGoalToStore, 
    addTask: addTaskToStore,
    bulkUpdateTasks: bulkUpdateTasksInStore 
  } = useStore();
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen(!isPaletteOpen);
      }
      if (e.key === "Escape") {
        setPaletteOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPaletteOpen, setPaletteOpen]);

  const handleSmartAction = useCallback(async (customQuery?: string) => {
    const input = customQuery || query;
    if (!input.trim()) return;

    setIsProcessing(true);
    setAiResult(null);

    try {
      const result = await parseCommand(input);

      switch (result.intent) {
        case "plan_day": {
          const planUpdates = await calculateSchedule(tasks, goals);
          // bulkUpdateTasks is from db.ts, handles IDB
          await bulkUpdateTasksInStore(planUpdates); 
          eventBus.emit(OS_EVENTS.PLAN_CREATED, { count: planUpdates.length });
          setAiResult({ intent: "plan_day", data: { count: planUpdates.length } });
          break;
        }

        case "get_next_task": {
          const now = new Date();
          const nextTasks = tasks
            .filter(t => t.status !== "done")
            .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
          
          setAiResult({ intent: "get_next_task", data: { nextTask: nextTasks[0] || null } });
          break;
        }

        case "create_goal": {
          const goalTitle = result.data.title || input.replace("create goal", "").trim();
          const goalData = {
            title: goalTitle,
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week default
            priority: "medium" as const,
            status: "not-started" as const
          };
          const goalId = await addGoalToDb(goalData) as number;
          addGoalToStore({ ...goalData, id: goalId });

          const generated = await generateTasksFromGoal(goalData.title);
          for (const gen of generated) {
            const taskData = {
              title: gen.title,
              duration: gen.duration,
              goalId: goalId,
              scheduledAt: new Date(),
              status: "todo" as const,
              createdAt: new Date()
            };
            const taskId = await addTaskToDb(taskData) as number;
            addTaskToStore({ ...taskData, id: taskId });
          }
          setAiResult({ intent: "create_goal", data: { title: goalTitle, taskCount: generated.length } });
          break;
        }

        case "create_task": {
          const taskTitle = result.data.title || input.replace("create task", "").trim();
          const taskData = {
            title: taskTitle,
            duration: result.data.duration || 30,
            scheduledAt: new Date(),
            status: "todo" as const,
            createdAt: new Date()
          };
          const taskId = await addTaskToDb(taskData) as number;
          addTaskToStore({ ...taskData, id: taskId });
          setAiResult({ intent: "create_task", data: { title: taskTitle, duration: taskData.duration } });
          break;
        }

        default:
          setAiResult({ intent: "unknown", data: {} });
          break;
      }
    } catch (error) {
      console.error("Smart Action failed:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [query, tasks, goals, addGoalToStore, addTaskToStore, bulkUpdateTasksInStore]);

  const filteredCommands = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return COMMANDS;
    return COMMANDS.filter(cmd => 
      cmd.title.toLowerCase().includes(q) || 
      cmd.description.toLowerCase().includes(q)
    );
  }, [query]);

  const runCommand = (route: string) => {
    router.push(route);
    setPaletteOpen(false);
    setQuery("");
  };

  if (!isPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => {
          setPaletteOpen(false);
          setAiResult(null);
          setQuery("");
        }}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-200">
        <div className="p-4 border-b border-zinc-800 flex items-center gap-3 bg-zinc-900/50 backdrop-blur-md">
          {isProcessing ? (
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-zinc-500" />
          )}
          <input
            autoFocus
            type="text"
            placeholder="Ask Motion anything... (e.g. 'What's next?')"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setAiResult(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSmartAction();
              }
            }}
            className="flex-1 bg-transparent border-none outline-none text-zinc-100 placeholder:text-zinc-600 font-medium"
          />
          <div className="flex items-center gap-2">
             <kbd className="hidden sm:block px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-400 font-black tracking-widest uppercase">Enter</kbd>
             <button 
              onClick={() => {
                setPaletteOpen(false);
                setAiResult(null);
                setQuery("");
              }}
              className="p-1 hover:bg-zinc-800 rounded-md transition-colors"
            >
              <X className="w-4 h-4 text-zinc-500" />
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-hide">
          {/* AI Result Section */}
          {aiResult && (
            <div className="p-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Motion AI Result</span>
                </div>
                
                {aiResult.intent === "plan_day" && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center">
                      <Wand2 className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Day Optimized</p>
                      <p className="text-xs text-indigo-300/60">I have re-slotted {aiResult.data.count} tasks for maximum efficiency.</p>
                    </div>
                  </div>
                )}

                {aiResult.intent === "get_next_task" && (
                  <div className="flex items-center gap-4">
                    {aiResult.data.nextTask ? (
                      <>
                        <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center">
                          <ArrowRight className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-indigo-400/60 uppercase">Next Action</p>
                          <p className="text-sm font-bold text-white">{aiResult.data.nextTask.title}</p>
                          <p className="text-[10px] text-zinc-500">Scheduled for {new Date(aiResult.data.nextTask.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-indigo-500/40" />
                      </>
                    ) : (
                      <p className="text-sm text-zinc-400 italic">No upcoming tasks found. Use 'Create task' to add some.</p>
                    )}
                  </div>
                )}

                {aiResult.intent === "create_goal" && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center">
                      <Target className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Goal Created: {aiResult.data.title}</p>
                      <p className="text-xs text-indigo-300/60">AI has architected {aiResult.data.taskCount} tasks for this objective.</p>
                    </div>
                  </div>
                )}

                {aiResult.intent === "create_task" && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center">
                      <ListTodo className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Task Created: {aiResult.data.title}</p>
                      <p className="text-xs text-indigo-300/60">Estimated duration: {aiResult.data.duration}m. Added to today's list.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Smart Command Suggestion */}
          {!aiResult && query.trim() && !filteredCommands.some(c => c.title.toLowerCase() === query.toLowerCase()) && (
            <button
               onClick={() => handleSmartAction()}
               className="w-full flex items-center gap-4 p-3 hover:bg-zinc-800/50 rounded-xl transition-all group border border-dashed border-zinc-800 hover:border-indigo-500/30 mb-2"
            >
              <div className="p-2 bg-zinc-800 rounded-lg group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors animate-pulse">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-zinc-100 group-hover:text-white">Ask AI to &ldquo;{query}&rdquo;</p>
                <p className="text-[10px] text-zinc-500 font-medium">Auto-detect intent and execute system action</p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-indigo-500 transition-all group-hover:translate-x-1" />
            </button>
          )}

          {/* Static Commands */}
          <div className="space-y-1">
            {filteredCommands.length > 0 ? (
              filteredCommands.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={() => runCommand(cmd.route)}
                  className="w-full flex items-center gap-4 p-3 hover:bg-indigo-600/10 rounded-xl transition-all group border border-transparent hover:border-indigo-500/20"
                >
                  <div className="p-2 bg-zinc-800 rounded-lg group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                    <cmd.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-zinc-100 group-hover:text-white">{cmd.title}</p>
                    <p className="text-[10px] text-zinc-500 font-medium">{cmd.description}</p>
                  </div>
                  <div className="hidden group-hover:block text-[10px] font-black text-indigo-400 uppercase tracking-widest px-2">
                    Jump To
                  </div>
                </button>
              ))
            ) : !query.trim() && (
              <div className="p-8 text-center text-zinc-500 text-sm italic">
                No matching commands found.
              </div>
            )}
          </div>
        </div>

        <div className="p-3 bg-zinc-950/50 border-t border-zinc-900 flex justify-between items-center text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em]">
          <div className="flex gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Enter to Ask AI</span>
          </div>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}

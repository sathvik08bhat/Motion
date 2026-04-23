"use client";

import { useStore } from "../../core/store";
import { updateTask as updateTaskInDb, type Task } from "../../data/db";
import { CheckCircle2, Circle, Clock, Coffee } from "lucide-react";
import { motion } from "framer-motion";
import { fadeIn, slideUp, staggerContainer, cardHover, buttonHover } from "../../lib/animations";

import { eventBus, OS_EVENTS } from "../../core/events";

export default function TodayView() {
  const tasks = useStore((state) => state.tasks);
  const updateTaskInStore = useStore((state) => state.updateTask);

  const today = new Date().toDateString();
  const sortedTasks = tasks
    .filter((t) => new Date(t.scheduledAt).toDateString() === today)

    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());


  const toggleTask = async (task: Task) => {
    const newStatus = task.status === "done" ? "todo" : "done";
    try {
      await updateTaskInDb(task.id!, { status: newStatus });
      updateTaskInStore(task.id!, { status: newStatus });
      if (newStatus === "done") {
        eventBus.emit(OS_EVENTS.TASK_COMPLETED, { ...task, status: newStatus });
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  if (sortedTasks.length === 0) {
    return (
      <div
        className="p-12 rounded-2xl text-center space-y-4 animate-fade-in-up"
        style={{ background: "var(--bg-card)", border: "1px dashed var(--border-default)" }}
      >
        <div
          className="w-14 h-14 rounded-full mx-auto flex items-center justify-center"
          style={{ background: "var(--bg-secondary)" }}
        >
          <Clock className="w-6 h-6" style={{ color: "var(--text-muted)" }} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Your timeline is empty</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Click "Plan Day" to generate your focus schedule.</p>
        </div>
      </div>
    );
  }

  // Inject breaks into the render list
  const timelineItems: any[] = [];
  sortedTasks.forEach((task, index) => {
    // Check for gap before this task
    if (index > 0) {
      const prevTask = sortedTasks[index - 1];
      const gap = new Date(task.scheduledAt).getTime() - (new Date(prevTask.scheduledAt).getTime() + prevTask.duration * 60000);
      if (gap >= 5 * 60000) {
        timelineItems.push({
          type: 'break',
          duration: Math.floor(gap / 60000),
          time: new Date(new Date(prevTask.scheduledAt).getTime() + prevTask.duration * 60000)
        });
      }
    }

    timelineItems.push({ type: 'task', ...task });
  });

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="relative pl-8 space-y-6" 
      style={{ borderLeft: "none" }}
    >
      {timelineItems.map((item, idx) => (
        <motion.div 
          key={item.type === 'break' ? `break-${idx}` : item.id} 
          variants={slideUp}
          className="relative"
        >
          {/* Dot on timeline */}
          <motion.div
            variants={fadeIn}
            className="absolute z-10 rounded-full"
            style={{
              left: "-21px",
              top: "6px",
              width: "10px",
              height: "10px",
              background: item.type === 'break' ? "var(--border-strong)" : (item.status === 'done' ? "var(--border-strong)" : "var(--accent-primary)"),
              boxShadow: item.status !== 'done' && item.type !== 'break' ? "0 0 0 3px var(--accent-primary-light)" : "none",
            }}
          />

          {item.type === 'break' ? (
            <div className="flex items-center gap-4 py-1">
              <span className="text-[10px] font-black w-12 tabular-nums" style={{ color: "var(--text-muted)" }}>
                {item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--border-default)" }} />
              <div
                className="flex items-center gap-2 px-3 py-1 rounded-full"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-default)" }}
              >
                <Coffee className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Recovery · {item.duration}m</span>
              </div>
              <div className="flex-1 h-px" style={{ background: "var(--border-default)" }} />
            </div>
          ) : (
            <div
              className={`flex items-start gap-6 group transition-all ${item.status === 'done' ? 'opacity-50' : ''}`}
            >
              <div className="flex flex-col items-center pt-0.5 w-10 flex-shrink-0">
                <span className="text-xs font-black tabular-nums" style={{ color: "var(--text-secondary)" }}>
                  {new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
                <span className="text-[10px] font-semibold mt-0.5 uppercase" style={{ color: "var(--text-muted)" }}>{item.duration}m</span>
              </div>

              <motion.div
                {...cardHover}
                className="flex-1 p-4 rounded-2xl transition-all duration-300 card"
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleTask(item)}
                    className="text-zinc-600 hover:text-indigo-400 transition-colors flex-shrink-0"
                  >
                    {item.status === "done" ? (
                      <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>
                    <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4
                        className="text-sm font-bold truncate"
                        style={{
                          color: item.status === "done" ? "var(--text-muted)" : "var(--text-primary)",
                          textDecoration: item.status === "done" ? "line-through" : "none"
                        }}
                      >
                        {item.title}
                      </h4>
                      <span className="badge badge-accent">
                        {item.domain}
                      </span>
                    </div>
                  </div>

                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}


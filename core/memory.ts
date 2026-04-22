import { db, type Task, type TaskPerformanceRecord } from "../data/db";
import { eventBus, OS_EVENTS } from "./events";

export async function logTaskCompleted(task: Task) {
  const record: TaskPerformanceRecord = {
    taskId: task.id!,
    goalId: task.goalId,
    type: "completion",
    duration: task.duration,
    timestamp: new Date(),
  };
  await db.taskPerformanceLogs.add(record);
}

export async function logTaskMissed(task: Task) {
  const record: TaskPerformanceRecord = {
    taskId: task.id!,
    goalId: task.goalId,
    type: "miss",
    duration: task.duration,
    timestamp: new Date(),
  };
  await db.taskPerformanceLogs.add(record);
}

export async function getPerformanceMetrics() {
  const logs = await db.taskPerformanceLogs.toArray();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayLogs = logs.filter((l) => l.timestamp >= today);
  const completed = todayLogs.filter((l) => l.type === "completion");
  const missed = todayLogs.filter((l) => l.type === "miss");

  const total = completed.length + missed.length;
  const successRate = total > 0 ? (completed.length / total) * 100 : 0;
  
  const avgDuration = completed.length > 0
    ? completed.reduce((acc, current) => acc + current.duration, 0) / completed.length
    : 0;

  return {
    today: {
      completed: completed.length,
      missed: missed.length,
      successRate,
      avgDuration,
    },
    totalLogs: logs.length
  };
}

// Automatically bind to the event system
export function initMemorySystem() {
  console.log("Memory System: Initializing listeners...");
  
  eventBus.on(OS_EVENTS.TASK_COMPLETED, (task) => {
    logTaskCompleted(task as Task);
  });

  eventBus.on(OS_EVENTS.TASK_MISSED, (task) => {
    logTaskMissed(task as Task);
  });
}

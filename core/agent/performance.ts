import { db, type Task, type DailyStats } from "../../data/db";

/**
 * Gets the current date string in YYYY-MM-DD format.
 */
function getDateKey(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Initializes or updates the daily stats record.
 */
async function updateDailyStats(type: "completed" | "missed") {
  const date = getDateKey();
  
  await db.transaction("rw", db.daily_stats, async () => {
    const existing = await db.daily_stats.get(date);
    
    if (existing) {
      await db.daily_stats.update(date, {
        [type]: existing[type] + 1,
        total: existing.total + 1
      });
    } else {
      await db.daily_stats.add({
        date,
        completed: type === "completed" ? 1 : 0,
        missed: type === "missed" ? 1 : 0,
        total: 1
      });
    }
  });
}

/**
 * Logs a task as completed and updates daily performance metrics.
 */
export async function logTaskCompleted(task: Task) {
  // 1. Log the specific performance record
  await db.taskPerformanceLogs.add({
    taskId: task.id!,
    goalId: task.goalId,
    type: "completion",
    duration: task.duration,
    timestamp: new Date()
  });

  // 2. Update the daily aggregate
  await updateDailyStats("completed");
}

/**
 * Logs a task as missed (expired or cancelled) and updates daily metrics.
 */
export async function logTaskMissed(task: Task) {
  // 1. Log the specific performance record
  await db.taskPerformanceLogs.add({
    taskId: task.id!,
    goalId: task.goalId,
    type: "miss",
    duration: task.duration,
    timestamp: new Date()
  });

  // 2. Update the daily aggregate
  await updateDailyStats("missed");
}

/**
 * Retrieves the performance statistics for the current day.
 */
export async function getDailyPerformance(): Promise<DailyStats> {
  const date = getDateKey();
  const stats = await db.daily_stats.get(date);
  
  return stats || {
    date,
    completed: 0,
    missed: 0,
    total: 0
  };
}

/**
 * Calculates the user's completion rate based on daily stats.
 * Returns a value between 0 and 1.
 */
export async function getCompletionRate(): Promise<number> {
  const stats = await getDailyPerformance();
  if (stats.total === 0) return 0;
  return stats.completed / stats.total;
}

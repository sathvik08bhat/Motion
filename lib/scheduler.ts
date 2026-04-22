import { db, type Task, type Goal, type TaskPerformanceRecord } from "../data/db";
import { eventBus, OS_EVENTS } from "../core/events";
import { calculatePriorityScore } from "../core/engine/priority";
import { getSystemPerformanceMetrics } from "./services/memory";

export interface ScheduledUpdate {
  id: number;
  updates: Partial<Task>;
}

// 1. Boundary Constants
const WORKING_HOURS_START = 8; // 8:00 AM
const WORKING_HOURS_END = 22;   // 10:00 PM
const BUFFER_MINUTES = 5;

export async function calculateSchedule(tasks: Task[], goals: Goal[]): Promise<ScheduledUpdate[]> {
  // 1. Fetch historical logs and calculate adaptive metrics
  const logs = await db.taskPerformanceLogs.toArray();
  const metrics = getSystemPerformanceMetrics(logs);
  
  console.log(`🧠 Motion Memory: System state is ${metrics.state} (Miss Rate: ${(metrics.missRate * 100).toFixed(1)}%)`);

  // 2. Filter for pending tasks
  const pendingTasks = tasks.filter((t) => t.status !== "done");

  // 3. Enrich with dynamic priority scores and adaptive duration scaling
  const enrichedTasks = pendingTasks.map((task) => {
    const goal = goals.find((g) => g.id === task.goalId);
    const missCount = logs.filter((l) => l.taskId === task.id && l.type === "miss").length;

    // Apply Adaptive Memory Scaling
    let adjustedDuration = Math.max(15, Math.floor(task.duration * metrics.durationAdjustment));

    // Apply "Struggle Adjustment": Further reduce duration if this specific task is being missed
    if (missCount >= 2) {
      const reductionFactor = Math.pow(0.85, Math.floor(missCount / 2));
      adjustedDuration = Math.max(15, Math.floor(adjustedDuration * reductionFactor));
    }

    return {
      task: { ...task, duration: adjustedDuration },
      score: calculatePriorityScore(task, goal, logs),
    };
  });

  // Sort by Score (Desc), then Task Duration (Asc)
  const sorted = enrichedTasks.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score;
    }
    return a.task.duration - b.task.duration;
  });

  // 4. Multi-Goal Quota Calculation (Adaptive)
  const MAX_DAILY_MINUTES = metrics.capacityMinutes; 
  const ANCHOR_QUOTA_MINUTES = Math.floor(MAX_DAILY_MINUTES * 0.60);
  const SECONDARY_QUOTA_MINUTES = MAX_DAILY_MINUTES - ANCHOR_QUOTA_MINUTES;

  // Identify Anchor Goal (Highest Priority)
  const sortedGoals = [...goals].sort((a, b) => {
    const priorityMap = { high: 3, medium: 2, low: 1 };
    return String(priorityMap[b.priority] || 0).localeCompare(String(priorityMap[a.priority] || 0));
  });
  const anchorGoalId = sortedGoals[0]?.id;

  // 5. Assign time slots with Quota Awareness & Diversity Control
  const now = new Date();
  const startTime = new Date();
  startTime.setHours(WORKING_HOURS_START, 0, 0, 0);
  
  if (now.getTime() > startTime.getTime()) {
    startTime.setTime(now.getTime());
  }

  const endTimeToday = new Date();
  endTimeToday.setHours(WORKING_HOURS_END, 0, 0, 0);
  
  let currentOffset = 0;
  let accumulatedTaskTime = 0;
  const goalTimeMap: Record<number, number> = {};
  const updates: ScheduledUpdate[] = [];
  const deferred: typeof sorted = [];

  // Pass 1: Quota-Respecting Allocation
  for (const item of sorted) {
    const gId = item.task.goalId || -1;
    const isAnchor = gId === anchorGoalId;
    const quota = isAnchor ? ANCHOR_QUOTA_MINUTES : SECONDARY_QUOTA_MINUTES;
    const currentGoalTime = goalTimeMap[gId] || 0;

    // Boundary Check
    if (accumulatedTaskTime + item.task.duration > MAX_DAILY_MINUTES) break;

    // Quota Enforcement: Defer if this task exceeds the goal's quota
    if (currentGoalTime + item.task.duration > quota && sorted.length > updates.length + deferred.length + 1) {
      deferred.push(item);
      continue;
    }

    const theoreticalScheduledAt = new Date(startTime.getTime() + currentOffset * 60000);
    const theoreticalEndAt = new Date(theoreticalScheduledAt.getTime() + item.task.duration * 60000);

    if (theoreticalEndAt.getTime() > endTimeToday.getTime()) continue;

    updates.push({ id: item.task.id!, updates: { scheduledAt: theoreticalScheduledAt } });
    
    currentOffset += item.task.duration + metrics.bufferMinutes;
    accumulatedTaskTime += item.task.duration;
    goalTimeMap[gId] = (goalTimeMap[gId] || 0) + item.task.duration;
  }

  // Pass 2: Fill remaining time with deferred tasks (Overflow Logic)
  for (const item of deferred) {
    if (accumulatedTaskTime + item.task.duration > MAX_DAILY_MINUTES) break;

    const theoreticalScheduledAt = new Date(startTime.getTime() + currentOffset * 60000);
    const theoreticalEndAt = new Date(theoreticalScheduledAt.getTime() + item.task.duration * 60000);

    if (theoreticalEndAt.getTime() > endTimeToday.getTime()) continue;

    updates.push({ id: item.task.id!, updates: { scheduledAt: theoreticalScheduledAt } });
    
    currentOffset += item.task.duration + metrics.bufferMinutes;
    accumulatedTaskTime += item.task.duration;
  }

  return updates;
}

export async function getAutoRescheduledUpdates(tasks: Task[]): Promise<ScheduledUpdate[]> {
  const logs = await db.taskPerformanceLogs.toArray();
  const metrics = getSystemPerformanceMetrics(logs);
  
  const now = new Date();
  const overdueTasks = tasks
    .filter((t) => t.status !== "done" && t.scheduledAt.getTime() < now.getTime())
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

  if (overdueTasks.length === 0) return [];

  // Reset Boundaries
  const startToday = new Date();
  startToday.setHours(WORKING_HOURS_START, 0, 0, 0);

  const endToday = new Date();
  endToday.setHours(WORKING_HOURS_END, 0, 0, 0);

  // Find the next available slot
  let horizon = Math.max(now.getTime(), startToday.getTime());
  
  const upcomingToday = tasks
    .filter((t) => t.status !== "done" && t.scheduledAt.getTime() >= horizon && t.scheduledAt.getTime() < endToday.getTime())
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

  if (upcomingToday.length > 0) {
    const lastTask = upcomingToday[upcomingToday.length - 1];
    horizon = Math.max(horizon, lastTask.scheduledAt.getTime() + lastTask.duration * 60000 + metrics.bufferMinutes * 60000);
  }

  const updates: ScheduledUpdate[] = [];
  let currentOffset = 0;

  for (const task of overdueTasks) {
    const theoreticalScheduledAt = horizon + currentOffset * 60000;
    const theoreticalEndAt = theoreticalScheduledAt + task.duration * 60000;

    // Only reschedule if it fits before 10 PM
    if (theoreticalEndAt <= endToday.getTime()) {
      eventBus.emit(OS_EVENTS.TASK_MISSED, task);
      updates.push({
        id: task.id!,
        updates: {
          scheduledAt: new Date(theoreticalScheduledAt),
        },
      });
      currentOffset += task.duration + metrics.bufferMinutes;
    }
  }

  return updates;
}

export async function getNextBestTask(tasks: Task[], goals: Goal[]): Promise<Task | null> {
  const logs = await db.taskPerformanceLogs.toArray();
  
  const pendingTasks = tasks.filter((t) => t.status !== "done");
  if (pendingTasks.length === 0) return null;

  const enriched = pendingTasks.map((task) => {
    const goal = goals.find((g) => g.id === task.goalId);
    return {
      task,
      score: calculatePriorityScore(task, goal, logs),
    };
  });

  // Sort by score first, then duration
  const sorted = enriched.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.task.duration - b.task.duration;
  });
  
  return sorted[0]?.task || null;
}

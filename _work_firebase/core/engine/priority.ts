import { type Task, type Goal, type TaskPerformanceRecord } from "../../data/db";
import { type PerformanceMetrics } from "../../lib/services/memory";

export function calculatePriorityScore(
  task: Task,
  goal?: Goal,
  logs: TaskPerformanceRecord[] = [],
  metrics?: PerformanceMetrics
): number {

  let score = 0;

  // 1. Goal Base Priority
  if (goal) {
    const baseScores = { high: 100, medium: 50, low: 10 };
    score += baseScores[goal.priority] || 0;
  }

  // 2. Urgency (Deadline Proximity)
  if (goal?.deadline) {
    const now = new Date().getTime();
    const deadlineTime = new Date(goal.deadline).getTime();
    const hoursLeft = (deadlineTime - now) / (1000 * 60 * 60);

    if (hoursLeft < 0) {
      score += 200; // Overdue
    } else if (hoursLeft < 24) {
      score += 150; // Due today
    } else if (hoursLeft < 72) {
      score += 75; // Due within 3 days
    }
  }

  // 3. Task Age (Prevention of Starvation)
  // Tasks gain 5 points per day since creation
  if (task.createdAt) {
    const ageInDays = (new Date().getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.floor(ageInDays * 5);
  }

  // 4. Historical Resilience (Miss Count)
  const missCount = logs.filter(l => l.taskId === task.id && l.type === 'miss').length;
  score += missCount * 40; // Increased boost for frequently missed tasks

  // 5. Struggle Mitigation
  if (missCount >= 3) {
    score += 100; // Extra "Urgent Rescue" boost
  }

  // 6. Memory Pattern Boosts
  if (metrics) {
    // 6.1. Difficult Goal Support
    if (goal?.id && metrics.failurePatterns.difficultGoals.includes(goal.id)) {
      score += 60; // Extra nudge for categories that are struggling
    }

    // 6.2. Peak Performance Window
    const currentHour = new Date().getHours();
    if (currentHour >= metrics.peakWindow.start && currentHour <= metrics.peakWindow.end) {
      // If it's a high priority task, boost it more during peak focus
      if (goal?.priority === 'high' || task.duration > 60) {
        score += 80;
      }
    }

    // 6.3. Duration Sensitivity
    if (task.duration > metrics.recommendedMaxDuration) {
      score -= 50; // De-prioritize oversized tasks to encourage splitting
    }
  }

  // 7. Dynamic Module Hooks

  const { registry } = require("../modules/registry");
  const hooks = registry.getPriorityHooks();
  for (const hook of hooks) {
    try {
      score += hook(task, goal);
    } catch (error) {
      console.error("❌ Priority Engine: Module hook failed:", error);
    }
  }

  return score;
}


import { type Task, type Goal, type TaskPerformanceRecord } from "../../data/db";

export function calculatePriorityScore(
  task: Task,
  goal?: Goal,
  logs: TaskPerformanceRecord[] = []
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

  return score;
}

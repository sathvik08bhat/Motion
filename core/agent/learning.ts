import { db, type Task } from "../../data/db";
import { classifyUser } from "./behavior";
import { logTaskCompleted, logTaskMissed } from "./performance";

export interface TaskPattern {
  keyword: string;
  successRate: number;
  totalAttempts: number;
}

/**
 * Tracks a successfully completed task.
 * Serves as the learning ingestion point.
 */
export async function trackSuccess(task: Task) {
  await logTaskCompleted(task);
}

/**
 * Tracks a missed task.
 * Serves as the learning ingestion point.
 */
export async function trackFailure(task: Task) {
  await logTaskMissed(task);
}

/**
 * Analyzes historical performance to find patterns in task completion.
 * Groups by simple keywords (e.g., first word of task) to identify struggles.
 */
export async function getPatterns(): Promise<TaskPattern[]> {
  const logs = await db.taskPerformanceLogs.toArray();
  const tasks = await db.tasks.toArray();

  const keywordStats: Record<string, { success: number; miss: number }> = {};

  for (const log of logs) {
    const task = tasks.find(t => t.id === log.taskId);
    if (!task) continue;

    // Use the first word as a basic keyword heuristic (e.g., "Read", "Code", "Run")
    const keyword = task.title.split(' ')[0].toLowerCase();
    
    if (!keywordStats[keyword]) {
      keywordStats[keyword] = { success: 0, miss: 0 };
    }

    if (log.type === "completion") {
      keywordStats[keyword].success++;
    } else {
      keywordStats[keyword].miss++;
    }
  }

  const patterns: TaskPattern[] = [];
  for (const [keyword, stats] of Object.entries(keywordStats)) {
    const totalAttempts = stats.success + stats.miss;
    if (totalAttempts >= 3) { // Only consider it a pattern if there are enough data points
      patterns.push({
        keyword,
        successRate: stats.success / totalAttempts,
        totalAttempts
      });
    }
  }

  return patterns;
}

/**
 * Generates an adaptive, non-annoying message based on user state.
 */
export async function getAdaptiveMessage(): Promise<string> {
  const classification = await classifyUser();

  if (classification === "struggling") {
    return "Let's take it step by step today.";
  }
  
  if (classification === "high_performer") {
    return "You're doing great—ready to push further?";
  }

  // Moderate
  return "Stay consistent and keep going.";
}

/**
 * Adjusts task parameters (duration/difficulty) based on learned patterns.
 */
export async function adaptTaskParameters(task: Task): Promise<Partial<Task>> {
  const patterns = await getPatterns();
  const keyword = task.title.split(' ')[0].toLowerCase();
  
  const pattern = patterns.find(p => p.keyword === keyword);
  
  if (!pattern) return {}; // No adaptation needed

  if (pattern.successRate < 0.4) {
    // Frequently missed: reduce difficulty/duration
    return {
      duration: Math.max(10, Math.floor(task.duration * 0.7)),
      priority: task.priority === "high" ? "medium" : "low" // reduce difficulty implicitly via priority
    };
  }
  
  if (pattern.successRate > 0.8) {
    // Frequently completed: slightly increase challenge
    return {
      duration: Math.floor(task.duration * 1.1),
    };
  }

  return {};
}

/**
 * Feedback Analysis: Aggregates user behavior regarding agent suggestions.
 * 
 * Returns a summary of which action types are being rejected vs accepted.
 */
export async function getFeedbackSummary() {
  const logs = await db.action_logs.toArray();
  
  const summary: Record<string, { accepted: number; rejected: number }> = {};

  logs.forEach(log => {
    if (!summary[log.type]) {
      summary[log.type] = { accepted: 0, rejected: 0 };
    }
    
    if (log.status === "executed" || log.status === "approved") {
      summary[log.type].accepted++;
    } else if (log.status === "rejected") {
      summary[log.type].rejected++;
    }
  });

  return summary;
}


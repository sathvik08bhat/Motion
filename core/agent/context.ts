import { db } from '../../data/db';
import { getSystemPerformanceMetrics } from '../../lib/services/memory';

export interface AIContext {
  currentTime: string;
  timestamp: number;
  performance: {
    state: string;
    missRate: number;
    capacityMinutes: number;
  };
  goals: Array<{
    id: number;
    title: string;
    priority: string;
    status: string;
    deadline: string;
  }>;
  tasks: Array<{
    id: number;
    title: string;
    status: string;
    duration: number;
    scheduledAt: string;
    goalId?: number;
  }>;
  summary: {
    totalTasks: number;
    pendingTasks: number;
    completedTasks: number;
    activeGoals: number;
  };
}

/**
 * Builds a comprehensive context snapshot of the OS state for AI processing.
 */
export async function buildAIContext(): Promise<AIContext> {
  const [goals, tasks, logs] = await Promise.all([
    db.goals.toArray(),
    db.tasks.toArray(),
    db.taskPerformanceLogs.toArray()
  ]);

  const metrics = getSystemPerformanceMetrics(logs);
  const now = new Date();

  const pendingTasks = tasks.filter(t => t.status !== 'done');
  const completedTasks = tasks.filter(t => t.status === 'done');

  return {
    currentTime: now.toLocaleString(),
    timestamp: now.getTime(),
    performance: {
      state: metrics.state,
      missRate: metrics.missRate,
      capacityMinutes: metrics.capacityMinutes
    },
    goals: goals.map(g => ({
      id: g.id!,
      title: g.title,
      priority: g.priority,
      status: g.status,
      deadline: new Date(g.deadline).toISOString()
    })),
    tasks: tasks.map(t => ({
      id: t.id!,
      title: t.title,
      status: t.status,
      duration: t.duration,
      scheduledAt: new Date(t.scheduledAt).toISOString(),
      goalId: t.goalId
    })),
    summary: {
      totalTasks: tasks.length,
      pendingTasks: pendingTasks.length,
      completedTasks: completedTasks.length,
      activeGoals: goals.filter(g => g.status !== 'completed').length
    }
  };
}

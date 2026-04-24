import { TaskPerformanceRecord } from "../../data/db";

export interface PerformanceMetrics {
  missRate: number;
  completionStreak: number;
  durationAdjustment: number;
  bufferMinutes: number;
  capacityMinutes: number;
  state: "NORMAL" | "HIGH_STRESS" | "PEAK_PERFORMANCE";
  peakWindow: { start: number; end: number }; // Hour of day
  failurePatterns: {
    difficultGoals: number[];
    isLongTaskSensitive: boolean;
  };
  recommendedMaxDuration: number;
}


/**
 * Performance-driven Learning Engine (Memory)
 * Analyzes historical logs to calibrate scheduling parameters.
 */
export function getSystemPerformanceMetrics(logs: TaskPerformanceRecord[]): PerformanceMetrics {
  // 1. Analyze recent window (Last 20 entries or 7 days)
  const recentLogs = logs.slice(-20);
  if (recentLogs.length === 0) {
    return {
      missRate: 0,
      completionStreak: 0,
      durationAdjustment: 1.0,
      bufferMinutes: 5,
      capacityMinutes: 420,
      state: "NORMAL",
      peakWindow: { start: 9, end: 12 },
      failurePatterns: { difficultGoals: [], isLongTaskSensitive: false },
      recommendedMaxDuration: 120
    };
  }

  const totalRecent = recentLogs.length;
  const misses = recentLogs.filter((l) => l.type === "miss");
  const missRate = misses.length / totalRecent;

  // 2. Identify Current State
  let state: PerformanceMetrics["state"] = "NORMAL";
  let durationAdjustment = 1.0;
  let bufferMinutes = 5;
  let capacityMinutes = 420;

  if (missRate > 0.4) {
    state = "HIGH_STRESS";
    durationAdjustment = 0.8; 
    bufferMinutes = 15;        
    capacityMinutes = 300;     
  } else if (missRate < 0.1 && totalRecent >= 5) {
    state = "PEAK_PERFORMANCE";
    durationAdjustment = 1.1; 
    bufferMinutes = 2;        
    capacityMinutes = 480;    
  }

  // 3. Pattern Recognition: Time of Day Success

  const completions = recentLogs.filter(l => l.type === 'completion');
  const hourCounts: Record<number, number> = {};
  completions.forEach(l => {
    const hour = new Date(l.timestamp).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  let peakHour = 9; // Default to 9 AM
  let maxCount = 0;
  Object.entries(hourCounts).forEach(([hour, count]) => {
    if (count > maxCount) {
      maxCount = count;
      peakHour = parseInt(hour);
    }
  });

  // 4. Failure Patterns: Duration Sensitivity

  const avgMissDuration = misses.length > 0 
    ? misses.reduce((acc, l) => acc + l.duration, 0) / misses.length 
    : 0;
  const avgCompDuration = completions.length > 0 
    ? completions.reduce((acc, l) => acc + l.duration, 0) / completions.length 
    : 0;
  
  const isLongTaskSensitive = avgMissDuration > avgCompDuration * 1.5;
  const recommendedMaxDuration = isLongTaskSensitive ? Math.max(45, Math.floor(avgCompDuration * 1.2)) : 120;

  // 5. Goal Specific Failures
  const difficultGoals = Array.from(new Set(misses.map(m => m.goalId).filter(id => id !== undefined))) as number[];

  return {
    missRate,
    completionStreak: 0,
    durationAdjustment,
    bufferMinutes,
    capacityMinutes,
    state,
    peakWindow: { start: peakHour, end: (peakHour + 3) % 24 },
    failurePatterns: {
      difficultGoals,
      isLongTaskSensitive
    },
    recommendedMaxDuration
  };
}


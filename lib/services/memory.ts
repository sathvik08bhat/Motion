import { TaskPerformanceRecord } from "../../data/db";

export interface PerformanceMetrics {
  missRate: number;
  completionStreak: number;
  durationAdjustment: number;
  bufferMinutes: number;
  capacityMinutes: number;
  state: "NORMAL" | "HIGH_STRESS" | "PEAK_PERFORMANCE";
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
    };
  }

  const misses = recentLogs.filter((l) => l.type === "miss").length;
  const missRate = misses / recentLogs.length;

  // 2. Identify Current State
  let state: PerformanceMetrics["state"] = "NORMAL";
  let durationAdjustment = 1.0;
  let bufferMinutes = 5;
  let capacityMinutes = 420;

  if (missRate > 0.4) {
    state = "HIGH_STRESS";
    durationAdjustment = 0.8; // Reduce task sizes by 20%
    bufferMinutes = 15;        // Increase space to 15m
    capacityMinutes = 300;     // Cap at 5 hours
  } else if (missRate < 0.1 && recentLogs.length >= 5) {
    state = "PEAK_PERFORMANCE";
    durationAdjustment = 1.1; // Capitalize on momentum
    bufferMinutes = 2;        // Fast-track with 2m buffers
    capacityMinutes = 480;    // Expand to 8 hours
  }

  return {
    missRate,
    completionStreak: 0, // Placeholder for future logic
    durationAdjustment,
    bufferMinutes,
    capacityMinutes,
    state,
  };
}

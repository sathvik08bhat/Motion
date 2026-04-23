import { db } from "../../data/db";
import { classifyUser } from "./behavior";

/**
 * Checks if the user is showing signs of fatigue or burnout.
 * 
 * Rules for Fatigue:
 * 1. User is classified as "struggling" (low completion rate).
 * 2. User has had multiple missed tasks consistently over the last 2-3 days.
 */
export async function isUserFatigued(): Promise<boolean> {
  const classification = await classifyUser();
  
  if (classification !== "struggling") {
    return false;
  }

  // Get the last 3 days of stats
  const recentStats = await db.daily_stats
    .orderBy("date")
    .reverse()
    .limit(3)
    .toArray();

  if (recentStats.length < 2) {
    return false; // Not enough data to confirm fatigue
  }

  // Check if multiple tasks were missed in at least 2 of the recent days
  let daysWithHighMisses = 0;
  for (const stat of recentStats) {
    if (stat.missed >= 2) {
      daysWithHighMisses++;
    }
  }

  return daysWithHighMisses >= 2;
}

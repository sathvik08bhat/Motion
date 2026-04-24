import { getCompletionRate } from "./performance";

export type UserBehaviorClass = "high_performer" | "moderate" | "struggling";

/**
 * Behavior System: Classifies the user based on their performance metrics.
 * 
 * Rules:
 * - Rate > 80%: High Performer (Locked in)
 * - Rate 40% - 80%: Moderate (Standard operation)
 * - Rate < 40%: Struggling (Needs intervention)
 */
export async function classifyUser(): Promise<UserBehaviorClass> {
  const rate = await getCompletionRate();

  if (rate > 0.8) {
    return "high_performer";
  }
  
  if (rate >= 0.4) {
    return "moderate";
  }

  return "struggling";
}

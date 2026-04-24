import { db } from '../../data/db';
import { AgentAction } from './types';

/**
 * Action Log System: Persistent audit trail for all agent decisions.
 * Saves actions into IndexedDB for transparency and history.
 */
export async function logAction(
  action: AgentAction,
  status: "approved" | "rejected" | "executed" | "success" | "failed" // Extending slightly to match existing statuses
): Promise<void> {
  console.log(`📝 Logging Action [${action.type}] with status: ${status}`);

  try {
    await db.action_logs.put({
      id: action.id,
      type: action.type,
      payload: JSON.stringify(action.payload),
      reason: action.reason,
      timestamp: action.timestamp,
      status: status
    });
  } catch (error) {
    console.error("❌ Failed to log action:", error);
  }
}

/**
 * Fetches all action logs, sorted by latest first.
 */
export async function getAllLogs() {
  try {
    return await db.action_logs.orderBy('timestamp').reverse().toArray();
  } catch (error) {
    console.error("❌ Failed to fetch action logs:", error);
    return [];
  }
}

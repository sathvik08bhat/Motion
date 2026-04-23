import { AgentAction } from './types';
import { interceptAction } from './interceptor';
import { executeAction } from './executor';
import { logAction } from './log';
import { useControlMode } from './control';
import { usePendingStore } from './pending';
import { useUndoStore } from './undo';
import { eventBus, OS_EVENTS } from '../events';
import { getTasks } from '../../data/db';
import { analyzeDomains, detectImbalance, enforceBalance } from './domainEngine';




/**
 * Agent Orchestrator: The high-level entry point for all agent actions.
 * It manages the lifecycle from interception to logging.
 */
export async function runAgentAction(action: AgentAction): Promise<void> {
  // --- Proactive Balance Intervention ---
  if (action.type === "create_goal_with_tasks" || action.type === "bulk_create_tasks") {
    try {
      const currentTasks = await getTasks();
      const stats = analyzeDomains(currentTasks);
      const report = detectImbalance(stats);
      
      if (action.payload && Array.isArray(action.payload.tasks)) {
        action.payload.tasks = enforceBalance(action.payload.tasks, report);
      }
    } catch (e) {
      console.error("Balance enforcement failed:", e);
    }
  }

  // 1. Intercept
  const interception = await interceptAction(action);


  if (interception.status === "approved") {
    // Log approval before execution
    await logAction(action, "approved");
    
    const result = await executeAction(action);
    if (result.success) {
      await logAction(action, "executed");
      useUndoStore.getState().setUndoVisible(true);
      eventBus.emit(OS_EVENTS.ACTION_EXECUTED, action);
    } else {

      await logAction(action, "failed");
    }
    return;
  }

  if (interception.status === "pending") {
    console.log("🚦 Orchestrator: Action added to non-intrusive suggestions.");
    
    // Check if it's a critical action that still needs a modal
    if (action.type === "clear_all_tasks") {
      usePendingStore.getState().setPendingAction(action);
    } else {
      usePendingStore.getState().addSuggestion(action);
    }
    return;
  }


  if (interception.status === "rejected") {
    console.log("🛑 Orchestrator: Action rejected by interceptor.");
    await logAction(action, "rejected");
    return;
  }
}


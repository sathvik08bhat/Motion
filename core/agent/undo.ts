import { create } from 'zustand';
import { AgentAction } from './types';
import { db, updateTask, addTask } from '../../data/db';

interface UndoState {
  lastAction: AgentAction | null;
  previousState: any;
  isUndoVisible: boolean;
  setUndoState: (action: AgentAction | null, state: any) => void;
  setUndoVisible: (visible: boolean) => void;
  clearUndoState: () => void;
}

/**
 * Undo Store: Manages the system's "Revert" capability.
 * Captures the state before an action is applied to allow seamless rollbacks.
 */
export const useUndoStore = create<UndoState>((set) => ({
  lastAction: null,
  previousState: null,
  isUndoVisible: false,
  
  setUndoState: (action, state) => set({ 
    lastAction: action, 
    previousState: state,
    isUndoVisible: !!action 
  }),
  
  setUndoVisible: (visible) => set({ isUndoVisible: visible }),
  
  clearUndoState: () => set({ 
    lastAction: null, 
    previousState: null, 
    isUndoVisible: false 
  }),
}));

/**
 * Helper to save state before an action.
 */
export function savePreviousState(action: AgentAction, state: any) {
  console.log(`🔙 Undo System: Capturing state for [${action.type}]`);
  useUndoStore.getState().setUndoState(action, state);
}

/**
 * Reverts the last recorded action.
 */
export async function undoLastAction(): Promise<void> {
  const { lastAction, previousState, clearUndoState } = useUndoStore.getState();

  if (!lastAction) {
    console.warn("🔄 Undo System: No action to revert.");
    return;
  }

  console.log(`🔄 Undo System: Reverting [${lastAction.type}]`);

  try {
    switch (lastAction.type) {
      case "create_task":
        // Revert creation: delete the newly created task(s)
        if (previousState?.id) {
          await db.tasks.delete(previousState.id);
        } else if (previousState?.ids) {
          await db.tasks.bulkDelete(previousState.ids);
        }
        break;

      case "update_task":
        // Revert update: restore the entire old task object
        if (previousState?.id) {
          await updateTask(previousState.id, previousState);
        }
        break;

      case "schedule_task":
        // Revert scheduling: restore old scheduledAt
        if (previousState?.id && previousState?.scheduledAt) {
          await updateTask(previousState.id, { 
            scheduledAt: new Date(previousState.scheduledAt) 
          });
        }
        break;

      case "delete_task":
        // Revert deletion: recreate the task from the saved state
        if (previousState) {
          await addTask(previousState);
        }
        break;

      case "bulk_schedule":
        // Revert bulk optimization: restore all modified tasks
        if (Array.isArray(previousState)) {
          const { bulkUpdateTasks } = await import('../../data/db');
          const updates = previousState.map(t => ({ id: t.id, updates: t }));
          await bulkUpdateTasks(updates);
        }
        break;

      case "bulk_create_tasks":
        // Revert bulk creation: delete all created IDs
        if (previousState?.ids) {
          await db.tasks.bulkDelete(previousState.ids);
        }
        break;

      default:
        console.warn(`⚠️ Undo System: Action type ${lastAction.type} not supported for undo.`);
    }

    // Clear state after successful revert
    clearUndoState();
  } catch (error) {
    console.error("❌ Undo System: Revert failed:", error);
  }
}

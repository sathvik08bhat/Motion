import { create } from "zustand";
import type { AgentAction } from "./types";
import { addTask, db, updateTask } from "../../data/db";
import type { Page } from "../../data/db";
import { deletePage, savePage } from "../workspace/pages";

interface UndoState {
  lastAction: AgentAction | null;
  previousState: any;
  isUndoVisible: boolean;
  setUndoState: (action: AgentAction | null, state: any) => void;
  setUndoVisible: (visible: boolean) => void;
  clearUndoState: () => void;
}

export const useUndoStore = create<UndoState>((set) => ({
  lastAction: null,
  previousState: null,
  isUndoVisible: false,

  setUndoState: (action, state) =>
    set({
      lastAction: action,
      previousState: state,
      isUndoVisible: !!action,
    }),

  setUndoVisible: (visible) => set({ isUndoVisible: visible }),

  clearUndoState: () =>
    set({
      lastAction: null,
      previousState: null,
      isUndoVisible: false,
    }),
}));

export function savePreviousState(action: AgentAction, state: any) {
  useUndoStore.getState().setUndoState(action, state);
}

export async function undoLastAction(): Promise<void> {
  const { lastAction, previousState, clearUndoState } = useUndoStore.getState();
  if (!lastAction) return;

  try {
    switch (lastAction.type) {
      // Tasks
      case "create_task":
        if (previousState?.id) await db.tasks.delete(previousState.id);
        if (previousState?.ids) await db.tasks.bulkDelete(previousState.ids);
        break;
      case "update_task":
        if (previousState?.id) await updateTask(previousState.id, previousState);
        break;
      case "schedule_task":
        if (previousState?.id && previousState?.scheduledAt) {
          await updateTask(previousState.id, { scheduledAt: new Date(previousState.scheduledAt) });
        }
        break;
      case "delete_task":
        if (previousState) await addTask(previousState);
        break;
      case "bulk_schedule":
        if (Array.isArray(previousState)) {
          const { bulkUpdateTasks } = await import("../../data/db");
          const updates = previousState.map((t: any) => ({ id: t.id, updates: t }));
          await bulkUpdateTasks(updates);
        }
        break;
      case "bulk_create_tasks":
        if (previousState?.ids) await db.tasks.bulkDelete(previousState.ids);
        break;

      // Workspace
      case "create_page":
        if (previousState?.createdPageId) await deletePage(previousState.createdPageId);
        break;
      case "update_page":
      case "modify_page":
      case "delete_page":
        if (previousState && typeof previousState === "object" && (previousState as any).id && Array.isArray((previousState as any).blocks)) {
          await savePage(previousState as Page);
        }
        break;

      default:
        break;
    }

    clearUndoState();
  } catch (error) {
    console.error("Undo failed:", error);
  }
}


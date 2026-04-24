import { LifeDomain } from "./domains";

export type AgentActionType =
  | "create_task"
  | "update_task"
  | "schedule_task"
  | "delete_task"
  | "bulk_schedule"       // Added to support planner
  | "bulk_create_tasks"   // Added to support goal breakdown
  | "create_goal_with_tasks" // Added to support Intent Processor
  | "modify_page"          // Added to support Workspace AI Integrations
  | "add_calendar_event"
  | "send_message"
  | "architect_system"
  | "execute_rpa"
  | "clear_all_tasks";     // Added to support database reset



export type GoalWithTasksPayload = {
  goal: string;
  tasks: {
    title: string;
    duration: number;
    priority: "low" | "medium" | "high";
    domain: LifeDomain;
  }[];
};


export type AgentAction = {
  id: string;
  type: AgentActionType;
  payload: any;
  reason: string;
  timestamp: number;
};


/**
 * Creates a standardized Agent Action.
 * 
 * Rules:
 * 1. id is unique (based on timestamp).
 * 2. reason is REQUIRED and cannot be empty.
 * 3. timestamp is set to Date.now().
 */
export function createAction(
  type: AgentActionType,
  payload: any,
  reason: string
): AgentAction {
  if (!reason) {
    throw new Error("AgentAction Error: Rationale (reason) is required for all system actions.");
  }

  return {
    id: `action_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    type,
    payload,
    reason,
    timestamp: Date.now(),
  };
}

// Keeping createAgentAction for backward compatibility during transition if needed
export const createAgentAction = createAction;

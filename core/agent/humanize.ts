import { AgentAction } from './types';

export interface HumanizedAction {
  title: string;
  description: string;
}

/**
 * Action Humanization Layer: Translates technical AgentAction objects 
 * into clear, user-friendly language for confirmation flows and logs.
 */
export function humanizeAction(action: AgentAction): HumanizedAction {
  switch (action.type) {
    case "create_task":
      return {
        title: "Create Task",
        description: `A new task "${action.payload.title || 'Untitled'}" will be added to your plan.`
      };

    case "schedule_task":
      return {
        title: "Schedule Task",
        description: "This task will be assigned a specific time in your daily schedule."
      };

    case "update_task":
      return {
        title: "Update Task",
        description: "The task details will be updated to reflect current progress or changes."
      };

    case "delete_task":
      return {
        title: "Remove Task",
        description: "This task will be permanently removed from your active list."
      };

    case "bulk_schedule":
      return {
        title: "Optimize Schedule",
        description: `Re-organizing ${action.payload.updates?.length || 'multiple'} tasks into a more efficient time-based plan.`
      };

    case "bulk_create_tasks":
      return {
        title: "Import Tasks",
        description: `Adding a batch of ${action.payload.tasks?.length || 'multiple'} tasks to your system.`
      };

    case "create_goal_with_tasks":
      return {
        title: "Architect Project Plan",
        description: `Creating the goal "${action.payload.goal}" and decomposing it into actionable tasks for you.`
      };

    default:
      return {
        title: "System Action",
        description: action.reason || "The system will perform an action to improve your plan."
      };
  }
}

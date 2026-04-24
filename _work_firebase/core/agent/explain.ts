import { AgentAction } from './types';

/**
 * Explanation Engine: Translates technical Agent Actions into human-readable text.
 * This is a deterministic rule-based engine to build user trust.
 */
export function generateExplanation(action: AgentAction): string {
  switch (action.type) {
    case "create_task":
    case "bulk_create_tasks":
      return "Task was created because it supports your current goal or request.";

    case "schedule_task":
    case "bulk_schedule":
      return "Task was scheduled due to priority, deadline, or available time slot.";

    case "update_task":
      return "Task was updated to improve planning or reflect progress.";

    case "delete_task":
      return "Task was removed because it is no longer relevant.";

    case "create_goal_with_tasks":
      return "I will create a structured plan based on your goal.";

    case "create_page":
      return "Creating a new page so your workspace stays structured and easy to navigate.";

    case "update_page":
      return "Updating the page to match your requested organization (title or nesting).";

    case "delete_page":
      return "Removing the page because you asked to clean up your workspace.";

    case "modify_page":
      return "Editing the page content to reflect your instruction in a clear, readable format.";

    default:
      return "Action performed based on system logic.";
  }
}

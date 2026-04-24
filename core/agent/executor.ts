import { addTask, updateTask, type Task, db, addGoal } from '../../data/db';

import { AgentAction } from './types';
import { savePreviousState } from './undo';
import { detectDomain } from './domainDetect';


/**
 * Action Executor System: Executes validated Agent Actions against the system state.
 * 
 * RULES:
 * - Do NOT call interceptor here
 * - Do NOT mutate the action object
 * - Only execute logic
 * - If error occurs, return { success: false, action }
 */
export async function executeAction(action: AgentAction): Promise<{ success: boolean; action: AgentAction }> {
  console.log("Executing action:", action);

  try {
    switch (action.type) {
      case "create_task": {
        const newId = await addTask({
          ...action.payload,
          status: 'todo',
          priority: action.payload.priority || 'medium',
          domain: action.payload.domain || detectDomain(action.payload.title),
          createdAt: new Date(),

          scheduledAt: action.payload.scheduledAt ? new Date(action.payload.scheduledAt) : new Date()

        });
        savePreviousState(action, { id: newId });
        break;
      }



      case "update_task": {
        if (!action.payload.id) throw new Error("Task ID required for update");
        const originalTask = await db.tasks.get(action.payload.id);
        if (originalTask) savePreviousState(action, originalTask);
        await updateTask(action.payload.id, action.payload.updates);
        break;
      }


      case "schedule_task": {
        if (!action.payload.id || !action.payload.scheduledAt) {
          throw new Error("Task ID and scheduledAt required for scheduling");
        }
        const taskToSchedule = await db.tasks.get(action.payload.id);
        if (taskToSchedule) {
          savePreviousState(action, { id: taskToSchedule.id, scheduledAt: taskToSchedule.scheduledAt });
        }
        await updateTask(action.payload.id, {
          scheduledAt: new Date(action.payload.scheduledAt)
        });
        break;
      }


      case "delete_task": {
        if (!action.payload.id) throw new Error("Task ID required for deletion");
        const taskToDelete = await db.tasks.get(action.payload.id);
        if (taskToDelete) savePreviousState(action, taskToDelete);
        await db.tasks.delete(action.payload.id);
        break;
      }


      case "bulk_schedule": {
        if (!Array.isArray(action.payload.updates)) {
          throw new Error("Updates array required for bulk schedule");
        }
        const ids = action.payload.updates.map((u: any) => u.id);
        const originalTasks = await db.tasks.where('id').anyOf(ids).toArray();
        savePreviousState(action, originalTasks);

        const { bulkUpdateTasks } = await import('../../data/db');
        await bulkUpdateTasks(action.payload.updates);
        break;
      }


      case "bulk_create_tasks": {
        if (!Array.isArray(action.payload.tasks)) {
          throw new Error("Tasks array required for bulk create");
        }
        const createdIds = [];
        for (const t of action.payload.tasks) {
          const id = await addTask({
            ...t,
            status: 'todo',
            priority: t.priority || 'medium',
            domain: t.domain || detectDomain(t.title),
            createdAt: new Date(),
            scheduledAt: t.scheduledAt ? new Date(t.scheduledAt) : new Date()

          });
          createdIds.push(id);
        }
        savePreviousState(action, { ids: createdIds });
        break;
      }



      case "create_goal_with_tasks": {
        if (!action.payload.goal || !Array.isArray(action.payload.tasks)) {
          throw new Error("Goal and tasks required for complex creation");
        }
        
        // 1. Create Goal
        const goalId = await addGoal({
          title: action.payload.goal,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 day default
          priority: "medium",
          status: "not-started"
        });

        if (!goalId) throw new Error("Failed to create parent goal for roadmap.");


        // 2. Create Tasks linked to Goal
        const ids = [];
        for (const t of action.payload.tasks) {
          const id = await addTask({
            title: t.title,
            duration: t.duration,
            goalId: goalId as number,
            status: 'todo',
            priority: t.priority || 'medium',
            domain: t.domain || detectDomain(t.title),
            createdAt: new Date(),
            scheduledAt: new Date()

          });
          ids.push(id);
        }
        
        savePreviousState(action, { goalId, taskIds: ids });
        break;
      }



      case "modify_page": {
        const { pageId, operation, blockData, blockId } = action.payload;
        if (!pageId || !operation) throw new Error("pageId and operation required for modify_page");
        
        const blocksApi = await import('../workspace/blocks');
        
        if (operation === "add_block") {
          await blocksApi.addBlock(pageId, blockData);
        } else if (operation === "update_block" && blockId) {
          await blocksApi.updateBlock(pageId, blockId, blockData);
        } else if (operation === "delete_block" && blockId) {
          await blocksApi.deleteBlock(pageId, blockId);
        } else {
          throw new Error("Invalid modify_page operation");
        }
        
        // Note: Complex undo logic for blocks omitted for brevity
        savePreviousState(action, { pageId, operation });
        break;
      }

      case "add_calendar_event": {
        const { title, start, end, description } = action.payload;
        if (!title || !start || !end) throw new Error("title, start, and end required for calendar event");
        
        const { createCalendarEvent } = await import('../../lib/services/googleCalendar');
        const newEvent = await createCalendarEvent({
          title,
          start: new Date(start),
          end: new Date(end),
          description
        });
        savePreviousState(action, { externalId: newEvent.id });
        break;
      }

      case "send_message": {
        const { to, content, platform } = action.payload;
        if (!to || !content) throw new Error("to and content required for send_message");
        
        const { sendMessage } = await import('../../lib/services/messaging');
        await sendMessage({
          to,
          content,
          platform: platform || "whatsapp"
        });
        savePreviousState(action, { to, platform: platform || "whatsapp" });
        break;
      }

      case "architect_system": {
        const { intent } = action.payload;
        if (!intent) throw new Error("intent required for architect_system");
        
        const { architectSystem } = await import('./autonomousBuilder');
        const result = await architectSystem(intent);
        savePreviousState(action, { pageIds: result.pages });
        break;
      }

      case "execute_rpa": {
        const { task } = action.payload;
        if (!task) throw new Error("task required for execute_rpa");
        
        const { executeRPAWorkflow } = await import('./rpaExecutor');
        const result = await executeRPAWorkflow(task);
        if (!result.success) throw new Error(result.result);
        savePreviousState(action, { result: result.result });
        break;
      }
      
      case "clear_all_tasks": {
        const allTasks = await db.tasks.toArray();
        savePreviousState(action, allTasks);
        await db.tasks.clear();
        break;
      }

      default:

        console.warn("Unknown action type:", action.type);
        return { success: false, action };
    }

    return { success: true, action };
  } catch (error: any) {
    console.error("❌ Execution Error:", error);
    return { success: false, action };
  }
}

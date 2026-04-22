import { getAutoRescheduledUpdates } from "../../lib/scheduler";
import { bulkUpdateTasks } from "../../data/db";
import { eventBus, OS_EVENTS } from "../events";

const AUDIT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const notifiedTasks = new Set<number>();

/**
 * Continuous Agent Loop: Autonomously audits the OS state.
 */
export function initAgentLoop(store: any) {
  console.log("🤖 Motion Agent: Loop Initialized");
  
  // Run initial audit after hydration delay
  setTimeout(() => performAudit(store), 10000);

  // Periodic Audit
  const intervalId = setInterval(() => {
    performAudit(store);
  }, AUDIT_INTERVAL_MS);

  return () => {
    console.log("🤖 Motion Agent: Loop Terminated");
    clearInterval(intervalId);
  };
}

async function performAudit(store: any) {
  const { tasks, bulkUpdateTasks: bulkUpdateTasksInStore } = store.getState();
  
  if (!tasks || tasks.length === 0) return;

  console.log(`🤖 Motion Agent: Auditing ${tasks.length} tasks...`);

  // 1. Detect Missed Tasks & Get Rescheduling Slots
  const updates = await getAutoRescheduledUpdates(tasks);

  if (updates.length > 0) {
    console.log(`🚀 Motion Agent: Autonomously rescheduling ${updates.length} missed tasks.`);
    
    try {
      // 2. Commit to Database (IndexedDB)
      await bulkUpdateTasks(updates);
      
      // 3. Commit to Global Store (Zustand)
      bulkUpdateTasksInStore(updates);
      
      console.log("✅ Motion Agent: Schedule health restored.");
    } catch (error) {
      console.error("❌ Motion Agent: Audit commitment failed:", error);
    }
  } else {
    console.log("✨ Motion Agent: Schedule is healthy. No action required.");
  }

  // 4. Detect Upcoming Tasks (within 5 minutes)
  const now = Date.now();
  const fiveMinsFromNow = now + 5 * 60 * 1000;
  
  tasks.forEach((task: any) => {
    if (task.status === "todo") {
      const scheduledTime = new Date(task.scheduledAt).getTime();
      if (scheduledTime > now && scheduledTime <= fiveMinsFromNow) {
        if (!notifiedTasks.has(task.id!)) {
          eventBus.emit(OS_EVENTS.TASK_UPCOMING, task);
          notifiedTasks.add(task.id!);
        }
      }
    }
  });

  // 5. Run Module Agent Hooks
  const { registry } = require("../modules/registry");
  const hooks = registry.getAgentHooks();
  for (const hook of hooks) {
    try {
      await hook(store);
    } catch (error) {
      console.error("❌ Motion Agent: Module hook failed:", error);
    }
  }
}


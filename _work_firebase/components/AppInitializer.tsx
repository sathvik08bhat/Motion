"use client";

import { useEffect } from "react";
import { initMemorySystem } from "../core/memory";
import { initAgentLoop } from "../core/agent/loop";
import { useStore } from "../core/store";
import { eventBus, OS_EVENTS } from "../core/events";
import { requestNotificationPermission, sendNotification } from "../lib/services/notifications";
import { AVAILABLE_MODULES } from "../modules"; 
import { registerModule } from "../core/modules/registry";

export default function AppInitializer() {
  const store = useStore();

  useEffect(() => {
    // 1. Dynamic Module Installation
    const installed = store.installedModules || [];
    AVAILABLE_MODULES.forEach(mod => {
      if (installed.includes(mod.name)) {
        registerModule(mod);
      }
    });

    // 2. Systems Boot
    initMemorySystem();

    const cleanupLoop = initAgentLoop(useStore);

    // Initial Permissions
    requestNotificationPermission();

    // Event Listeners
    const onTaskUpcoming = (task: any) => {
      sendNotification("Task Starting Soon", { body: `Get ready: "${task.title}"` });
    };

    const onTaskMissed = (task: any) => {
      sendNotification("Task Missed", { body: `We've rescheduled "${task.title}" for later.` });
    };

    const onPlanCreated = (data: any) => {
      sendNotification("New Plan Ready", { body: `Calibrated ${data.count} tasks for optimal flow.` });
    };

    eventBus.on(OS_EVENTS.TASK_UPCOMING, onTaskUpcoming);
    eventBus.on(OS_EVENTS.TASK_MISSED, onTaskMissed);
    eventBus.on(OS_EVENTS.PLAN_CREATED, onPlanCreated);

    return () => {
      cleanupLoop();
      eventBus.off(OS_EVENTS.TASK_UPCOMING, onTaskUpcoming);
      eventBus.off(OS_EVENTS.TASK_MISSED, onTaskMissed);
      eventBus.off(OS_EVENTS.PLAN_CREATED, onPlanCreated);
    };
  }, []);

  return null;
}

"use client";

import { useEffect } from "react";
import { initMemorySystem } from "../core/memory";
import { initAgentLoop } from "../core/agent/loop";
import { useStore } from "../core/store";
import { eventBus, OS_EVENTS } from "../core/events";
import { requestNotificationPermission, sendNotification } from "../lib/services/notifications";
import { AVAILABLE_MODULES } from "../modules"; 
import { registerModule } from "../core/modules/registry";
import { syncEngine } from "../lib/syncEngine";

import { subscribeToAuth } from "../core/auth/service";
import { useAuthStore } from "../core/auth/store";

export default function AppInitializer() {
  const installedModules = useStore(s => s.installedModules);
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // 0. Service Worker Cleanup (Prevent conflicts from other projects on the same port)
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().then((success) => {
            if (success) console.log("[Motion OS] Unregistered stale service worker");
          });
        }
      });
    }

    console.log("[Motion OS] Initializing system...");
    // Auth Listener
    const unsubscribeAuth = subscribeToAuth((user) => {
      setUser(user);
      setLoading(false);
    });

    // 1. Dynamic Module Installation
    const installed = installedModules || [];
    AVAILABLE_MODULES.forEach(mod => {
      if (installed.includes(mod.name)) {
        registerModule(mod);
      }
    });

    // 2. Systems Boot
    initMemorySystem();
    syncEngine.start(5); // Start sync engine with 5m interval

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
      unsubscribeAuth();
      cleanupLoop();
      syncEngine.stop();
      eventBus.off(OS_EVENTS.TASK_UPCOMING, onTaskUpcoming);
      eventBus.off(OS_EVENTS.TASK_MISSED, onTaskMissed);
      eventBus.off(OS_EVENTS.PLAN_CREATED, onPlanCreated);
    };
  }, []);

  return null;
}

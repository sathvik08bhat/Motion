import { getTasks, getGoals } from "../../data/db";
import { runAgentAction } from "./orchestrator";
import { makeDecisions } from "./decision";
import { analyzeDomains, detectImbalance } from "./domainEngine";
import { getFeedbackSummary } from "./learning";

const AUDIT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Continuous Agent Loop: Autonomously audits the OS state.
 * 
 * Steps:
 * 1. Observe: get tasks, goals
 * 2. Analyze: detect missed tasks, overload, opportunities
 * 3. Decide: create actions
 * 4. Send: to interceptor via runAgentAction
 */
export function initAgentLoop(store: any) {
  console.log("🤖 Motion Agent: Loop Initialized");
  
  // Run initial audit after hydration delay
  setTimeout(() => performAudit(), 10000);

  // Periodic Audit
  const intervalId = setInterval(() => {
    performAudit();
  }, AUDIT_INTERVAL_MS);

  return () => {
    console.log("🤖 Motion Agent: Loop Terminated");
    clearInterval(intervalId);
  };
}

async function performAudit() {
  console.log("🔍 Motion Agent: Running System Audit...");
  
  try {
    // 1. Observe
    const tasks = await getTasks();
    const goals = await getGoals();
    const pendingTasks = tasks.filter(t => t.status === "todo");

    if (pendingTasks.length === 0 && goals.length === 0) {
      console.log("✨ Motion Agent: System is empty. No action required.");
      return;
    }

    // 2 & 3. Analyze & Decide
    const domainStats = analyzeDomains(tasks);
    const imbalance = detectImbalance(domainStats);
    const feedback = await getFeedbackSummary();
    
    const actionsToTake = await makeDecisions(tasks, goals, domainStats, imbalance, feedback);

    if (actionsToTake.length === 0) {
      console.log("✨ Motion Agent: System is healthy. No action required.");
      return;
    }

    console.log(`🤖 Motion Agent: Decision Engine proposed ${actionsToTake.length} interventions.`);

    // 4. Send to Interceptor (runAgentAction)
    for (const action of actionsToTake) {
      await runAgentAction(action);
    }

  } catch (error) {
    console.error("❌ Motion Agent: Audit failed:", error);
  }
}


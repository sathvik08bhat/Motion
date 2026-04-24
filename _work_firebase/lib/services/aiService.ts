import { callAI, generateTasksFromGoal, parseCommand as parseAICommand } from "../ai";

export { generateTasksFromGoal };

export interface GeneratedTask {
  title: string;
  duration: number; // in minutes
}

export type SmartIntentType = "PLAN" | "STATUS" | "CREATE_GOAL" | "UNKNOWN";

export interface SmartIntent {
  type: SmartIntentType;
  data?: any;
}

/**
 * Parses a natural language command into a structured intent using the pure AI wrapper.
 */
export async function parseSmartCommand(input: string): Promise<SmartIntent> {
  const q = input.toLowerCase().trim();

  try {
    const result = await parseAICommand(input);
    return {
      type: (result.intent.toUpperCase()) as SmartIntentType,
      data: result.data
    };
  } catch (error) {
    console.error("AI Intent Parsing service failed, falling back to heuristics:", error);
  }

  // Fallback Heuristics (Local processing if AI fails)
  if (q.includes("plan my day") || q.includes("optimize") || q.includes("prioritize") || q.includes("organize")) {
    return { type: "PLAN", data: {} };
  }
  if (q.includes("what") && (q.includes("next") || q.includes("now") || q.includes("do"))) {
    return { type: "STATUS", data: {} };
  }
  if (q.includes("create") || q.includes("start") || q.includes("learn") || q.includes("build") || q.includes("study")) {
    const title = input
      .replace(/create|start|learn|build|study/i, "")
      .replace(/goal|plan|for/i, "")
      .trim();
    return { type: "CREATE_GOAL", data: { title: title || "New Goal" } };
  }

  return { type: "UNKNOWN", data: {} };
}

function mockGenerateTasks(goalText: string): GeneratedTask[] {
  const lowercaseGoal = goalText.toLowerCase();
  if (lowercaseGoal.includes("learn") || lowercaseGoal.includes("study")) {
    return [
      { title: "Research foundational concepts", duration: 45 },
      { title: "Find and review top-rated learning resources", duration: 30 },
      { title: "Practice basic exercises", duration: 60 },
      { title: "Create a summary of key takeaways", duration: 30 },
    ];
  }
  if (lowercaseGoal.includes("build") || lowercaseGoal.includes("create") || lowercaseGoal.includes("make")) {
    return [
      { title: "Draft initial design and requirements", duration: 60 },
      { title: "Set up development/workspace environment", duration: 30 },
      { title: "Implement core functionality - Phase 1", duration: 120 },
      { title: "Testing and bug fixing", duration: 45 },
      { title: "Final Polish and review", duration: 30 },
    ];
  }
  return [
    { title: "Define the first actionable step", duration: 20 },
    { title: "Research specific requirements for this goal", duration: 40 },
    { title: "Execute the primary objective", duration: 90 },
    { title: "Review progress and adjust plan", duration: 30 },
  ];
}

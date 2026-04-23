/**
 * Pure AI Wrapper: Low-level transport layer for AI communication.
 * Handles both Electron IPC and Web API routing securely.
 */
export async function callAI(prompt: string, config?: { temperature?: number; model?: string }) {
  const messages = [{ role: "user", content: prompt }];

  // 1. Priority: Electron IPC Proxy (Desktop Security)
  if (typeof window !== "undefined" && (window as any).electron?.invokeAI) {
    try {
      return await (window as any).electron.invokeAI(messages, config);
    } catch (error) {
      console.error("Electron IPC AI call failed:", error);
      throw error;
    }
  }

  // 2. Fallback: Next.js API Route (Web/Dev Mode)
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, config }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "API Route AI request failed");
      }

      return await res.json();
    } catch (error) {
      console.error("API Route AI call failed:", error);
      throw error;
    }
  }

  throw new Error("No secure AI channel available (Running outside supported environments).");
}

/**
 * Generates actionable tasks based on a high-level goal using a structured prompt.
 * Strictly returns JSON and handles validation errors with fallbacks.
 */
export async function generateTasksFromGoal(goalText: string): Promise<{ title: string; duration: number }[]> {
  const prompt = `
    Act as a productivity expert. Break down the following goal into actionable tasks.
    RULES:
    1. Return ONLY a valid JSON array.
    2. NO explanations, no markdown blocks.
    3. Format: [{"title": "task name", "duration": number (minutes)}]
    4. ATOMIC TASKS: NO task should exceed 120 minutes. If a task is longer, break it into "Part 1", "Part 2", etc.
    
    Goal: "${goalText}"
    
    Example:
    Input: "Study Physics (3 hours)"
    Output: [{"title": "Study Physics Part 1", "duration": 90}, {"title": "Study Physics Part 2", "duration": 90}]
  `.trim();

  try {
    const rawResponse = await callAI(prompt);
    
    const content = rawResponse.choices?.[0]?.message?.content || rawResponse;
    const cleanContent = typeof content === "string" 
      ? content.replace(/```json|```/g, "").trim() 
      : content;

    const parsed = typeof cleanContent === "string" ? JSON.parse(cleanContent) : cleanContent;

    if (Array.isArray(parsed)) {
      const finalTasks: { title: string; duration: number }[] = [];

      for (const item of parsed) {
        const duration = Number(item.duration) || 30;
        const title = item.title || "Untitled Action";

        // Safety Split: If AI misses the rule, we enforce it here
        if (duration > 120) {
          const parts = Math.ceil(duration / 90);
          const partDuration = Math.floor(duration / parts);
          for (let i = 1; i <= parts; i++) {
            finalTasks.push({
              title: `${title} (Part ${i})`,
              duration: partDuration
            });
          }
        } else {
          finalTasks.push({ title, duration });
        }
      }
      return finalTasks;
    }
    
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Structured Task Generation failed:", error);
    return [
      { title: `Initial research: ${goalText}`, duration: 45 },
      { title: `Action Phase 1: Core objectives`, duration: 90 },
      { title: `Action Phase 2: Implementation`, duration: 90 },
      { title: `Review and refine progress`, duration: 30 }
    ];
  }
}

/**
 * Parses a natural language command into a structured intent using AI.
 * strictly returns JSON: { "intent": "string", "data": {} }
 */
export async function parseCommand(inputText: string): Promise<{ intent: string; data: any }> {
  const prompt = `
    Analyze this user command for a productivity OS and categorize it.
    INTENTS:
    - create_task: User wants to add an action.
    - create_goal: User wants to start a project/objective.
    - plan_day: User wants to organize their schedule.
    - get_next_task: User wants to know what to do now.
    
    RULES:
    1. Return ONLY a valid JSON object.
    2. Format: {"intent": "string", "data": {}}
    3. NO explanations or markdown.
    
    Examples:
    Input: "Plan my day" -> {"intent": "plan_day", "data": {}}
    Input: "What should I do now?" -> {"intent": "get_next_task", "data": {}}
    
    Command: "${inputText}"
  `.trim();

  try {
    const rawResponse = await callAI(prompt, { temperature: 0.1 });
    
    const content = rawResponse.choices?.[0]?.message?.content || rawResponse;
    const cleanContent = typeof content === "string" 
      ? content.replace(/```json|```/g, "").trim() 
      : content;

    const parsed = typeof cleanContent === "string" ? JSON.parse(cleanContent) : cleanContent;

    return {
      intent: parsed.intent || "unknown",
      data: parsed.data || {}
    };
  } catch (error) {
    console.error("Structured Command Parsing failed:", error);
    return { intent: "unknown", data: {} };
  }
}

/**
 * High-level AI Agent Decision Logic:
 * Analyzes the system context (metrics, tasks, goals) and decides on a proactive action.
 */
export async function getAgentDecision(context: any): Promise<{ action: string; reason: string }> {
  const prompt = `
    Act as an autonomous AI Agent for a productivity OS.
    Analyze the current system state and decide on the best proactive intervention.

    ALLOWED ACTIONS:
    - reprioritize_tasks: If tasks are overdue, missed, or the schedule is inefficient.
    - suggest_break: If completion streak is high or system state is HIGH_STRESS.
    - increase_workload: If system state is PEAK_PERFORMANCE and pending tasks are low.
    - none: If the system state is healthy and balanced.

    CONTEXT:
    ${JSON.stringify(context, null, 2)}

    RULES:
    1. Return ONLY a valid JSON object.
    2. Format: {"action": "string", "reason": "string"}
    3. The reason should be a concise, user-friendly explanation.

    Output:
  `.trim();

  try {
    const rawResponse = await callAI(prompt, { temperature: 0.3 });
    
    const content = rawResponse.choices?.[0]?.message?.content || rawResponse;
    const cleanContent = typeof content === "string" 
      ? content.replace(/```json|```/g, "").trim() 
      : content;

    const parsed = typeof cleanContent === "string" ? JSON.parse(cleanContent) : cleanContent;

    return {
      action: parsed.action || "none",
      reason: parsed.reason || "Maintaining current momentum."
    };
  } catch (error) {
    console.error("AI Agent Decision failed:", error);
    return { action: "none", reason: "Error calculating optimal state." };
  }
}


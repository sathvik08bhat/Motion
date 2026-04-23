import { type Task, type Goal } from "../../data/db";
import { type AgentAction, createAction } from "./types";
import { callAI } from "../../lib/ai";
import { DomainDistribution, ImbalanceReport } from "./domainEngine";

/**
 * Agent Decision Engine: Translates system state into actionable interventions.
 * 
 * Rules:
 * 1. IF tasks missed: → reschedule
 * 2. IF overloaded: → reduce tasks (deprioritize or move)
 * 3. IF free time: → suggest useful task
 * 4. IF goal inactive: → suggest action
 * 5. CONTEXT: Consider time of day (Morning/Deep vs Night/Light) and Domain Balance.
 */
export async function makeDecisions(
  tasks: Task[], 
  goals: Goal[],
  domainStats: DomainDistribution,
  imbalance: ImbalanceReport,
  feedback: any
): Promise<AgentAction[]> {
  const pendingTasks = tasks.filter(t => t.status === "todo");
  const now = new Date();
  const hour = now.getHours();
  
  const timeContext = hour < 12 ? "Morning (High energy - prioritize Deep Work)" : 
                      hour < 17 ? "Afternoon (Steady energy - focus on Execution)" : 
                      hour < 21 ? "Evening (Wind down - focus on Admin/Review)" : 
                      "Night (Rest - avoid heavy cognitive load)";

  const decisionPrompt = `
    You are the Learning-Capable Decision Engine for Motion OS.
    
    ENVIRONMENT:
    - Time: ${now.toLocaleTimeString()} (${timeContext})
    - Domain Balance: ${JSON.stringify(domainStats)}
    - User Feedback Trends: ${JSON.stringify(feedback)} (Adjust your frequency/types based on this!)
    - Imbalance Issues: ${JSON.stringify(imbalance)}
    
    SYSTEM STATE:
    - Pending Tasks: ${JSON.stringify(pendingTasks.map(t => ({ id: t.id, title: t.title, domain: t.domain, scheduledAt: t.scheduledAt, priority: t.priority })))}
    - Active Goals: ${JSON.stringify(goals.map(g => ({ id: g.id, title: g.title })))}

    DECISION RULES:
    1. MISSING: If tasks are in the past, suggest "reschedule".
    2. OVERLOAD: If today's workload is >6 hours, suggest "reduce_load" (moving non-critical to tomorrow).
    3. BALANCE: If a domain is "neglected", suggest a "useful_task" in that domain.
    4. CHRONOTYPE: 
       - MORNING: Favor high-priority, "Work" or "Study" tasks.
       - NIGHT: Suggest light "Personal" tasks, reflection, or planning for tomorrow.
    5. INACTIVE GOAL: If a goal has no tasks, suggest "goal_activation".

    Output ONLY a valid JSON array:
    [
      { "type": "reschedule", "taskId": "id", "newDate": "ISOString", "reason": "reason" },
      { "type": "reduce_load", "taskId": "id", "newDate": "tomorrow ISOString", "reason": "reason" },
      { "type": "suggest_task", "title": "title", "domain": "domain", "reason": "reason" }
    ]
  `;

  try {
    const rawResponse = await callAI(decisionPrompt, { temperature: 0.1 });
    const content = rawResponse.choices?.[0]?.message?.content || rawResponse;
    const cleanContent = typeof content === "string" 
      ? content.replace(/```(json)?|```/g, "").trim() 
      : content;
    
    const recommendations = typeof cleanContent === "string" ? JSON.parse(cleanContent) : cleanContent;
    
    const actions: AgentAction[] = [];
    if (!Array.isArray(recommendations)) return [];

    for (const rec of recommendations) {
      if (rec.type === "reschedule" || rec.type === "reduce_load") {
        actions.push(createAction(
          "schedule_task",
          { id: rec.taskId, scheduledAt: rec.newDate },
          rec.reason
        ));
      } else if (rec.type === "suggest_task" || rec.type === "goal_activation") {
        actions.push(createAction(
          "create_task",
          { 
            title: rec.title, 
            domain: rec.domain || "personal",
            duration: 30,
            priority: "medium" 
          },
          rec.reason
        ));
      }
    }

    return actions;
  } catch (error) {
    console.error("Decision Engine failed:", error);
    return [];
  }
}

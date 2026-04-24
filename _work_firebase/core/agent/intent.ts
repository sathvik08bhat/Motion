import { callAI } from '../../lib/ai';
import { refineTasks, type RawTask } from './refine';
import { LifeDomain } from './domains';

export interface IntentResponse {
  goal: string;
  tasks: RawTask[];
}



export interface IntentContext {
  goals: any[];
  tasks: any[];
}

/**
 * Validates that an IntentResponse is structurally sound and actionable.
 * Throws if the response is empty or invalid.
 */
export function validateIntentResponse(response: IntentResponse): void {
  if (!response.goal || response.goal.trim() === "") {
    throw new Error("Intent Validation Error: Goal title cannot be empty.");
  }
  if (!Array.isArray(response.tasks) || response.tasks.length === 0) {
    throw new Error("Intent Validation Error: Generated roadmap must contain at least one task.");
  }
}


/**
 * Intent Processor: Uses AI to decompose high-level objectives 
 * into a concrete goal and a list of actionable tasks.
 */
export async function processIntent(inputText: string, context?: IntentContext): Promise<IntentResponse> {
  const contextString = context ? `
    User context:
    * Existing goals: ${context.goals.map(g => g.title).join(', ') || 'None'}
    * Current tasks: ${context.tasks.map(t => t.title).join(', ') || 'None'}
  ` : '';

  const prompt = `
    You are a planning system.
    Convert the user's intent into a structured plan.

    ${contextString}

    Rules:

    * Output ONLY valid JSON
    * No explanation text
    * Be specific and actionable
    * Tasks must be realistic and clear
    * Tasks are not generic
    * Tasks are directly actionable
    * Avoid vague terms like 'work on', 'improve'
    * ASSIGN DOMAIN: Every task must have a domain (study, health, work, personal, relationships)
    * ENSURE BALANCE: Prevent single-domain overload. For intense goals (e.g., "Crack exams"), roadmap must be mostly related to the goal but MUST include recovery/health tasks (e.g., "15 min walk").

    Format:
    {
      "goal": "string",
      "tasks": [
        {
          "title": "string",
          "duration": number,
          "priority": "low" | "medium" | "high",
          "domain": "study" | "health" | "work" | "personal" | "relationships"
        }
      ]
    }

    User intent: "${inputText}"
  `.trim();


  try {
    const rawResponse = await callAI(prompt, { temperature: 0.3 });
    
    // Handle different response formats from callAI
    const content = rawResponse.choices?.[0]?.message?.content || rawResponse;
    const cleanContent = typeof content === "string" 
      ? content.replace(/```json|```/g, "").trim() 
      : content;

    const parsed = typeof cleanContent === "string" ? JSON.parse(cleanContent) : cleanContent;

    // Validation
    if (!parsed.goal || !Array.isArray(parsed.tasks)) {
      throw new Error("Invalid schema: Missing goal or tasks array");
    }

    const validatedTasks = parsed.tasks.map((t: any) => ({
      title: String(t.title || "Untitled Action"),
      duration: Number(t.duration) || 30,
      priority: ['low', 'medium', 'high'].includes(t.priority) ? t.priority : 'medium',
      domain: ['study', 'health', 'work', 'personal', 'relationships'].includes(t.domain) ? t.domain : 'personal'
    }));

    return {
      goal: parsed.goal,
      tasks: refineTasks(validatedTasks)
    };

  } catch (error) {
    console.error("❌ Intent Processing Failed:", error);
    
    // Fallback response: Standard 3-phase roadmap
    return {
      goal: `Objective: ${inputText}`,
      tasks: [
        { title: `Define specific success metrics for: ${inputText}`, duration: 30, priority: 'high', domain: 'personal' },
        { title: `Execute primary research and baseline assessment`, duration: 60, priority: 'medium', domain: 'work' },
        { title: `Initial execution phase: Core milestones`, duration: 90, priority: 'high', domain: 'work' },
        { title: `Review first iteration results`, duration: 30, priority: 'medium', domain: 'personal' }
      ]
    };
  }
}


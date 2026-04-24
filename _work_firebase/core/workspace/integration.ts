import { getPage } from "./pages";
import { processIntent } from "../agent/intent";
import { runAgentAction } from "../agent/orchestrator";
import { createAction } from "../agent/types";
import { callAI } from "../../lib/ai";

/**
 * 1. Convert Page to Plan
 * Takes the raw text content of a workspace page and uses the AI Intent Processor
 * to extract actionable goals and tasks, automatically scheduling them via the OS.
 */
export async function convertPageToPlan(pageId: string) {
  const page = await getPage(pageId);
  if (!page) throw new Error("Page not found");

  // Flatten page blocks into a single readable string
  const pageContent = page.blocks.map(b => b.content).join("\n");
  if (!pageContent.trim()) throw new Error("Page is empty");

  // 1. Process intent (AI extracts goal + tasks)
  const intentResponse = await processIntent(`Extract a structured project plan from this document:\n\n${pageContent}`);

  // 2. Create the OS action payload
  const action = createAction(
    "create_goal_with_tasks",
    {
      goal: intentResponse.goal,
      tasks: intentResponse.tasks
    },
    `Converting workspace page "${page.title}" into a structured roadmap.`
  );

  // 3. Send through the Orchestrator pipeline (Interceptor -> Approval -> Execution)
  await runAgentAction(action);
}

/**
 * 2. Highlight → Action
 * Converts user-selected text directly into a trackable OS entity.
 */
export async function handleHighlightAction(text: string, type: "task" | "goal") {
  if (!text.trim()) return;

  if (type === "task") {
    const action = createAction(
      "create_task",
      { title: text, duration: 30 },
      "User manually converted text selection to task."
    );
    await runAgentAction(action);
  } else {
    // For Goals, we might want the AI to instantly propose child tasks, 
    // but for simplicity we'll just process it as a direct intent
    const action = createAction(
      "create_goal_with_tasks",
      { goal: text, tasks: [] }, 
      "User manually converted text selection to goal."
    );
    await runAgentAction(action);
  }
}

/**
 * 3. AI Assistant in Page
 * Allows the user to type commands like "summarize this" directly into the page.
 * The AI reads the page, executes the prompt, and injects the result back into the document.
 */
export async function assistantModifyPage(pageId: string, prompt: string) {
  const page = await getPage(pageId);
  if (!page) throw new Error("Page not found");

  const pageContent = page.blocks.map(b => b.content).join("\n");

  const systemPrompt = `
    You are an AI embedded in a rich text document.
    The user is asking you to modify or respond to the document.
    Document content:
    """
    ${pageContent}
    """

    User command: "${prompt}"

    Return ONLY a raw string containing your response. No markdown wrappers.
  `;

  // 1. Generate response
  const rawResponse = await callAI(systemPrompt.trim(), { temperature: 0.5 });
  const content = rawResponse.choices?.[0]?.message?.content || String(rawResponse);
  const cleanContent = content.replace(/```(json|markdown)?|```/g, "").trim();

  // 2. Safely mutate the page via the Action System
  const action = createAction(
    "modify_page",
    {
      pageId,
      operation: "add_block",
      blockData: {
        type: "text",
        content: `**AI Response:** ${cleanContent}`
      }
    },
    `AI Assistant responding to page prompt: "${prompt}"`
  );

  await runAgentAction(action);
}

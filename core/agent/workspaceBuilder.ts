import { db } from "../../data/db";
import { callAI } from "../../lib/ai";
import type { Page, Block } from "../../data/db";

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

const WORKSPACE_PROMPT = `You are the Motion OS Chief Architect.
The user wants to build a complete productivity system for the following goal/intent: "{intent}"

Design a multi-page workspace tailored to this goal.
You must output a JSON object representing the pages and their blocks.

### Requirements:
1. Detect the category: study, health, productivity, relationships, work/project, or mixed.
2. Break down the goal into a logical structure of pages. (e.g., Overview, Daily Log, Resources)
3. For each page, provide a list of blocks.
4. Block types allowed: "heading", "text", "todo", "toggle", "timeline", "chart", "table", "progress", "stat", "tasklist".
5. For complex components (timeline, chart, progress, stat, tasklist), provide a "props" object.

### Example Props:
- "stat": { value: "65", suffix: "%", icon: "Activity" }
- "progress": { target: "10", unit: "kg" }
- "tasklist": { items: ["Task 1", "Task 2"] }

### Output Format (Strict JSON):
{
  "category": "health",
  "pages": [
    {
      "title": "Health Dashboard",
      "blocks": [
        { "type": "heading", "content": "Overview" },
        { "type": "stat", "content": "", "props": { "value": "Day 1", "icon": "Zap" } },
        { "type": "progress", "content": "", "props": { "target": "100", "unit": "%" } }
      ]
    },
    {
      "title": "Daily Log",
      "blocks": [
        { "type": "heading", "content": "Diet" },
        { "type": "todo", "content": "Drink 2L water" },
        { "type": "todo", "content": "No sugar" }
      ]
    }
  ]
}
`;

export async function generateWorkspaceFromIntent(intent: string): Promise<{ pages: Page[], category: string }> {
  try {
    const response = await callAI(
      WORKSPACE_PROMPT.replace("{intent}", intent),
      { temperature: 0.2 }
    );

    const content = response.choices?.[0]?.message?.content || response;
    const cleanContent = typeof content === "string" 
      ? content.replace(/```(json)?|```/g, "").trim() 
      : content;

    const parsed = typeof cleanContent === "string" ? JSON.parse(cleanContent) : cleanContent;
    
    const createdPages: Page[] = [];
    
    // Convert to DB format and save
    for (const p of parsed.pages) {
      const pageId = `page_${generateId()}`;
      const blocks: Block[] = p.blocks.map((b: any) => ({
        id: `block_${generateId()}`,
        type: b.type,
        content: b.content || "",
        props: b.props,
        checked: false
      }));

      const newPage: Page = {
        id: pageId,
        title: p.title,
        blocks
      };

      await db.pages.put(newPage);
      createdPages.push(newPage);
    }

    return {
      pages: createdPages,
      category: parsed.category || "mixed"
    };

  } catch (error) {
    console.error("Workspace Generation Error:", error);
    throw new Error("Failed to generate workspace.");
  }
}

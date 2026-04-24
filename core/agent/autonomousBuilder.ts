/**
 * Autonomous System Builder for Motion OS.
 * Transforms high-level user vision into a complete structured system of pages, blocks, and databases.
 */

import { callAI } from "../../lib/ai";
import { createPage } from "../workspace/pages";
import { addBlock } from "../workspace/blocks";
import { db } from "../../data/db";

export async function architectSystem(intent: string): Promise<{ pages: string[], summary: string }> {
  console.log(`[AutonomousBuilder] Architecting system for: ${intent}`);
  
  const prompt = `
    You are the Motion OS Master Architect (JARVIS).
    The user wants: "${intent}"
    
    Design a complete structured system inside Motion OS.
    Break it down into multiple nested pages and specialized blocks.
    
    Available Blocks:
    - heading, text, todo, toggle, timeline, chart, table, progress, stat, tasklist
    
    Output a JSON object with:
    {
      "summary": "Brief explanation of what was built",
      "pages": [
        {
          "title": "Page Title",
          "blocks": [
            { "type": "block_type", "content": "content", "props": { ... } }
          ],
          "children": [
            { "title": "Subpage Title", "blocks": [ ... ] }
          ]
        }
      ]
    }
  `;

  try {
    const raw = await callAI(prompt, { temperature: 0.2 });
    const content = raw.choices?.[0]?.message?.content || raw;
    const clean = typeof content === "string" ? content.replace(/```json|```/g, "").trim() : content;
    const structure = JSON.parse(clean);

    const createdPageIds: string[] = [];

    async function buildPage(pageData: any, parentId?: string) {
      const page = await createPage(pageData.title, parentId);
      createdPageIds.push(page.id);

      for (const block of pageData.blocks) {
        await addBlock(page.id, {
          type: block.type,
          content: block.content || "",
          props: block.props,
          checked: false
        });
      }

      if (pageData.children) {
        for (const child of pageData.children) {
          await buildPage(child, page.id);
        }
      }
      
      return page.id;
    }

    for (const page of structure.pages) {
      await buildPage(page);
    }

    return {
      pages: createdPageIds,
      summary: structure.summary
    };

  } catch (err) {
    console.error("[AutonomousBuilder] Failed to architect system:", err);
    throw err;
  }
}

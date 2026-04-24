import type { Page } from "../../data/db";
import { callAI } from "../../lib/ai";
import { createAction } from "../agent/types";
import { runAgentAction } from "../agent/orchestrator";

type ProposedAction =
  | { type: "create_page"; payload: { title: string; parentTitle?: string | null; blocks?: any[] }; reason: string }
  | { type: "update_page"; payload: { pageTitle: string; updates: { title?: string; parentTitle?: string | null } }; reason: string }
  | { type: "delete_page"; payload: { pageTitle: string }; reason: string }
  | { type: "modify_page"; payload: { pageTitle: string; operation: "add_block" | "update_block" | "delete_block"; blockData?: any; blockId?: string }; reason: string };

function normalizeTitle(title: string) {
  return title.trim().toLowerCase();
}

function resolvePageIdByTitle(pages: Page[], title: string): string {
  const t = normalizeTitle(title);
  const matches = pages.filter((p) => normalizeTitle(p.title) === t);
  if (matches.length === 1) return matches[0].id;
  if (matches.length === 0) throw new Error(`No page found with title "${title}".`);
  throw new Error(`Multiple pages match title "${title}". Please rename to make titles unique.`);
}

function serializePageForAI(page: Page) {
  return {
    id: page.id,
    title: page.title,
    parentId: page.parentId ?? null,
    blocks: page.blocks.map((b) => ({
      id: b.id,
      type: b.type,
      content: (b.content || "").slice(0, 200),
      checked: b.checked ?? false,
    })),
  };
}

export async function planAndRunWorkspaceActions(params: {
  instruction: string;
  activePage: Page;
  pages: Page[];
}): Promise<{ planned: number }> {
  const { instruction, activePage, pages } = params;

  const prompt = `
You are MotionOS. Convert the user instruction into a STRICT JSON array of actions to edit the workspace UI.

The user wants the assistant to do anything on the interface, but ONLY through these allowed actions:
- create_page: { title, parentTitle|null (optional), blocks (optional) }
- update_page: { pageTitle, updates: { title?, parentTitle|null? } }
- delete_page: { pageTitle }
- modify_page: { pageTitle, operation: "add_block"|"update_block"|"delete_block", blockData?, blockId? }

Rules:
1) Return ONLY valid JSON. No markdown.
2) Use pageTitle exactly from the provided page list. If you want the active page, use pageTitle = "__ACTIVE__".
3) Prefer modify_page on the active page whenever possible.
4) Keep changes minimal and clean. Use headings + todos when helpful.
5) For modify_page/add_block, blockData must be: { type: "heading"|"text"|"todo", content: string, checked?: boolean }

Active page:
${JSON.stringify(serializePageForAI(activePage), null, 2)}

All pages (titles only):
${JSON.stringify(pages.map((p) => p.title), null, 2)}

User instruction:
${JSON.stringify(instruction)}
`.trim();

  const raw = await callAI(prompt, { temperature: 0.2 });
  const content = raw.choices?.[0]?.message?.content || String(raw);
  const clean = typeof content === "string" ? content.replace(/```(json)?|```/g, "").trim() : content;
  const parsed: ProposedAction[] = typeof clean === "string" ? JSON.parse(clean) : clean;

  if (!Array.isArray(parsed)) throw new Error("AI did not return an array of actions.");

  for (const a of parsed) {
    if (!a || typeof a !== "object") continue;

    if (a.type === "create_page") {
      const parentId =
        a.payload.parentTitle && a.payload.parentTitle !== "__ACTIVE__"
          ? resolvePageIdByTitle(pages, a.payload.parentTitle)
          : undefined;

      const action = createAction(
        "create_page",
        { title: a.payload.title, parentId, blocks: Array.isArray(a.payload.blocks) ? a.payload.blocks : [] },
        a.reason || "Creating a workspace page."
      );
      await runAgentAction(action);
      continue;
    }

    const pageTitle = (a as any).payload?.pageTitle;
    const resolvedTitle = pageTitle === "__ACTIVE__" ? activePage.title : pageTitle;
    const pageId = resolvePageIdByTitle(pages, resolvedTitle);

    if (a.type === "update_page") {
      const updates: any = { ...a.payload.updates };
      if (updates.parentTitle !== undefined) {
        updates.parentId = updates.parentTitle ? resolvePageIdByTitle(pages, updates.parentTitle) : undefined;
        delete updates.parentTitle;
      }
      const action = createAction("update_page", { pageId, updates }, a.reason || "Updating a workspace page.");
      await runAgentAction(action);
      continue;
    }

    if (a.type === "delete_page") {
      const action = createAction("delete_page", { pageId }, a.reason || "Deleting a workspace page.");
      await runAgentAction(action);
      continue;
    }

    if (a.type === "modify_page") {
      const action = createAction(
        "modify_page",
        { pageId, operation: a.payload.operation, blockData: a.payload.blockData, blockId: a.payload.blockId },
        a.reason || "Editing page content."
      );
      await runAgentAction(action);
      continue;
    }
  }

  return { planned: parsed.length };
}


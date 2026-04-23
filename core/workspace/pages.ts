import { db, type Page } from "../../data/db";

/**
 * Generates a unique ID for a new page.
 */
function generatePageId(): string {
  return `page_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Creates a new page.
 * @param title The title of the page.
 * @param parentId Optional ID of the parent page for nesting.
 */
export async function createPage(title: string, parentId?: string): Promise<Page> {
  const newPage: Page = {
    id: generatePageId(),
    title,
    parentId,
    blocks: []
  };
  
  await db.pages.add(newPage);
  return newPage;
}

/**
 * Retrieves a page by its ID.
 */
export async function getPage(id: string): Promise<Page | undefined> {
  return await db.pages.get(id);
}

/**
 * Retrieves all pages in the workspace.
 */
export async function getAllPages(): Promise<Page[]> {
  return await db.pages.toArray();
}

/**
 * Retrieves all top-level pages (pages without a parent).
 */
export async function getRootPages(): Promise<Page[]> {
  const pages = await getAllPages();
  return pages.filter(p => !p.parentId);
}

/**
 * Retrieves the child pages of a specific parent page.
 */
export async function getChildPages(parentId: string): Promise<Page[]> {
  return await db.pages.where("parentId").equals(parentId).toArray();
}

/**
 * Updates a page's metadata (e.g., title).
 * To update blocks, use the blocks.ts module.
 */
export async function updatePageMetadata(id: string, updates: Partial<Pick<Page, "title" | "parentId">>): Promise<void> {
  await (db.pages as any).update(id, updates);
}

/**
 * Recursively deletes a page and all of its nested child pages.
 */
export async function deletePage(id: string): Promise<void> {
  const children = await getChildPages(id);
  for (const child of children) {
    await deletePage(child.id); // Recursive deletion
  }
  await db.pages.delete(id);
}

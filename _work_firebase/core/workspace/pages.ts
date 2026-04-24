import { type Page } from "../../data/db";
import { getFirestoreDb } from "../../lib/firebase/client";
import { getUidOrThrow } from "../../lib/firebase/session";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

/**
 * Generates a unique ID for a new page.
 */
function generatePageId(): string {
  return `page_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function pagesCollection() {
  const uid = getUidOrThrow();
  return collection(getFirestoreDb(), "users", uid, "pages");
}

function pageDoc(pageId: string) {
  const uid = getUidOrThrow();
  return doc(getFirestoreDb(), "users", uid, "pages", pageId);
}

/**
 * Creates a new page.
 * @param title The title of the page.
 * @param parentId Optional ID of the parent page for nesting.
 * @param blocks Optional initial blocks.
 */
export async function createPage(title: string, parentId?: string, blocks: Page["blocks"] = []): Promise<Page> {
  const newPage: Page = {
    id: generatePageId(),
    title,
    parentId,
    blocks
  };
  
  await setDoc(pageDoc(newPage.id), {
    title: newPage.title,
    parentId: newPage.parentId ?? null,
    blocks: newPage.blocks,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return newPage;
}

/**
 * Retrieves a page by its ID.
 */
export async function getPage(id: string): Promise<Page | undefined> {
  const snap = await getDoc(pageDoc(id));
  if (!snap.exists()) return undefined;
  const data = snap.data() as any;
  return {
    id: snap.id,
    title: data.title ?? "Untitled",
    parentId: data.parentId ?? undefined,
    blocks: Array.isArray(data.blocks) ? data.blocks : [],
  };
}

/**
 * Retrieves all pages in the workspace.
 */
export async function getAllPages(): Promise<Page[]> {
  const snaps = await getDocs(pagesCollection());
  const pages: Page[] = [];
  snaps.forEach((s) => {
    const d = s.data() as any;
    pages.push({
      id: s.id,
      title: d.title ?? "Untitled",
      parentId: d.parentId ?? undefined,
      blocks: Array.isArray(d.blocks) ? d.blocks : [],
    });
  });
  return pages;
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
  const q = query(pagesCollection(), where("parentId", "==", parentId));
  const snaps = await getDocs(q);
  const pages: Page[] = [];
  snaps.forEach((s) => {
    const d = s.data() as any;
    pages.push({
      id: s.id,
      title: d.title ?? "Untitled",
      parentId: d.parentId ?? undefined,
      blocks: Array.isArray(d.blocks) ? d.blocks : [],
    });
  });
  return pages;
}

/**
 * Updates a page's metadata (e.g., title).
 * To update blocks, use the blocks.ts module.
 */
export async function updatePageMetadata(id: string, updates: Partial<Pick<Page, "title" | "parentId">>): Promise<void> {
  const payload: Record<string, any> = { updatedAt: serverTimestamp() };
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.parentId !== undefined) payload.parentId = updates.parentId ?? null;
  await updateDoc(pageDoc(id), payload);
}

export async function savePage(page: Page): Promise<void> {
  await setDoc(
    pageDoc(page.id),
    {
      title: page.title,
      parentId: page.parentId ?? null,
      blocks: page.blocks,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Recursively deletes a page and all of its nested child pages.
 */
export async function deletePage(id: string): Promise<void> {
  const children = await getChildPages(id);
  for (const child of children) {
    await deletePage(child.id); // Recursive deletion
  }
  await deleteDoc(pageDoc(id));
}

import { type Block, type Page } from "../../data/db";
import { getPage } from "./pages";
import { savePage } from "./pages";

/**
 * Generates a unique ID for a new block.
 */
function generateBlockId(): string {
  return `block_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Traverses a block tree to find a specific block and its parent array.
 * Returns the array containing the block, and the block's index within it.
 */
function findBlockContext(blocks: Block[], id: string): { parentArray: Block[]; index: number } | null {
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].id === id) {
      return { parentArray: blocks, index: i };
    }
    if (blocks[i].children) {
      const result = findBlockContext(blocks[i].children!, id);
      if (result) return result;
    }
  }
  return null;
}

/**
 * Adds a new block to a page.
 * @param pageId The ID of the page.
 * @param blockData The initial data for the block.
 * @param parentBlockId (Optional) The ID of the parent block (e.g., a toggle block) to nest inside.
 * @param index (Optional) The index at which to insert. Defaults to the end.
 */
export async function addBlock(
  pageId: string, 
  blockData: Omit<Block, "id" | "children">, 
  parentBlockId?: string,
  index?: number
): Promise<Block> {
  const page = await getPage(pageId);
  if (!page) throw new Error("Page not found");

  const newBlock: Block = {
    ...blockData,
    id: generateBlockId()
  };

  if (parentBlockId) {
    const context = findBlockContext(page.blocks, parentBlockId);
    if (!context) throw new Error("Parent block not found");
    const parentBlock = context.parentArray[context.index];
    
    if (!parentBlock.children) parentBlock.children = [];
    
    if (index !== undefined) {
      parentBlock.children.splice(index, 0, newBlock);
    } else {
      parentBlock.children.push(newBlock);
    }
  } else {
    if (index !== undefined) {
      page.blocks.splice(index, 0, newBlock);
    } else {
      page.blocks.push(newBlock);
    }
  }

  await savePage(page);
  return newBlock;
}

/**
 * Updates an existing block's content or properties.
 */
export async function updateBlock(pageId: string, blockId: string, updates: Partial<Omit<Block, "id" | "children">>): Promise<void> {
  const page = await getPage(pageId);
  if (!page) throw new Error("Page not found");

  const context = findBlockContext(page.blocks, blockId);
  if (!context) throw new Error("Block not found");

  const block = context.parentArray[context.index];
  context.parentArray[context.index] = { ...block, ...updates };

  await savePage(page);
}

/**
 * Deletes a block from a page.
 */
export async function deleteBlock(pageId: string, blockId: string): Promise<void> {
  const page = await getPage(pageId);
  if (!page) throw new Error("Page not found");

  const context = findBlockContext(page.blocks, blockId);
  if (!context) throw new Error("Block not found");

  context.parentArray.splice(context.index, 1);

  await savePage(page);
}

/**
 * Moves a block to a new position, potentially changing its parent.
 */
export async function moveBlock(
  pageId: string, 
  blockId: string, 
  newParentBlockId?: string, 
  newIndex?: number
): Promise<void> {
  const page = await getPage(pageId);
  if (!page) throw new Error("Page not found");

  // 1. Find and remove the block from its current location
  const sourceContext = findBlockContext(page.blocks, blockId);
  if (!sourceContext) throw new Error("Source block not found");
  
  const [blockToMove] = sourceContext.parentArray.splice(sourceContext.index, 1);

  // 2. Insert into the new location
  let targetArray: Block[];
  
  if (newParentBlockId) {
    const targetContext = findBlockContext(page.blocks, newParentBlockId);
    if (!targetContext) throw new Error("Target parent block not found");
    const parentBlock = targetContext.parentArray[targetContext.index];
    if (!parentBlock.children) parentBlock.children = [];
    targetArray = parentBlock.children;
  } else {
    targetArray = page.blocks;
  }

  if (newIndex !== undefined && newIndex <= targetArray.length) {
    targetArray.splice(newIndex, 0, blockToMove);
  } else {
    targetArray.push(blockToMove);
  }

  await savePage(page);
}

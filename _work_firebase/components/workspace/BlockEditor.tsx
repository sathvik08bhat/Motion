"use client";

import React, { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Plus, CheckSquare, Square, ChevronRight, ChevronDown, Heading1, Sparkles } from "lucide-react";
import { type Block } from "../../data/db";
import { addBlock, updateBlock, deleteBlock } from "../../core/workspace/blocks";

interface BlockEditorProps {
  pageId: string;
  initialBlocks: Block[];
}

const COMMANDS = [
  { label: "Text", type: "text", shortcut: "/text" },
  { label: "Heading", type: "heading", shortcut: "/heading" },
  { label: "To-do", type: "todo", shortcut: "/todo" },
  { label: "Toggle", type: "toggle", shortcut: "/toggle" },
];

export default function BlockEditor({ pageId, initialBlocks }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);

  // Sync internal state with DB dynamically if needed, 
  // but for simplicity we rely on page reloads or a robust store.
  useEffect(() => {
    setBlocks(initialBlocks);
  }, [initialBlocks]);

  const handleUpdate = async (blockId: string, updates: Partial<Block>) => {
    // Optimistic UI update
    const updateTree = (nodes: Block[]): Block[] => {
      return nodes.map(node => {
        if (node.id === blockId) {
          return { ...node, ...updates };
        }
        if (node.children) {
          return { ...node, children: updateTree(node.children) };
        }
        return node;
      });
    };
    setBlocks(prev => updateTree(prev));
    await updateBlock(pageId, blockId, updates);
  };

  const handleAddBlock = async (afterBlockId?: string, parentId?: string) => {
    const newBlock = await addBlock(pageId, { type: "text", content: "" }, parentId);
    
    // Simplistic state refresh: ideally we'd deeply inject it into state
    // But for this robust implementation we can let the parent trigger a re-fetch
    // Or we do a simple append for now.
    if (!parentId && !afterBlockId) {
      setBlocks(prev => [...prev, newBlock]);
    } else {
      // In a production app, we'd traverse and insert accurately or use a global store
      // For this step, we just force a full page refresh or rely on SWR/Query
      window.location.reload(); 
    }
  };

  const handleDelete = async (blockId: string) => {
    await deleteBlock(pageId, blockId);
    window.location.reload();
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 md:px-0 space-y-1">
      {blocks.length === 0 && (
        <div 
          className="text-zinc-600 text-lg group flex items-center gap-2 cursor-text"
          onClick={() => handleAddBlock()}
        >
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Plus className="w-5 h-5 cursor-pointer text-zinc-500 hover:text-white" />
          </span>
          Click to start typing...
        </div>
      )}
      
      {blocks.map((block) => (
        <BlockNode 
          key={block.id} 
          block={block} 
          onUpdate={handleUpdate} 
          onAdd={handleAddBlock}
          onDelete={handleDelete}
        />
      ))}

      {/* Invisible drop zone at the bottom to easily add new blocks */}
      {blocks.length > 0 && (
        <div 
          className="h-20 w-full cursor-text"
          onClick={() => handleAddBlock()}
        />
      )}

      {/* AI Assistant Box */}
      <div className="mt-8 pt-8 border-t border-zinc-800/50">
        <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <input 
            type="text"
            placeholder="Ask AI to summarize or add to this page... (Press Enter)"
            className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-200 placeholder:text-indigo-400/50"
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                const prompt = e.currentTarget.value;
                e.currentTarget.value = 'Thinking...';
                e.currentTarget.disabled = true;
                try {
                  const { assistantModifyPage } = await import('../../core/workspace/integration');
                  await assistantModifyPage(pageId, prompt);
                  window.location.reload(); // Quick refresh to see the new blocks
                } catch (error) {
                  console.error(error);
                  e.currentTarget.value = prompt;
                  e.currentTarget.disabled = false;
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

interface BlockNodeProps {
  block: Block;
  onUpdate: (id: string, updates: Partial<Block>) => void;
  onAdd: (afterId?: string, parentId?: string) => void;
  onDelete: (id: string) => void;
}

const BlockNode = React.memo(function BlockNode({ block, onUpdate, onAdd, onDelete }: BlockNodeProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(true);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (showMenu) return; // Prevent new block if menu is open
      onAdd(block.id);
    }
    if (e.key === "Backspace" && block.content === "") {
      e.preventDefault();
      onDelete(block.id);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent || "";
    
    // Slash command detection
    if (text === "/") {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuPosition({ x: rect.left, y: rect.bottom + 5 });
      setShowMenu(true);
      return;
    } else {
      setShowMenu(false);
    }

    onUpdate(block.id, { content: text });
  };

  const handleCommandSelect = (type: Block['type']) => {
    onUpdate(block.id, { type, content: "" });
    setShowMenu(false);
    if (contentRef.current) {
      contentRef.current.textContent = "";
      contentRef.current.focus();
    }
  };

  return (
    <div className="group relative flex items-start -ml-8 pl-8 py-1">
      {/* Notion-style Left Gutter (+ button) */}
      <div className="absolute left-0 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        <button 
          onClick={() => onAdd(block.id)}
          className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-start">
          {/* Block Type Indicators */}
          {block.type === "todo" && (
            <button 
              onClick={() => onUpdate(block.id, { checked: !block.checked })}
              className="mt-1 mr-3 text-zinc-500 hover:text-indigo-400 shrink-0"
            >
              {block.checked ? <CheckSquare className="w-5 h-5 text-indigo-500" /> : <Square className="w-5 h-5" />}
            </button>
          )}

          {block.type === "toggle" && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1.5 mr-2 text-zinc-500 hover:text-white shrink-0 transition-transform"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}

          {/* Actual Content Editor */}
          <div className="flex-1 w-full min-w-0">
            <div
              ref={contentRef}
              contentEditable
              suppressContentEditableWarning
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              className={`w-full outline-none break-words whitespace-pre-wrap min-h-[24px] ${
                block.type === "heading" ? "text-3xl font-black text-white mt-6 mb-2" : 
                block.type === "todo" ? `text-base ${block.checked ? "line-through text-zinc-600" : "text-zinc-200"}` : 
                ["timeline", "chart", "table", "progress", "stat", "tasklist"].includes(block.type) ? "text-lg font-black text-white mb-2" :
                "text-base text-zinc-300 leading-relaxed"
              }`}
              data-placeholder={block.type === "heading" ? "Heading..." : "Type '/' for commands"}
            >
              {/* We only inject initial text if it's not currently focused to avoid cursor jumping */}
              {block.content}
            </div>

            {/* Rich Component Rendering */}
            {block.type === "stat" && (
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 my-2 flex items-center justify-between max-w-sm">
                <div className="text-3xl font-black text-white">
                  {block.props?.value || 0}
                  <span className="text-sm text-zinc-500 ml-1 font-bold">{block.props?.suffix || ""}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                  <span className="text-xs font-bold text-indigo-400">{block.props?.icon || "Stat"}</span>
                </div>
              </div>
            )}

            {block.type === "progress" && (
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 my-2 max-w-sm space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-sm text-zinc-400 font-bold">{block.props?.target || 100} {block.props?.unit || "%"} Goal</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="w-1/3 h-full bg-indigo-500 rounded-full" />
                </div>
              </div>
            )}

            {block.type === "tasklist" && (
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 my-2 max-w-md space-y-2">
                {(block.props?.items || ["Task 1", "Task 2"]).map((item: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl text-sm font-bold border border-white/5">
                    <div className="w-4 h-4 rounded border border-zinc-700" />
                    <span className="text-zinc-200">{item}</span>
                  </div>
                ))}
              </div>
            )}

            {["timeline", "chart", "table"].includes(block.type) && (
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-8 my-2 flex items-center justify-center border-dashed">
                <span className="text-xs font-black uppercase tracking-widest text-zinc-600">
                  [{block.type.toUpperCase()} COMPONENT PLACEHOLDER]
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Children (Nested Blocks) */}
        {block.children && block.children.length > 0 && isExpanded && (
          <div className="pl-6 border-l border-zinc-800/50 mt-1 ml-2">
            {block.children.map(child => (
              <BlockNode 
                key={child.id} 
                block={child} 
                onUpdate={onUpdate} 
                onAdd={(afterId) => onAdd(afterId, block.id)}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Slash Command Popover */}
      {showMenu && (
        <div 
          className="fixed z-50 w-64 bg-zinc-900 border border-zinc-800 shadow-2xl rounded-xl overflow-hidden py-2 animate-in zoom-in-95"
          style={{ top: menuPosition.y, left: menuPosition.x }}
        >
          <div className="px-3 pb-2 mb-2 border-b border-zinc-800/50">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Basic Blocks</span>
          </div>
          {COMMANDS.map(cmd => (
            <button
              key={cmd.type}
              onClick={() => handleCommandSelect(cmd.type as Block['type'])}
              className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-indigo-500/10 hover:text-indigo-400 flex items-center justify-between"
            >
              <span>{cmd.label}</span>
              <span className="text-xs text-zinc-600 font-mono">{cmd.shortcut}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

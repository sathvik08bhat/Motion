"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileText, Plus, Search, Trash2, Sparkles, Loader2,
  ListTodo, BookOpen, MoreHorizontal, ChevronRight, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn, slideUp, staggerContainer, buttonHover } from "../../lib/animations";
import { type Page } from "../../data/db";
import { createPage, getAllPages, deletePage, getPage } from "../../core/workspace/pages";
import BlockEditor from "../../components/workspace/BlockEditor";
import { convertPageToPlan, assistantModifyPage } from "../../core/workspace/integration";
import { callAI } from "../../lib/ai";
import { addBlock } from "../../core/workspace/blocks";
import { planAndRunWorkspaceActions } from "../../core/workspace/assistantActions";

function ThinkingHubContent() {
  const searchParams = useSearchParams();
  const initialPageId = searchParams.get("pageId");
  
  const [pages, setPages] = useState<Page[]>([]);
  const [activePage, setActivePage] = useState<Page | null>(null);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiCommand, setAiCommand] = useState("");
  const [showMenu, setShowMenu] = useState<string | null>(null);

  // Load pages
  const loadPages = useCallback(async () => {
    const all = await getAllPages();
    setPages(all);
    
    // Auto-open page from URL if present
    if (initialPageId && !activePage) {
      const page = all.find(p => p.id === initialPageId);
      if (page) setActivePage(page);
    }
  }, [initialPageId, activePage]);

  useEffect(() => { loadPages(); }, [loadPages]);

  // Create page
  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const page = await createPage(newTitle.trim());
    setNewTitle("");
    setIsCreating(false);
    await loadPages();
    setActivePage(page);
  };

  // Delete page
  const handleDelete = async (id: string) => {
    await deletePage(id);
    if (activePage?.id === id) setActivePage(null);
    setShowMenu(null);
    await loadPages();
  };

  // Open page
  const handleOpen = async (pageId: string) => {
    const page = await getPage(pageId);
    if (page) setActivePage(page);
    setAiResult(null);
  };

  // Refresh active page
  const refreshActive = async () => {
    if (!activePage) return;
    const page = await getPage(activePage.id);
    if (page) setActivePage(page);
  };

  // AI: Convert to Plan
  const handleConvertToPlan = async () => {
    if (!activePage) return;
    setAiLoading("plan");
    setAiResult(null);
    try {
      await convertPageToPlan(activePage.id);
      setAiResult("Goal and tasks created from your notes.");
    } catch (e: any) {
      setAiResult(e.message || "Failed to convert.");
    } finally { setAiLoading(null); }
  };

  // AI: Summarize
  const handleSummarize = async () => {
    if (!activePage) return;
    setAiLoading("summarize");
    setAiResult(null);
    try {
      const content = activePage.blocks.map(b => b.content).join("\n");
      if (!content.trim()) { setAiResult("Page is empty."); setAiLoading(null); return; }
      const prompt = `Summarize the following notes into a concise, well-structured summary. Use bullet points.\n\n${content}`;
      const raw = await callAI(prompt, { temperature: 0.3 });
      const text = raw.choices?.[0]?.message?.content || String(raw);
      const clean = text.replace(/```(json|markdown)?|```/g, "").trim();
      // Add as a block
      await addBlock(activePage.id, { type: "text", content: `📋 **Summary:**\n${clean}` });
      await refreshActive();
      setAiResult("Summary added to your page.");
    } catch (e: any) {
      setAiResult(e.message || "Failed to summarize.");
    } finally { setAiLoading(null); }
  };

  // AI: Generate Tasks
  const handleGenerateTasks = async () => {
    if (!activePage) return;
    setAiLoading("tasks");
    setAiResult(null);
    try {
      const content = activePage.blocks.map(b => b.content).join("\n");
      if (!content.trim()) { setAiResult("Page is empty."); setAiLoading(null); return; }
      const prompt = `Extract actionable to-do items from these notes. Return each task as a single line starting with "- ".\n\n${content}`;
      const raw = await callAI(prompt, { temperature: 0.3 });
      const text = raw.choices?.[0]?.message?.content || String(raw);
      const lines = text.split("\n").filter((l: string) => l.trim().startsWith("- "));
      for (const line of lines) {
        const taskText = line.replace(/^-\s*/, "").trim();
        if (taskText) {
          await addBlock(activePage.id, { type: "todo", content: taskText, checked: false });
        }
      }
      await refreshActive();
      setAiResult(`${lines.length} tasks extracted and added.`);
    } catch (e: any) {
      setAiResult(e.message || "Failed to generate tasks.");
    } finally { setAiLoading(null); }
  };

  // AI: Anything on the interface (workspace/page edits)
  const handleAIAssist = async () => {
    if (!activePage) return;
    if (!aiCommand.trim()) return;
    setAiLoading("assist");
    setAiResult(null);
    try {
      const allPages = await getAllPages();
      const { planned } = await planAndRunWorkspaceActions({
        instruction: aiCommand,
        activePage,
        pages: allPages,
      });
      await refreshActive();
      setAiResult(`Planned ${planned} action(s). Check suggestions to apply, or enable full-auto.`);
      setAiCommand("");
    } catch (e: any) {
      setAiResult(e?.message || "Failed to run assistant actions.");
    } finally {
      setAiLoading(null);
    }
  };

  const filtered = pages.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="flex h-full">
      {/* Sidebar: Page List */}
      <motion.aside variants={fadeIn}
        className="w-72 flex-shrink-0 border-r flex flex-col h-full overflow-hidden"
        style={{ background: "var(--bg-secondary)", borderColor: "var(--border-default)" }}>

        {/* Header */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <BookOpen className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
              Pages
            </h2>
            <motion.button {...buttonHover} onClick={() => setIsCreating(true)}
              className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--accent-primary)", background: "var(--accent-primary-light)" }}>
              <Plus className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input type="text" placeholder="Search pages..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg" style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }} />
          </div>
        </div>

        {/* New Page Form */}
        <AnimatePresence>
          {isCreating && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="px-4 pb-3 overflow-hidden">
              <div className="p-3 rounded-xl space-y-2" style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                <input autoFocus type="text" placeholder="Page title..." value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setIsCreating(false); }}
                  className="w-full px-2 py-1.5 text-xs rounded-lg bg-transparent border-none outline-none" style={{ color: "var(--text-primary)" }} />
                <div className="flex gap-2">
                  <button onClick={handleCreate} className="btn-primary text-[10px] px-3 py-1">Create</button>
                  <button onClick={() => setIsCreating(false)} className="btn-ghost text-[10px] px-3 py-1">Cancel</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <FileText className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {search ? "No pages match your search." : "No pages yet. Create one!"}
              </p>
            </div>
          ) : (
            filtered.map((page, i) => (
              <motion.div key={page.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                className="relative group">
                <button onClick={() => handleOpen(page.id)}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-xs font-medium"
                  style={{
                    background: activePage?.id === page.id ? "var(--bg-card)" : "transparent",
                    color: activePage?.id === page.id ? "var(--accent-primary)" : "var(--text-secondary)",
                    boxShadow: activePage?.id === page.id ? "var(--shadow-sm)" : "none",
                    border: activePage?.id === page.id ? "1px solid var(--border-default)" : "1px solid transparent",
                  }}>
                  <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate flex-1">{page.title}</span>
                  <span className="text-[9px] font-normal" style={{ color: "var(--text-muted)" }}>
                    {page.blocks.length}
                  </span>
                </button>

                {/* Context menu trigger */}
                <button onClick={(e) => { e.stopPropagation(); setShowMenu(showMenu === page.id ? null : page.id); }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--text-muted)" }}>
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>

                {showMenu === page.id && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-xl overflow-hidden"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-lg)" }}>
                    <button onClick={() => handleDelete(page.id)}
                      className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors"
                      style={{ color: "#ef4444" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-secondary)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activePage ? (
          <>
            {/* Page Header + AI Actions */}
            <motion.div variants={fadeIn}
              className="px-6 md:px-10 pt-6 pb-4 border-b flex flex-wrap items-center gap-3"
              style={{ borderColor: "var(--border-default)" }}>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "var(--accent-primary)" }}>
                  Thinking Hub
                </p>
                <h1 className="text-2xl font-black tracking-tight truncate" style={{ color: "var(--text-primary)" }}>
                  {activePage.title}
                </h1>
                <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                  {activePage.blocks.length} blocks
                </p>
              </div>

              {/* AI Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <motion.button {...buttonHover} onClick={handleConvertToPlan} disabled={!!aiLoading}
                  className="btn-ghost text-[11px] gap-1.5">
                  {aiLoading === "plan" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  Convert to Plan
                </motion.button>
                <motion.button {...buttonHover} onClick={handleSummarize} disabled={!!aiLoading}
                  className="btn-ghost text-[11px] gap-1.5">
                  {aiLoading === "summarize" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Summarize
                </motion.button>
                <motion.button {...buttonHover} onClick={handleGenerateTasks} disabled={!!aiLoading}
                  className="btn-primary text-[11px] gap-1.5">
                  {aiLoading === "tasks" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ListTodo className="w-3.5 h-3.5" />}
                  Generate Tasks
                </motion.button>
              </div>
            </motion.div>

            {/* Ask Motion (Interface Control) */}
            <div className="mx-6 md:mx-10 mt-4">
              <div className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <input
                  value={aiCommand}
                  onChange={(e) => setAiCommand(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAIAssist();
                    }
                  }}
                  placeholder='Tell Motion what to do on this interface... (e.g. "Create a Study page with todos", "Add a section for resources")'
                  className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-zinc-600"
                  disabled={!!aiLoading}
                />
                <motion.button
                  {...buttonHover}
                  onClick={handleAIAssist}
                  disabled={!!aiLoading || !aiCommand.trim()}
                  className="btn-primary text-[11px] gap-1.5 !px-3 !py-2"
                >
                  {aiLoading === "assist" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  Run
                </motion.button>
              </div>
              <p className="mt-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                Actions show up as suggestions unless full-auto is enabled.
              </p>
            </div>

            {/* AI Result Banner */}
            <AnimatePresence>
              {aiResult && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <div className="mx-6 md:mx-10 mt-3 px-4 py-2.5 rounded-xl flex items-center gap-2"
                    style={{ background: "var(--accent-primary-light)", border: "1px solid var(--accent-primary-ring)" }}>
                    <Sparkles className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--accent-primary)" }} />
                    <p className="text-xs font-medium flex-1" style={{ color: "var(--accent-primary)" }}>{aiResult}</p>
                    <button onClick={() => setAiResult(null)} className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>✕</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Block Editor */}
            <div className="flex-1 overflow-y-auto px-6 md:px-10">
              <BlockEditor pageId={activePage.id} initialBlocks={activePage.blocks} />
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center">
            <motion.div variants={fadeIn} className="text-center space-y-4 max-w-sm">
              <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
                style={{ background: "var(--accent-primary-light)" }}>
                <BookOpen className="w-8 h-8" style={{ color: "var(--accent-primary)" }} />
              </div>
              <div>
                <h2 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>Thinking Hub</h2>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                  Your space for notes, ideas, and plans. Select a page or create a new one to get started.
                </p>
              </div>
              <motion.button {...buttonHover} onClick={() => setIsCreating(true)} className="btn-primary mx-auto gap-2">
                <Plus className="w-4 h-4" /> New Page
              </motion.button>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ThinkingHubPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    }>
      <ThinkingHubContent />
    </Suspense>
  );
}

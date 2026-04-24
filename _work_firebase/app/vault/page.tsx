"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Lock, KeyRound, Shield, FileText, Plus, Trash2, X, Eye, EyeOff, Save, Loader2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn, slideUp, staggerContainer, buttonHover } from "../../lib/animations";

import {
  getVaultSalt, setVaultSalt, addVaultItem, updateVaultItem, deleteVaultItem, getAllVaultItems, type EncryptedVaultItem
} from "../../data/vault-db";

import { generateSalt, deriveKey, encryptData, decryptData } from "../../lib/crypto";

// In-memory key storage (lost on reload, intentionally highly secure)
let IN_MEMORY_VAULT_KEY: CryptoKey | null = null;

type ItemType = "note" | "password" | "file";

export default function VaultPage() {
  const [isSetup, setIsSetup] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [items, setItems] = useState<EncryptedVaultItem[]>([]);
  const [decryptedContents, setDecryptedContents] = useState<Record<number, string>>({});
  
  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [editType, setEditType] = useState<ItemType>("note");
  const [editTitle, setEditTitle] = useState("");
  const [editPayload, setEditPayload] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  // Check initialization
  useEffect(() => {
    (async () => {
      const salt = await getVaultSalt();
      if (!salt) {
        setIsSetup(true); // First time
      }
      if (IN_MEMORY_VAULT_KEY) {
        setIsUnlocked(true);
        await loadItems();
      }
      setLoading(false);
    })();
  }, []);

  const loadItems = async () => {
    const all = await getAllVaultItems();
    setItems(all);
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (passwordInput !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const newSalt = generateSalt();
      const key = await deriveKey(passwordInput, newSalt);
      await setVaultSalt(newSalt);
      IN_MEMORY_VAULT_KEY = key;
      setIsSetup(false);
      setIsUnlocked(true);
      setPasswordInput("");
      setConfirmPassword("");
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to setup vault.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const salt = await getVaultSalt();
      if (!salt) throw new Error("Vault is not initialized.");

      const key = await deriveKey(passwordInput, salt);
      
      // Verify key by checking if we can decrypt something? 
      // If vault is empty, we just assume it's right. If not, we decrypt the first item to verify.
      const all = await getAllVaultItems();
      if (all.length > 0) {
        try {
          await decryptData(key, all[0].iv, all[0].ciphertext);
        } catch (decryptErr) {
          throw new Error("Incorrect password.");
        }
      }

      IN_MEMORY_VAULT_KEY = key;
      setIsUnlocked(true);
      setPasswordInput("");
      setItems(all);
    } catch (err: any) {
      setError(err.message || "Unlock failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleLock = () => {
    IN_MEMORY_VAULT_KEY = null;
    setIsUnlocked(false);
    setItems([]);
    setDecryptedContents({});
  };

  const handleSaveItem = async () => {
    if (!IN_MEMORY_VAULT_KEY) return;
    if (!editTitle.trim() || !editPayload.trim()) return;

    setLoading(true);
    try {
      const { iv, ciphertext } = await encryptData(IN_MEMORY_VAULT_KEY, editPayload);
      
      if (editingId) {
        await updateVaultItem(editingId, {
          title: editTitle,
          type: editType,
          iv,
          ciphertext,
          updatedAt: Date.now()
        });
      } else {
        await addVaultItem({
          title: editTitle,
          type: editType,
          iv,
          ciphertext,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
      
      await loadItems();
      closeEditor();
    } catch (err) {
      console.error(err);
      setError("Failed to encrypt/save data.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: number) => {
    await deleteVaultItem(id);
    setDecryptedContents(prev => {
      const p = { ...prev };
      delete p[id];
      return p;
    });
    await loadItems();
  };

  const handleViewItem = async (item: EncryptedVaultItem) => {
    if (!IN_MEMORY_VAULT_KEY || !item.id) return;

    if (decryptedContents[item.id]) {
      // Toggle off
      setDecryptedContents(prev => {
        const p = { ...prev };
        delete p[item.id!];
        return p;
      });
      return;
    }

    try {
      const plaintext = await decryptData(IN_MEMORY_VAULT_KEY, item.iv, item.ciphertext);
      setDecryptedContents(prev => ({ ...prev, [item.id!]: plaintext }));
    } catch (err) {
      console.error("Failed to decrypt:", err);
      alert("Failed to decrypt item. Authentication may have expired.");
    }
  };

  const openEditor = (type: ItemType, item?: EncryptedVaultItem) => {
    setEditType(type);
    setError("");
    if (item && item.id) {
      setEditingId(item.id);
      setEditTitle(item.title);
      // Fetch decrypted content if we have it, else decrypt
      const txt = decryptedContents[item.id];
      if (txt) {
        setEditPayload(txt);
        setIsEditing(true);
      } else {
        // Quick decrypt to edit
        if (IN_MEMORY_VAULT_KEY) {
          decryptData(IN_MEMORY_VAULT_KEY, item.iv, item.ciphertext).then(t => {
            setEditPayload(t);
            setIsEditing(true);
          });
        }
      }
    } else {
      setEditingId(null);
      setEditTitle("");
      setEditPayload("");
      setIsEditing(true);
    }
  };

  const closeEditor = () => {
    setIsEditing(false);
    setEditTitle("");
    setEditPayload("");
    setEditingId(null);
  };

  if (loading && !isUnlocked && !isSetup) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  // --- Auth & Setup Views ---
  if (!isUnlocked) {
    return (
      <div className="flex h-full items-center justify-center p-6 bg-[var(--bg-primary)]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
          className="w-full max-w-sm card p-8 space-y-6 text-center shadow-2xl border border-zinc-800">
          
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-indigo-500/10 mb-4">
            <Lock className="w-8 h-8 text-indigo-500" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-[var(--text-primary)]">Motion Vault</h1>
            <p className="text-sm text-[var(--text-muted)] mt-2">
              {isSetup ? "Create a master password." : "Enter your master password."}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1 opacity-70">
              End-to-end encrypted (AES-256-GCM). Cannot be accessed by AI.
            </p>
          </div>

          <form onSubmit={isSetup ? handleSetup : handleUnlock} className="space-y-4">
            <input 
              type="password" 
              placeholder="Master Password" 
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-sm outline-none focus:border-indigo-500"
              autoFocus
            />
            {isSetup && (
              <input 
                type="password" 
                placeholder="Confirm Password" 
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-sm outline-none focus:border-indigo-500"
              />
            )}
            
            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              {isSetup ? "Initialize Vault" : "Unlock Vault"}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // --- Main Vault View ---
  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 h-full flex flex-col relative">
      
      {/* Header */}
      <motion.header variants={fadeIn} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-indigo-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Secure Storage</p>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--text-primary)]">The Vault</h1>
          <p className="text-sm text-[var(--text-muted)]">Encrypted securely on your device.</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => openEditor("password")} className="btn-ghost text-xs">
            <KeyRound className="w-3.5 h-3.5" /> Add Password
          </button>
          <button onClick={() => openEditor("note")} className="btn-primary text-xs shine">
            <FileText className="w-3.5 h-3.5" /> Secure Note
          </button>
          <button onClick={handleLock} className="btn-ghost text-xs text-red-500 border-red-500/20 hover:bg-red-500/10 hover:border-red-500">
            <Lock className="w-3.5 h-3.5" /> Lock
          </button>
        </div>
      </motion.header>

      {/* Items List */}
      <motion.div variants={slideUp} className="flex-1 overflow-y-auto space-y-3">
        {items.length === 0 ? (
          <div className="card p-12 text-center flex flex-col items-center justify-center h-64 border-dashed">
            <Shield className="w-12 h-12 text-[var(--text-muted)] opacity-50 mb-4" />
            <p className="text-sm font-semibold text-[var(--text-secondary)]">Vault is empty</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Store your passwords, seeds, and secrets securely.</p>
          </div>
        ) : (
          items.map(item => {
            const isDecrypted = !!decryptedContents[item.id!];
            const content = decryptedContents[item.id!];

            return (
              <div key={item.id} className="card p-4 transition-all">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)]">
                      {item.type === "password" ? <KeyRound className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--text-primary)]">{item.title}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Added {new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleViewItem(item)} className="btn-ghost p-2 text-[var(--text-muted)]">
                      {isDecrypted ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => openEditor(item.type, item)} className="btn-ghost p-2 text-[var(--text-muted)]">
                      Edit
                    </button>
                    <button onClick={() => handleDeleteItem(item.id!)} className="btn-ghost p-2 text-red-500/70 hover:text-red-500 hover:bg-red-500/10">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isDecrypted && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="mt-4 p-3 bg-black/5 dark:bg-white/5 rounded-lg border border-[var(--border-default)]">
                        {item.type === "password" ? (
                          <div className="flex items-center justify-between">
                            <code className="text-xs font-mono text-[var(--text-primary)]">{content}</code>
                            <button onClick={() => navigator.clipboard.writeText(content)} className="text-[10px] uppercase font-bold text-indigo-500 hover:text-indigo-400 tracking-wider">
                              Copy
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">{content}</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </motion.div>

      {/* Editor Overlay */}
      <AnimatePresence>
        {isEditing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="card w-full max-w-md p-6 space-y-4 border border-zinc-800 shadow-2xl relative">
              
              <button onClick={closeEditor} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-lg font-black text-[var(--text-primary)]">
                {editingId ? "Edit" : "Add"} {editType === "password" ? "Password" : "Secure Note"}
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1 block">Title</label>
                  <input autoFocus type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} 
                    placeholder="e.g. Bank Login, API Key, Secret Diary" className="w-full px-3 py-2 text-sm bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1 block">
                    {editType === "password" ? "Password / Secret" : "Content"}
                  </label>
                  {editType === "password" ? (
                    <input type="text" value={editPayload} onChange={e => setEditPayload(e.target.value)} 
                      placeholder="SuperSecret123!" className="w-full px-3 py-2 text-sm bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg outline-none focus:border-indigo-500 font-mono" />
                  ) : (
                    <textarea value={editPayload} onChange={e => setEditPayload(e.target.value)} rows={6}
                      placeholder="Write your encrypted note here..." className="w-full px-3 py-2 text-sm bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg outline-none focus:border-indigo-500 resize-none" />
                  )}
                </div>
              </div>

              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

              <button onClick={handleSaveItem} disabled={loading || !editTitle || !editPayload} className="btn-primary w-full justify-center py-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Encrypt & Save
              </button>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

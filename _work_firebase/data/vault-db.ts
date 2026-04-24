import Dexie, { type Table } from "dexie";

export interface VaultConfig {
  id: string; // usually "master"
  salt: string; // Base64
}

export interface EncryptedVaultItem {
  id?: number;
  type: "note" | "password" | "file";
  title: string; // We leave the title plaintext so users can see the list without unlocking, or we could encrypt it. For true security, let's keep it plaintext but only show when unlocked anyway.
  createdAt: number;
  updatedAt: number;
  
  // Encrypted Payload
  iv: string; // Base64
  ciphertext: string; // Base64
}

export class VaultDatabase extends Dexie {
  config!: Table<VaultConfig, string>;
  items!: Table<EncryptedVaultItem, number>;

  constructor() {
    super("MotionVaultDB");

    this.version(1).stores({
      config: "id",
      items: "++id, type, createdAt, updatedAt",
    });
  }
}

export const vaultDb = new VaultDatabase();

// --- Configuration ---

export async function getVaultSalt(): Promise<string | null> {
  const config = await vaultDb.config.get("master");
  return config ? config.salt : null;
}

export async function setVaultSalt(salt: string): Promise<void> {
  await vaultDb.config.put({ id: "master", salt });
}

// --- Items ---

export async function addVaultItem(item: Omit<EncryptedVaultItem, "id">): Promise<number> {
  return await vaultDb.items.add(item as EncryptedVaultItem);
}

export async function updateVaultItem(id: number, updates: Partial<Omit<EncryptedVaultItem, "id">>): Promise<void> {
  await vaultDb.items.update(id, updates);
}

export async function deleteVaultItem(id: number): Promise<void> {
  await vaultDb.items.delete(id);
}

export async function getAllVaultItems(): Promise<EncryptedVaultItem[]> {
  return await vaultDb.items.orderBy('updatedAt').reverse().toArray();
}

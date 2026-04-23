import { LifeDomain } from "../agent/domains";

/**
 * Firestore Data Models for Motion OS.
 * Every document is scoped to a specific 'userId' to ensure data isolation.
 */

export interface FirestoreUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: number;
  lastLogin: number;
}

export interface FirestoreTask {
  id?: string;
  userId: string; // Required for security rules
  title: string;
  goalId?: string;
  duration: number; // in minutes
  scheduledAt: number; // Store as timestamp (number) for easy serialization
  status: "todo" | "doing" | "done";
  priority: "low" | "medium" | "high";
  domain: LifeDomain;
  createdAt: number;
}

export interface FirestoreGoal {
  id?: string;
  userId: string;
  title: string;
  description?: string;
  deadline: number;
  priority: "low" | "medium" | "high";
  status: "not-started" | "in-progress" | "completed";
}

export interface FirestoreBlock {
  id: string;
  type: "text" | "heading" | "todo" | "toggle" | "timeline" | "chart" | "table" | "progress" | "stat" | "tasklist";
  content: string;
  children?: FirestoreBlock[];
  checked?: boolean;
  props?: Record<string, any>;
}

export interface FirestorePage {
  id: string;
  userId: string;
  title: string;
  parentId?: string;
  blocks: FirestoreBlock[];
}

export interface FirestoreActionLog {
  id: string;
  userId: string;
  type: string;
  payload: string; // Stringified JSON
  reason: string;
  timestamp: number;
  status: string;
}

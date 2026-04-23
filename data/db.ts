import Dexie, { type Table } from "dexie";
import { LifeDomain } from "../core/agent/domains";

export interface Goal {
  id?: number;
  title: string;
  deadline: Date;
  priority: "low" | "medium" | "high";
  status: "not-started" | "in-progress" | "completed";
}

export interface Subject {
  id?: number;
  name: string;
  goalId?: number;
  mastery: number; // 0-100
  lastStudiedAt?: Date;
}

export interface AgentLog {
  id?: number;
  action: string;
  rationale: string;
  timestamp: Date;
  success: boolean;
}

export interface ActionLog {
  id: string; // Using the action's unique ID
  type: string;
  payload: string; // Stringified JSON
  reason: string;
  timestamp: number;
  status: string;
}

export interface UserIntent {
  id?: number;
  text: string;
  timestamp: number;
}






export interface Task {
  id?: number;
  title: string;
  goalId?: number;
  duration: number; // in minutes
  scheduledAt: Date;
  status: "todo" | "doing" | "done";
  priority: "low" | "medium" | "high";
  domain: LifeDomain;
  createdAt: Date;
}


export interface TaskPerformanceRecord {
  id?: number;
  taskId: number;
  goalId?: number;
  type: "completion" | "miss";
  duration: number;
  timestamp: Date;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  completed: number;
  missed: number;
  total: number;
}

export interface Block {
  id: string;
  type: "text" | "heading" | "todo" | "toggle";
  content: string;
  children?: Block[];
  checked?: boolean;
}

export interface Page {
  id: string;
  title: string;
  parentId?: string;
  blocks: Block[];
}

export interface Column {
  id: string;
  name: string;
  type: "text" | "number" | "date" | "select";
}

export interface Row {
  id: string;
  values: { [columnId: string]: any };
}

export interface WorkspaceDatabase {
  id: string;
  name: string;
  columns: Column[];
  rows: Row[];
}

export class MotionDatabase extends Dexie {
  goals!: Table<Goal>;
  tasks!: Table<Task>;
  taskPerformanceLogs!: Table<TaskPerformanceRecord>;
  subjects!: Table<Subject>;
  agentLogs!: Table<AgentLog>;
  action_logs!: Table<ActionLog>;
  intents!: Table<UserIntent>;
  daily_stats!: Table<DailyStats>;
  pages!: Table<Page, string>;
  databases!: Table<WorkspaceDatabase, string>;

  constructor() {
    super("MotionDB");

    this.version(13).stores({
      goals: "++id, title, deadline, priority, status",
      tasks: "++id, title, goalId, duration, scheduledAt, status, createdAt, priority, domain",
      taskPerformanceLogs: "++id, taskId, goalId, type, timestamp, duration",
      subjects: "++id, name, goalId, mastery, lastStudiedAt",
      agentLogs: "++id, action, rationale, timestamp, success",
      action_logs: "id, type, reason, timestamp, status",
      intents: "++id, text, timestamp",
      daily_stats: "date, completed, missed, total",
      pages: "id, parentId",
      databases: "id"
    });
  }
}









export const db = new MotionDatabase();

// Helper Functions
export const addGoal = async (goal: Omit<Goal, "id">) => {
  return await db.goals.add(goal);
};

export const getGoals = async () => {
  return await db.goals.toArray();
};

export const addTask = async (task: Omit<Task, "id">) => {
  if (!task.domain) {
    task.domain = "personal";
  }
  return await db.tasks.add(task);
};


export const getTasks = async () => {
  return await db.tasks.toArray();
};

export const updateTask = async (taskId: number, updates: Partial<Task>) => {
  return await db.tasks.update(taskId, updates);
};

export const bulkUpdateTasks = async (updates: { id: number; updates: Partial<Task> }[]) => {
  return await db.transaction("rw", db.tasks, async () => {
    for (const item of updates) {
      await db.tasks.update(item.id, item.updates);
    }
  });
};

// Subject Helpers
export const addSubject = async (subject: Omit<Subject, "id">) => {
  return await db.subjects.add(subject);
};

export const getSubjects = async () => {
  return await db.subjects.toArray();
};

export const updateSubject = async (id: number, updates: Partial<Subject>) => {
  return await db.subjects.update(id, updates);
};

// Agent Log Helpers
export const addAgentLog = async (log: Omit<AgentLog, "id">) => {
  return await db.agentLogs.add(log);
};

export const getAgentLogs = async () => {
  return await db.agentLogs.orderBy('timestamp').reverse().limit(10).toArray();
};

// Intent Helpers
export const addIntent = async (intent: Omit<UserIntent, "id">) => {
  return await db.intents.add(intent);
};

export const getIntents = async () => {
  return await db.intents.orderBy('timestamp').reverse().toArray();
};



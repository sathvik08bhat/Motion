import Dexie, { type Table } from "dexie";

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


export interface Task {
  id?: number;
  title: string;
  goalId?: number;
  duration: number; // in minutes
  scheduledAt: Date;
  status: "todo" | "doing" | "done";
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

export class MotionDatabase extends Dexie {
  goals!: Table<Goal>;
  tasks!: Table<Task>;
  taskPerformanceLogs!: Table<TaskPerformanceRecord>;
  subjects!: Table<Subject>;

  constructor() {
    super("MotionDB");

    this.version(1).stores({
      goals: "++id, title, deadline, priority, status",
      tasks: "++id, title, goalId, duration, scheduledAt, status",
    });

    this.version(2).stores({
      taskPerformanceLogs: "++id, taskId, goalId, type, timestamp, duration",
    });

    this.version(3).stores({
      tasks: "++id, title, goalId, duration, scheduledAt, status, createdAt",
    });

    this.version(4).stores({
      subjects: "++id, name, goalId, mastery, lastStudiedAt",
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


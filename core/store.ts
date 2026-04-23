import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Task, type Goal } from "../data/db";


interface MotionState {

  goals: Goal[];
  tasks: Task[];
  isPaletteOpen: boolean;
  setPaletteOpen: (isOpen: boolean) => void;
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: number, updates: Partial<Task>) => void;
  bulkUpdateTasks: (updates: { id: number; updates: Partial<Task> }[]) => void;
  deleteTask: (taskId: number) => void;
  installedModules: string[];
  installModule: (name: string) => void;
  uninstallModule: (name: string) => void;
}




export const useStore = create<MotionState>()(
  persist(
    (set) => ({
      goals: [],
      tasks: [],
      isPaletteOpen: false,

      setPaletteOpen: (isOpen) => set({ isPaletteOpen: isOpen }),
      
      setGoals: (goals) => set({ goals }),
      
      addGoal: (goal) =>
        set((state) => ({
          goals: [...state.goals, goal],
        })),

      setTasks: (tasks) => set({ tasks }),

      addTask: (task) =>
        set((state) => ({
          tasks: [...state.tasks, task],
        })),

      updateTask: (taskId, updates) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId ? { ...task, ...updates } : task
          ),
        })),

      bulkUpdateTasks: (updates) =>
        set((state) => ({
          tasks: state.tasks.map((task) => {
            const update = updates.find((u) => u.id === task.id);
            return update ? { ...task, ...update.updates } : task;
          }),
        })),

      deleteTask: (taskId) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== taskId),
        })),

      installedModules: ['Calendar', 'Study'], // Default modules
      
      installModule: (name) => set((state) => ({
        installedModules: [...state.installedModules, name]
      })),

      uninstallModule: (name) => set((state) => ({
        installedModules: state.installedModules.filter(m => m !== name)
      })),
    }),


    { name: "motion-settings" }
  )
);



import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AgentAction } from './types';


export type ControlMode = "suggest_only" | "semi_auto" | "full_auto";

export interface AgentSettings {
  tone: "concise" | "helpful" | "formal";
  priorityBias: number; // 0 to 1
  domainFocus: string[];
  lastModified: number;
}

interface ControlState {
  currentMode: ControlMode;
  settings: AgentSettings;
  setControlMode: (mode: ControlMode) => void;
  updateSettings: (updates: Partial<AgentSettings>) => void;
  getControlMode: () => ControlMode;
}


/**
 * Control Mode System: Manages the autonomy level of the Agent.
 */
export const useControlMode = create<ControlState>()(
  persist(
    (set, get) => ({
      currentMode: "semi_auto",
      settings: {
        tone: "helpful",
        priorityBias: 0.5,
        domainFocus: ["Work", "Personal"],
        lastModified: Date.now(),
      },
      
      setControlMode: (mode) => set({ currentMode: mode }),

      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates, lastModified: Date.now() }
      })),
      
      getControlMode: () => get().currentMode,
    }),

    { name: "motion-control-mode" }
  )
);



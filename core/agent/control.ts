import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AgentAction } from './types';


export type ControlMode = "suggest_only" | "semi_auto" | "full_auto";

interface ControlState {
  currentMode: ControlMode;
  setControlMode: (mode: ControlMode) => void;
  getControlMode: () => ControlMode;
}


/**
 * Control Mode System: Manages the autonomy level of the Agent.
 */
export const useControlMode = create<ControlState>()(
  persist(
    (set, get) => ({
      currentMode: "semi_auto",
      
      setControlMode: (mode) => set({ currentMode: mode }),
      
      getControlMode: () => get().currentMode,
    }),

    { name: "motion-control-mode" }
  )
);



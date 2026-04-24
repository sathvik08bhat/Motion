import { create } from 'zustand';

/**
 * Guided Module Builder State: 
 * Manages the multi-step flow for autonomously creating new OS modules.
 */

interface ModuleBuilderState {
  step: number;
  intent: string;
  config: Record<string, any>;
  isOpen: boolean;
  
  // Actions
  startBuilder: (intent: string) => void;
  updateConfig: (key: string, value: any) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetBuilder: () => void;
  setOpen: (isOpen: boolean) => void;
}

export const useModuleBuilder = create<ModuleBuilderState>((set) => ({
  step: 0,
  intent: "",
  config: {},
  isOpen: false,

  startBuilder: (intent) => set({ 
    intent, 
    step: 1, 
    config: {}, 
    isOpen: true 
  }),

  updateConfig: (key, value) => set((state) => ({
    config: { ...state.config, [key]: value }
  })),

  nextStep: () => set((state) => ({ 
    step: state.step + 1 
  })),

  prevStep: () => set((state) => ({ 
    step: Math.max(0, state.step - 1) 
  })),

  resetBuilder: () => set({ 
    step: 0, 
    intent: "", 
    config: {}, 
    isOpen: false 
  }),

  setOpen: (isOpen) => set({ isOpen })
}));

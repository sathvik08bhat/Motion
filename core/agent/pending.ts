import { create } from 'zustand';
import { AgentAction } from './types';

interface PendingState {
  pendingAction: AgentAction | null;
  setPendingAction: (action: AgentAction | null) => void;
  clearPendingAction: () => void;
}

/**
 * Pending Action Store: Manages the "Human-in-the-Loop" state for semi-auto mode.
 * Holds exactly one action awaiting user confirmation.
 */
export const usePendingStore = create<PendingState>((set) => ({
  pendingAction: null,
  
  setPendingAction: (action) => set({ pendingAction: action }),
  
  clearPendingAction: () => set({ pendingAction: null }),
}));

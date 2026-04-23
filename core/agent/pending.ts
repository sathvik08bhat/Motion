import { create } from 'zustand';
import { AgentAction } from './types';

interface SuggestionState {
  pendingAction: AgentAction | null;
  suggestions: AgentAction[];
  setPendingAction: (action: AgentAction | null) => void;
  addSuggestion: (action: AgentAction) => void;
  removeSuggestion: (actionId: string) => void;
  clearPendingAction: () => void;
}

export const usePendingStore = create<SuggestionState>((set) => ({
  pendingAction: null,
  suggestions: [],
  
  setPendingAction: (action) => set({ pendingAction: action }),
  
  addSuggestion: (action) => set((state) => ({ 
    suggestions: [...state.suggestions.filter(s => s.id !== action.id), action] 
  })),

  removeSuggestion: (actionId) => set((state) => ({
    suggestions: state.suggestions.filter(s => s.id !== actionId)
  })),
  
  clearPendingAction: () => set({ pendingAction: null }),
}));

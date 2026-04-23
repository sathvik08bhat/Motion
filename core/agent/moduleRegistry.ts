import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type ModuleLayout } from './moduleCompiler';

export interface InstalledModule {
  id: string;
  name: string;
  icon: string;
  layout: ModuleLayout;
  createdAt: number;
  lastUpdated: number;
}

interface ModuleRegistryState {
  modules: InstalledModule[];
  
  // Actions
  installModule: (layout: ModuleLayout) => void;
  uninstallModule: (id: string) => void;
  updateModuleLayout: (id: string, layout: ModuleLayout) => void;
  getModule: (id: string) => InstalledModule | undefined;
}

export const useModuleRegistry = create<ModuleRegistryState>()(
  persist(
    (set, get) => ({
      modules: [],

      installModule: (layout) => set((state) => {
        const newModule: InstalledModule = {
          id: layout.id,
          name: layout.title,
          icon: "Layout", // Default icon
          layout: layout,
          createdAt: Date.now(),
          lastUpdated: Date.now()
        };
        return { modules: [newModule, ...state.modules] };
      }),

      uninstallModule: (id) => set((state) => ({
        modules: state.modules.filter(m => m.id !== id)
      })),

      updateModuleLayout: (id, layout) => set((state) => ({
        modules: state.modules.map(m => 
          m.id === id ? { ...m, layout, lastUpdated: Date.now() } : m
        )
      })),

      getModule: (id) => get().modules.find(m => m.id === id)
    }),
    {
      name: 'motion-modules-storage'
    }
  )
);

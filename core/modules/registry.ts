import { ReactNode } from 'react';

export interface ModuleAction {
  id: string;
  label: string;
  handler: (...args: any[]) => void | Promise<void>;
  icon?: string;
}

export interface Module {
  name: string;
  init: () => void | Promise<void>;
  actions: ModuleAction[];
  components?: Record<string, React.ComponentType<any>>;
  // Hooks
  onEvent?: Record<string, (data: any) => void>;
  onTick?: (store: any) => void | Promise<void>;
  // Agent Logic Hooks
  priorityHook?: (task: any, goal?: any) => number;
  plannerHook?: (tasks: any[], goals: any[]) => any[] | Promise<any[]>;
}

class ModuleRegistry {
  private modules: Map<string, Module> = new Map();
  private agentHooks: Array<(store: any) => void | Promise<void>> = [];
  private priorityHooks: Array<(task: any, goal?: any) => number> = [];
  private plannerHooks: Array<(tasks: any[], goals: any[]) => any[] | Promise<any[]>> = [];



  registerModule(module: Module) {
    if (this.modules.has(module.name)) {
      console.warn(`Module with name "${module.name}" is already registered. Overwriting.`);
    }
    this.modules.set(module.name, module);
    console.log(`Module "${module.name}" registered successfully.`);
    
    // Wire up event hooks
    if (module.onEvent) {
      Object.entries(module.onEvent).forEach(([eventName, handler]) => {
        const { eventBus } = require('../events'); // Avoid circular dependency
        eventBus.on(eventName, handler);
      });
    }

    // Collect agent hooks
    if (module.onTick) {
      this.agentHooks.push(module.onTick);
    }

    if (module.priorityHook) {
      this.priorityHooks.push(module.priorityHook);
    }

    if (module.plannerHook) {
      this.plannerHooks.push(module.plannerHook);
    }

    // Initialize the module immediately

    try {
      module.init();
    } catch (error) {
      console.error(`Failed to initialize module "${module.name}":`, error);
    }
  }

  getAgentHooks() {
    return this.agentHooks;
  }

  getPriorityHooks() {
    return this.priorityHooks;
  }

  getPlannerHooks() {
    return this.plannerHooks;
  }



  getModules(): Module[] {
    return Array.from(this.modules.values());
  }

  getModule(name: string): Module | undefined {
    return this.modules.get(name);
  }

  getAllActions(): ModuleAction[] {
    return this.getModules().flatMap(m => m.actions);
  }
}

export const registry = new ModuleRegistry();

// Standard helper functions as requested
export const registerModule = (module: Module) => registry.registerModule(module);
export const getModules = () => registry.getModules();
export const getModule = (name: string) => registry.getModule(name);

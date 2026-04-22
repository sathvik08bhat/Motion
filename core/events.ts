type EventCallback = (data: any) => void;

class EventEmitter {
  private events: Map<string, EventCallback[]>;

  constructor() {
    this.events = new Map();
  }

  on(eventName: string, callback: EventCallback) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName)?.push(callback);
  }

  emit(eventName: string, data: any) {
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  // Remove listener (optional but recommended)
  off(eventName: string, callback: EventCallback) {
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      this.events.set(
        eventName,
        callbacks.filter((cb) => cb !== callback)
      );
    }
  }
}

export const eventBus = new EventEmitter();

// Typed Event Names for consistency
export const OS_EVENTS = {
  TASK_COMPLETED: "task_completed",
  TASK_MISSED: "task_missed",
  TASK_UPCOMING: "task_upcoming",
  PLAN_CREATED: "plan_created",
} as const;

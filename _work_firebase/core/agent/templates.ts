/**
 * Module Templates: 
 * Prebuilt structures that the AI uses as a foundation for new modules.
 */

export interface ModuleTemplate {
  id: string;
  name: string;
  description: string;
  baseConfig: Record<string, any>;
  uiStructure: string[];
  aiInstructions: string;
}

export const MODULE_TEMPLATES: ModuleTemplate[] = [
  {
    id: "study_tracker",
    name: "Study Tracker",
    description: "Deep-focus academic tracking with subject mastery and exam countdowns.",
    baseConfig: {
      domain: "study",
      metrics: ["mastery", "hours_studied"],
      view: "detailed"
    },
    uiStructure: ["MasteryChart", "ExamCountdown", "SubjectGrid"],
    aiInstructions: "Focus on academic performance, study-break balance, and long-term retention tracking."
  },
  {
    id: "fitness_tracker",
    name: "Fitness Tracker",
    description: "Physical performance monitoring, workout logging, and health metrics.",
    baseConfig: {
      domain: "health",
      metrics: ["reps", "weight", "duration"],
      view: "minimal"
    },
    uiStructure: ["WorkoutLog", "ProgressGraph", "HealthPill"],
    aiInstructions: "Prioritize physical consistency, recovery time, and progressive overload tracking."
  },
  {
    id: "project_manager",
    name: "Project Manager",
    description: "Advanced objective tracking, task dependency management, and milestone visualization.",
    baseConfig: {
      domain: "work",
      metrics: ["milestones", "velocity"],
      view: "detailed"
    },
    uiStructure: ["MilestoneTimeline", "TaskBoard", "VelocityChart"],
    aiInstructions: "Focus on deadline management, task dependencies, and high-level project visibility."
  },
  {
    id: "habit_tracker",
    name: "Habit Tracker",
    description: "Daily consistency monitoring with streak visualization and behavioral nudges.",
    baseConfig: {
      domain: "personal",
      metrics: ["streaks", "consistency"],
      view: "minimal"
    },
    uiStructure: ["HabitGrid", "StreakCounter", "NudgeBanner"],
    aiInstructions: "Emphasize daily repetition, streak protection, and small-win celebrations."
  }
];

export function getTemplateById(id: string): ModuleTemplate | undefined {
  return MODULE_TEMPLATES.find(t => t.id === id);
}

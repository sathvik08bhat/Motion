/**
 * Module Compiler:
 * Maps builder configurations to standardized UI components and layouts.
 */

export interface ComponentConfig {
  type: "StatCard" | "ProgressBar" | "TaskList" | "Chart" | "DailyLog" | "Countdown" | "Grid";
  title: string;
  props: Record<string, any>;
}

export interface ModuleLayout {
  id: string;
  title: string;
  accentColor: string;
  uiStyle: "minimal" | "detailed";
  sections: {
    id: string;
    title: string;
    components: ComponentConfig[];
  }[];
}

export function compileModuleLayout(config: Record<string, any>): ModuleLayout {
  const layout: ModuleLayout = {
    id: `module_${Date.now()}`,
    title: config.moduleType || "New Module",
    accentColor: config.themeColor || "Indigo",
    uiStyle: (config.uiStyle?.toLowerCase() as "minimal" | "detailed") || "detailed",
    sections: []
  };

  // 1. Study Tracker Mapping
  if (config.moduleType === "Study Tracker") {
    layout.sections.push({
      id: "overview",
      title: "Academic Performance",
      components: [
        { type: "StatCard", title: "Mastery", props: { value: 0, suffix: "%", icon: "BookOpen" } },
        { type: "ProgressBar", title: "Study Goal", props: { target: config.dailyHours || 4, unit: "hrs" } },
        { type: "Countdown", title: "Exam Countdown", props: { date: config.examDate } }
      ]
    });
    layout.sections.push({
      id: "actions",
      title: "Focus Areas",
      components: [
        { type: "TaskList", title: "Upcoming Topics", props: { filter: "study", items: config.subjects?.split(",") } }
      ]
    });
  }

  // 2. Fitness Tracker Mapping
  else if (config.moduleType === "Fitness Tracker") {
    layout.sections.push({
      id: "health_metrics",
      title: "Fitness Overview",
      components: [
        { type: "ProgressBar", title: "Weekly Progress", props: { current: 0, target: config.weeklyGoal || 3 } },
        { type: "Chart", title: "Performance Trend", props: { type: "line", data: [] } }
      ]
    });
    layout.sections.push({
      id: "log",
      title: "Activity Journal",
      components: [
        { type: "DailyLog", title: config.activityType || "Workout", props: {} }
      ]
    });
  }

  // 3. Project Manager Mapping
  else if (config.moduleType === "Project Manager") {
    layout.sections.push({
      id: "project_core",
      title: config.projectName || "Project Dashboard",
      components: [
        { type: "StatCard", title: "Completion", props: { value: 0, suffix: "%" } },
        { type: "TaskList", title: "Milestones", props: { type: "milestone" } }
      ]
    });
  }

  // 4. Default / Custom Mapping
  else {
    layout.sections.push({
      id: "general",
      title: "Module Controls",
      components: [
        { type: "StatCard", title: "Active State", props: { value: "Enabled" } },
        { type: "TaskList", title: "Action Items", props: {} }
      ]
    });
  }

  return layout;
}

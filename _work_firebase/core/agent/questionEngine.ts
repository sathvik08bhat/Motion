import { MODULE_TEMPLATES } from "./templates";

export type InputType = "text" | "number" | "select" | "date";

export interface Question {
  id: string;
  text: string;
  inputType: InputType;
  options?: string[]; // Only for 'select'
  configKey: string;
}

export function getNextQuestion(config: Record<string, any>): Question | null {
  // 1. Identify the Module Type
  if (!config.moduleType) {
    return {
      id: "module_type",
      text: "What do you want to build today?",
      inputType: "select",
      options: MODULE_TEMPLATES.map(t => t.name).concat(["Custom"]),
      configKey: "moduleType"
    };
  }

  // 2. Module-Specific Questions: Study Tracker
  if (config.moduleType === "Study Tracker") {
    if (!config.subjects) {
      return {
        id: "study_subjects",
        text: "Which subjects or topics are you focusing on? (Comma separated)",
        inputType: "text",
        configKey: "subjects"
      };
    }
    if (!config.dailyHours) {
      return {
        id: "study_hours",
        text: "How many hours per day can you realistically dedicate to studying?",
        inputType: "number",
        configKey: "dailyHours"
      };
    }
    if (!config.examDate) {
      return {
        id: "study_exam_date",
        text: "When is your main exam or target deadline?",
        inputType: "date",
        configKey: "examDate"
      };
    }
  }

  // 3. Module-Specific: Fitness Tracker
  if (config.moduleType === "Fitness Tracker") {
    if (!config.activityType) {
      return {
        id: "fitness_activity",
        text: "What's your primary activity? (e.g. Weightlifting, Running, Yoga)",
        inputType: "text",
        configKey: "activityType"
      };
    }
    if (!config.weeklyGoal) {
      return {
        id: "fitness_goal",
        text: "How many sessions per week are you aiming for?",
        inputType: "number",
        configKey: "weeklyGoal"
      };
    }
  }

  // 4. Module-Specific: Project Manager
  if (config.moduleType === "Project Manager") {
    if (!config.projectName) {
      return {
        id: "project_name",
        text: "What's the name of your current project?",
        inputType: "text",
        configKey: "projectName"
      };
    }
  }

  // 5. Module-Specific: Habit Tracker
  if (config.moduleType === "Habit Tracker") {
    if (!config.habits) {
      return {
        id: "habit_list",
        text: "Which daily habits do you want to track? (Comma separated)",
        inputType: "text",
        configKey: "habits"
      };
    }
  }

  // 6. UI & Theme Customization
  if (!config.themeColor) {
    return {
      id: "ui_color",
      text: "What's your preferred accent color for this module?",
      inputType: "select",
      options: ["Indigo", "Emerald", "Rose", "Amber", "Cyan"],
      configKey: "themeColor"
    };
  }

  if (!config.uiStyle) {
    return {
      id: "ui_style",
      text: "Do you prefer a minimal dashboard or a detailed, information-rich view?",
      inputType: "select",
      options: ["Minimal", "Detailed"],
      configKey: "uiStyle"
    };
  }

  // No more questions
  return null;
}

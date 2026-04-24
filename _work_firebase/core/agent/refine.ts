import { LifeDomain } from "./domains";

/**
 * Task Refinement Layer: Polishes AI-generated or user-input tasks 
 * to ensure they are atomic, specific, and manageable.
 */
export interface RawTask {
  title: string;
  duration: number;
  priority: 'low' | 'medium' | 'high';
  domain: LifeDomain;
}


export function refineTasks(tasks: RawTask[]): RawTask[] {
  let refined: RawTask[] = [];

  // 1. Splitting and Rewriting
  for (const task of tasks) {
    let { title, duration, priority, domain } = task;

    // Rule: Rewrite vague titles
    title = humanizeVagueTitle(title);

    // Rule: Split if duration > 120
    if (duration > 120) {
      const parts = Math.ceil(duration / 90);
      const partDuration = Math.floor(duration / parts);
      for (let i = 1; i <= parts; i++) {
        refined.push({
          title: `${title} (Part ${i})`,
          duration: partDuration,
          priority: priority || 'medium',
          domain: domain || 'personal'
        });
      }
    } else {
      refined.push({ title, duration: duration || 30, priority: priority || 'medium', domain: domain || 'personal' });
    }
  }


  // 2. Manageability Cap: Max 8 tasks per batch/day
  // (Ensures the user isn't overwhelmed by a 20-task dump)
  if (refined.length > 8) {
    console.warn("⚠️ Task Refinement: Capping roadmap to 8 most critical tasks.");
    // Sort by priority before capping
    const priorityMap = { high: 3, medium: 2, low: 1 };
    refined = refined
      .sort((a, b) => (priorityMap[b.priority || 'medium'] - priorityMap[a.priority || 'medium']))
      .slice(0, 8);
  }

  return refined;
}

/**
 * Heuristic-based vague title rewriter.
 * Simple common patterns to make actions more concrete.
 */
function humanizeVagueTitle(title: string): string {
  const vaguePatterns: Record<string, string> = {
    "exercise": "30 min cardio workout",
    "work": "Focused work session",
    "study": "Deep study session",
    "improve": "Analyze and improve",
    "learn": "Review learning material for",
    "practice": "Dedicated practice session for",
    "clean": "Quick space organization for"
  };

  const lowerTitle = title.toLowerCase().trim();
  
  for (const [vague, specific] of Object.entries(vaguePatterns)) {
    if (lowerTitle === vague) return specific;
    // If it starts with a vague verb, refine it slightly
    if (lowerTitle.startsWith(`${vague} `)) {
      return title.replace(new RegExp(`^${vague}`, 'i'), specific);
    }
  }

  return title;
}

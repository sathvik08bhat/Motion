import { LifeDomain } from './domains';

/**
 * Domain Detection Engine: Automatically categorizes tasks into life domains
 * based on keyword analysis of the task title.
 */
export function detectDomain(taskTitle: string): LifeDomain {
  const lowerTitle = taskTitle.toLowerCase();

  // Study Domain
  if (
    lowerTitle.includes("study") ||
    lowerTitle.includes("exam") ||
    lowerTitle.includes("revision")
  ) {
    return "study";
  }

  // Health Domain
  if (
    lowerTitle.includes("workout") ||
    lowerTitle.includes("run") ||
    lowerTitle.includes("diet")
  ) {
    return "health";
  }

  // Work Domain
  if (
    lowerTitle.includes("project") ||
    lowerTitle.includes("meeting") ||
    lowerTitle.includes("client")
  ) {
    return "work";
  }

  // Relationships Domain
  if (
    lowerTitle.includes("family") ||
    lowerTitle.includes("friends")
  ) {
    return "relationships";
  }

  // Fallback
  return "personal";
}

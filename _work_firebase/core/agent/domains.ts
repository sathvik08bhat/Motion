/**
 * Life Domain System: Categorizes goals and tasks into core areas of life
 * to ensure balance and targeted productivity tracking.
 */

export type LifeDomain =
  | "study"
  | "health"
  | "work"
  | "personal"
  | "relationships";

/**
 * Returns the default, standard set of Life Domains supported by the OS.
 */
export function getDefaultDomains(): LifeDomain[] {
  return ["study", "health", "work", "personal", "relationships"];
}

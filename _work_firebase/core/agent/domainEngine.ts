import { Task } from '../../data/db';
import { LifeDomain, getDefaultDomains } from './domains';

export interface DomainDistribution {
  study: number;
  health: number;
  work: number;
  personal: number;
  relationships: number;
}

/**
 * Domain Analysis Engine: Calculates the distribution of tasks across different
 * life domains as percentages. This is used to visualize life balance.
 */
export function analyzeDomains(tasks: Task[]): DomainDistribution {
  const totalTasks = tasks.length;
  
  // Initialize counts
  const counts: Record<LifeDomain, number> = {
    study: 0,
    health: 0,
    work: 0,
    personal: 0,
    relationships: 0
  };

  // If no tasks, return 0 for all
  if (totalTasks === 0) {
    return counts;
  }

  // Count occurrences
  tasks.forEach(task => {
    if (task.domain && counts.hasOwnProperty(task.domain)) {
      counts[task.domain]++;
    } else {
      // Fallback for safety
      counts.personal++;
    }
  });

  // Convert to percentages
  return {
    study: Math.round((counts.study / totalTasks) * 100),
    health: Math.round((counts.health / totalTasks) * 100),
    work: Math.round((counts.work / totalTasks) * 100),
    personal: Math.round((counts.personal / totalTasks) * 100),
    relationships: Math.round((counts.relationships / totalTasks) * 100)
  };
}

export interface ImbalanceReport {
  overfocused: LifeDomain | null;
  neglected: LifeDomain[];
}

/**
 * Imbalance Detection: Analyzes a domain distribution report to identify
 * areas of extreme hyper-focus (burnout risk) and neglected domains.
 */
export function detectImbalance(domainStats: DomainDistribution): ImbalanceReport {
  const report: ImbalanceReport = {
    overfocused: null,
    neglected: []
  };

  const domains = Object.keys(domainStats) as LifeDomain[];

  for (const domain of domains) {
    const percentage = domainStats[domain];
    
    // Check for hyper-focus (>70%)
    if (percentage > 70) {
      report.overfocused = domain;
    }
    
    // Check for neglect (<5%)
    if (percentage < 5) {
      report.neglected.push(domain);
    }
  }

  return report;
}

export function enforceBalance(tasks: Task[], report: ImbalanceReport): Task[] {
  let adjustedTasks = [...tasks];

  // 1. Trim overfocused domain (keep top priorities, remove lowest)
  if (report.overfocused) {
    const overfocusedTasks = adjustedTasks.filter(t => t.domain === report.overfocused);
    if (overfocusedTasks.length > 2) {
      // Remove the last one (assuming sorted by priority or just trim the excess)
      const taskToRemove = overfocusedTasks[overfocusedTasks.length - 1];
      adjustedTasks = adjustedTasks.filter(t => t !== taskToRemove);
    }
  }

  // 2. Insert for neglected domains
  report.neglected.forEach(domain => {
    if (domain === "health") {
      adjustedTasks.push({
        title: "30 min walk",
        duration: 30,
        priority: "medium",
        domain: "health",
        status: "todo",
        createdAt: new Date(),
        scheduledAt: new Date()
      });
    } else if (domain === "relationships") {
      adjustedTasks.push({
        title: "Check in with a friend or family member",
        duration: 15,
        priority: "medium",
        domain: "relationships",
        status: "todo",
        createdAt: new Date(),
        scheduledAt: new Date()
      });
    } else if (domain === "personal") {
      adjustedTasks.push({
        title: "15 min of personal reflection or reading",
        duration: 15,
        priority: "medium",
        domain: "personal",
        status: "todo",
        createdAt: new Date(),
        scheduledAt: new Date()
      });
    }
    // study and work typically don't need auto-insertion, but we can add them if needed
  });

  return adjustedTasks;
}



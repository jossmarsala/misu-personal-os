/* ═══════════════════════════════════════
   Smart task recommendation engine
   ═══════════════════════════════════════ */

import { getDaysUntil } from './dateUtils';

/**
 * Score and rank tasks based on current energy level.
 * Returns top tasks sorted by relevance score.
 */
export function getRecommendations(tasks, currentEnergy, limit = 5) {
  const activeTasks = tasks.filter(t => !t.completed);
  
  if (activeTasks.length === 0) return [];

  const scored = activeTasks.map(task => {
    let score = 0;

    // Energy match scoring
    if (task.energyRequired === currentEnergy) {
      score += 15; // Perfect match
    } else if (task.energyRequired < currentEnergy) {
      score += 10 - (currentEnergy - task.energyRequired); // Closer = better
    } else {
      score -= (task.energyRequired - currentEnergy) * 5; // Penalize too-hard tasks
    }

    // Deadline urgency scoring
    const daysLeft = getDaysUntil(task.deadline);
    if (daysLeft !== null) {
      if (daysLeft < 0) score += 20;       // Overdue — top priority
      else if (daysLeft === 0) score += 18; // Due today
      else if (daysLeft === 1) score += 14; // Due tomorrow
      else if (daysLeft <= 3) score += 10;  // Due within 3 days
      else if (daysLeft <= 7) score += 5;   // Due within a week
    }

    // Shorter tasks get a small bonus (easier to start)
    if (task.estimatedHours <= 1) score += 3;
    else if (task.estimatedHours <= 2) score += 1;

    return { ...task, score };
  });

  // Sort by score descending, then by deadline ascending
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const daysA = getDaysUntil(a.deadline) ?? 999;
    const daysB = getDaysUntil(b.deadline) ?? 999;
    return daysA - daysB;
  });

  // Only return tasks that are feasible (energy-wise)
  const feasible = scored.filter(t => t.energyRequired <= currentEnergy);
  
  // If nothing feasible, return the gentlest tasks anyway
  if (feasible.length === 0) {
    return scored
      .sort((a, b) => a.energyRequired - b.energyRequired)
      .slice(0, limit);
  }

  return feasible.slice(0, limit);
}

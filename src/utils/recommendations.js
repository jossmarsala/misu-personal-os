/* ═══════════════════════════════════════
   Smart task recommendation engine
   ═══════════════════════════════════════ */

import { getDaysUntil } from './dateUtils';

export function getRecommendations(tasks, currentEnergy) {
  const activeTasks = tasks.filter(t => !t.completed);
  if (activeTasks.length === 0) return [];

  // Determine dynamic limits based on energy
  let maxTasks = 5;
  if (currentEnergy <= 2) maxTasks = 2;
  else if (currentEnergy === 3) maxTasks = 4;

  const scored = activeTasks.map(task => {
    // L5: Hard gate — don't recommend tasks that exceed current energy by more than 1 level
    if (task.energyRequired > currentEnergy + 1) return null;

    let score = 100; // Base score

    // Energy match scoring
    if (task.energyRequired === currentEnergy) {
      score += 15; // Perfect match
    } else if (task.energyRequired < currentEnergy) {
      score += 10 - (currentEnergy - task.energyRequired); // Closer = better
    } else {
      // Exponential penalty for exceeding current energy
      score -= Math.pow(task.energyRequired - currentEnergy, 2) * 10;
    }

    // Deadline urgency scoring
    const daysLeft = getDaysUntil(task.deadline);
    if (daysLeft !== null) {
      if (daysLeft < 0) score += 50;       // Overdue — top priority
      else if (daysLeft === 0) score += 40; // Due today
      else if (daysLeft === 1) score += 20; // Due tomorrow
      else if (daysLeft <= 3) score += 10;  // Due within 3 days
      else if (daysLeft <= 7) score += 5;   // Due within a week
    }

    // Momentum bonus for low energy + quick tasks
    if (currentEnergy <= 2 && task.estimatedHours <= 0.5) {
      score += 15;
    } else {
      if (task.estimatedHours <= 1) score += 3;
      else if (task.estimatedHours <= 2) score += 1;
    }

    return { ...task, score };
  });

  // L5: Filter nulls, then sort by score descending then deadline ascending
  const filteredScored = scored
    .filter(Boolean)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const daysA = getDaysUntil(a.deadline) ?? 999;
      const daysB = getDaysUntil(b.deadline) ?? 999;
      return daysA - daysB;
    });

  // Apply limits and timeboxing
  const finalRecs = [];
  let accumulatedHours = 0;

  for (const task of filteredScored) {
    if (finalRecs.length >= maxTasks) break;

    // Timeboxing: If low energy, restrict total recommended time
    if (currentEnergy <= 2) {
      const taskHours = task.estimatedHours || 1;
      // Guarantee at least one task even if it's long, but skip if it pushes total over limit
      if (finalRecs.length > 0 && (accumulatedHours + taskHours > 2)) {
         continue; 
      }
      accumulatedHours += taskHours;
    }
    
    finalRecs.push(task);
  }

  // Edge case fallback: if nothing was selected, return the highest scored task
  if (finalRecs.length === 0 && filteredScored.length > 0) {
    return [filteredScored[0]];
  }

  return finalRecs;
}


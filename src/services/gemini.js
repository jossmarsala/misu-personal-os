/* ═══════════════════════════════════════
   Gemini AI integration for weekly planning
   ═══════════════════════════════════════ */

import { GoogleGenAI } from '@google/genai';

/**
 * Generate a weekly plan using Gemini AI
 */
export async function generateWeeklyPlan(tasks, apiKey, language = 'en') {
  if (!apiKey) {
    throw new Error('Gemini API key is required. Please add it in Settings.');
  }

  const activeTasks = tasks.filter(t => !t.completed);
  if (activeTasks.length === 0) {
    throw new Error('No active tasks to plan. Add some tasks first!');
  }

  const ai = new GoogleGenAI({ apiKey });

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const todayStr = todayDate.toISOString().split('T')[0];

  const rollingDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayDate);
    d.setDate(d.getDate() + i);
    return {
      dateStr: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'long' })
    };
  });

  const weekDatesStr = rollingDays.map(d => `${d.dayName} (${d.dateStr})`).join(', ');

  // One week from today — tasks due beyond this can be deferred
  const oneWeekOut = new Date(todayDate);
  oneWeekOut.setDate(oneWeekOut.getDate() + 7);

  const taskList = activeTasks.map(t => {
    let isOverdue = false;
    let dueThisWeek = true;

    if (t.deadline) {
      const dl = new Date(t.deadline);
      dl.setHours(0, 0, 0, 0);
      if (dl < todayDate) {
        isOverdue = true;
      } else if (dl >= oneWeekOut) {
        dueThisWeek = false; // deadline is ≥7 days away — eligible for deferral
      }
    }

    return {
      id: t.id,
      title: t.title,
      deadline: t.deadline || 'No deadline',
      isOverdue,
      dueThisWeek,
      estimatedHours: t.estimatedHours || 1,
      energyRequired: t.energyRequired || 3,
      description: t.description || '',
    };
  });

  // Calculate if this week is already loaded with urgent work
  const urgentHours = taskList
    .filter(t => t.isOverdue || t.dueThisWeek)
    .reduce((sum, t) => sum + Math.min(t.estimatedHours, 9), 0);
  const weekCapacity = 7 * 6; // 6 h/day target × 7 days
  const weekIsLoaded = urgentHours >= weekCapacity * 0.75;

  const langMap = {
    en: 'English',
    es: 'Spanish',
    it: 'Italian'
  };
  const langName = langMap[language] || 'English';

  const prompt = `You are an expert productivity planner. Your job is to produce a realistic, balanced 7-day work schedule.

LANGUAGE: Use ${langName} for all generated text (labels, part names, etc.).
TODAY: ${todayStr}
PLANNING WINDOW: ${weekDatesStr}

═══ TASKS TO SCHEDULE ═══
${JSON.stringify(taskList, null, 2)}

═══ SCHEDULING RULES (follow strictly, in priority order) ═══

RULE 1 — OVERDUE tasks (isOverdue: true):
  • MUST appear on today (${todayStr}) or tomorrow.
  • Highest priority — schedule these before anything else.

RULE 2 — CHUNKING complex tasks:
  • Any task with estimatedHours > 3 MUST be split into chunks of 1.5–3 hours each.
  • HARD CAP: maximum 3 chunks per task — never exceed this, even if hours > 9.
  • If estimatedHours > 9, schedule only 9 hours total across at most 3 blocks.
  • Set "isChunk": true and "chunkLabel" (e.g. "Part 1 of 3" in ${langName}).
  • Spread chunks across different days. Never place two chunks of the same task on the same day or on consecutive days.

RULE 3 — DEFERRABLE tasks (dueThisWeek: false, meaning deadline ≥7 days away):
  • ${weekIsLoaded
    ? `This week is HEAVILY LOADED (urgent tasks fill ≥75% of weekly capacity). DO NOT schedule any task with dueThisWeek: false — omit them entirely from this plan.`
    : `The week has capacity. You MAY include tasks with dueThisWeek: false, but ONLY if the day's total stays under 6 hours. Prefer placing them on lighter days (days 4–7 of the window).`
  }

RULE 4 — DEADLINE compliance:
  • Every task with a specific deadline and dueThisWeek: true MUST be fully scheduled on or before its deadline.
  • Never assign a task block after its deadline date.

RULE 5 — LOAD BALANCE:
  • Target 3–5 hours per day. Absolute cap: 6 hours per day — never exceed this.
  • Spread tasks EVENLY. Do NOT front-load (no clustering on days 1–2).
  • High-energy tasks (energyRequired ≥ 4) → schedule in days 1–4 of the window.
  • Low-energy tasks (energyRequired ≤ 2) → prefer days 4–7.
  • Never place more than 2 high-energy tasks (energyRequired ≥ 4) on the same day.

RULE 6 — COGNITIVE LOAD:
  • Max 3 task blocks per day (chunks each count as one block).
  • Alternate heavy and light tasks within a day when possible — avoid back-to-back high-energy blocks.
  • If total hours allow, leave at least one day with ≤2 hours as a natural buffer.

RULE 7 — OUTPUT FORMAT:
  • Respond with ONLY valid JSON. No markdown, no backticks, no text outside the JSON.
  • Keys must be exact YYYY-MM-DD date strings.
  • Each block: taskId (string), title (string), hours (number), isChunk (boolean), chunkLabel (string, empty "" if not chunked).
  • Days with no tasks → empty array [].

REQUIRED JSON STRUCTURE:
{
${rollingDays.map(d => `  "${d.dateStr}": []`).join(',\n')}
}`;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    const text = result.text.trim();
    
    // Try to extract JSON from the response
    let jsonStr = text;
    
    // Handle potential markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const plan = JSON.parse(jsonStr);

    // Validate structure dynamically based on the 7 rolling days
    const daysKeys = rollingDays.map(d => d.dateStr);
    for (const day of daysKeys) {
      if (!Array.isArray(plan[day])) {
        plan[day] = [];
      }
    }

    return plan;
  } catch (error) {
    if (error.message?.includes('API key')) {
      throw new Error('Invalid API key. Please check your Gemini API key in Settings.');
    }
    if (error instanceof SyntaxError) {
      throw new Error('AI returned invalid format. Please try again.');
    }
    throw new Error(`Planning failed: ${error.message}`);
  }
}

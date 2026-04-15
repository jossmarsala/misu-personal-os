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

  const taskList = activeTasks.map(t => {
    let isOverdue = false;
    if (t.deadline) {
      const dl = new Date(t.deadline);
      dl.setHours(0, 0, 0, 0);
      if (dl < todayDate) isOverdue = true;
    }

    return {
      id: t.id,
      title: t.title,
      deadline: t.deadline || 'No deadline',
      isOverdue,
      estimatedHours: t.estimatedHours || 1,
      energyRequired: t.energyRequired || 3,
      description: t.description || '',
    };
  });

  const langMap = {
    en: 'English',
    es: 'Spanish',
    it: 'Italian'
  };
  const langName = langMap[language] || 'English';

  const prompt = `You are an intelligent weekly task planner. Given the following tasks, create an optimal schedule for the next 7 days.
  
  LANGUAGE: Use ${langName} for any generated content.
  TODAY'S DATE: ${todayStr}

TASKS:
${JSON.stringify(taskList, null, 2)}

NEXT 7 DAYS:
${weekDatesStr}

RULES:
1. ALL TASKS MUST BE SCHEDULED. Do not omit any task.
2. OVERDUE TASKS (isOverdue: true) MUST be scheduled on TODAY or TOMORROW. Disregard their original deadline for placement purposes.
3. For normal tasks, respect deadlines — tasks must be scheduled on or before their deadline.
4. Tasks longer than 3 hours should be split into 1-3 hour chunks.
5. Aim for 4-6 hours per day, but if total task hours force you to exceed this to fit all tasks, that is okay. Balance the load as evenly as possible.
6. Consider energy levels — schedule high-energy tasks earlier in the 7-day period.
7. Output any generated text (like "Part 1 of 2") in ${langName}.

RESPOND WITH ONLY valid JSON in this exact format, using the exact YYYY-MM-DD date strings as keys (no markdown, no backticks, no explanation):
{
${rollingDays.map(d => `  "${d.dateStr}": ${d.dateStr === todayStr ? '[{"taskId": "...", "title": "...", "hours": 2, "isChunk": false, "chunkLabel": ""}]' : '[]'}`).join(',\n')}
}

For chunked tasks, set "isChunk": true and "chunkLabel" to something like "Parte 1 di 2" if Italian, "Parte 1 de 2" if Spanish, etc.
If a day has no tasks, use an empty array.`;

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

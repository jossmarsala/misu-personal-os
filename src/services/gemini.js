/* ═══════════════════════════════════════
   Gemini AI integration for weekly planning
   ═══════════════════════════════════════ */

import { GoogleGenAI } from '@google/genai';
import { getStartOfWeek } from '../utils/dateUtils';

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

  const monday = getStartOfWeek();
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weekDates = weekDays.map((name, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return `${name} (${d.toISOString().split('T')[0]})`;
  });

  const taskList = activeTasks.map(t => ({
    id: t.id,
    title: t.title,
    deadline: t.deadline || 'No deadline',
    estimatedHours: t.estimatedHours || 1,
    energyRequired: t.energyRequired || 3,
    description: t.description || '',
  }));

  const langMap = {
    en: 'English',
    es: 'Spanish',
    it: 'Italian'
  };
  const langName = langMap[language] || 'English';

  const prompt = `You are an intelligent weekly task planner. Given the following tasks, create an optimal weekly schedule.
  
  LANGUAGE: Use ${langName} for any generated content.

TASKS:
${JSON.stringify(taskList, null, 2)}

WEEK: ${weekDates.join(', ')}

RULES:
1. Respect deadlines — tasks must be scheduled before or on their deadline
2. Tasks longer than 3 hours should be split into 1-3 hour chunks
3. Balance workload across the week (avoid overloading any single day)
4. Consider energy levels — schedule high-energy tasks earlier in the week when motivation is typically higher
5. Aim for 4-6 productive hours per weekday, 2-3 hours on weekends
6. Leave buffer time between tasks
7. If a task has no deadline, schedule it in available gaps
8. Output any generated text (like "Part 1 of 2") in ${langName}.

RESPOND WITH ONLY valid JSON in this exact format (no markdown, no backticks, no explanation):
{
  "monday": [{"taskId": "...", "title": "...", "hours": 2, "isChunk": false, "chunkLabel": ""}],
  "tuesday": [],
  "wednesday": [],
  "thursday": [],
  "friday": [],
  "saturday": [],
  "sunday": []
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

    // Validate structure
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (const day of days) {
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

/* ═══════════════════════════════════════
   localStorage persistence + JSON import/export
   ═══════════════════════════════════════ */

const TASKS_KEY = 'misu:tasks';
const SETTINGS_KEY = 'misu:settings';
const ENERGY_KEY = 'misu:energy';
const THEME_KEY = 'misu:theme';

// ─── Tasks ───
export function loadTasks() {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTasks(tasks) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

// ─── Settings ───
export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ─── Energy ───
export function loadEnergy() {
  try {
    const raw = localStorage.getItem(ENERGY_KEY);
    return raw ? parseInt(raw, 10) : 3;
  } catch {
    return 3;
  }
}

export function saveEnergy(level) {
  localStorage.setItem(ENERGY_KEY, String(level));
}

// ─── Theme ───
export function loadTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || 'dark';
  } catch {
    return 'dark';
  }
}

export function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

// ─── Export ───
export function exportToJSON(tasks) {
  const data = {
    version: '1.0',
    app: 'Misu',
    exportedAt: new Date().toISOString(),
    tasks,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `misu-tasks-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Import ───
export function importFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.tasks && Array.isArray(data.tasks)) {
          resolve(data.tasks);
        } else if (Array.isArray(data)) {
          resolve(data);
        } else {
          reject(new Error('Invalid format: expected tasks array'));
        }
      } catch (err) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

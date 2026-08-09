# misu 🤍

A personal operating system that pays attention to how you feel.

Misu isn't just a task manager. It's a quiet little space that adapts to your energy — not the other way around. Instead of pushing you toward a perfect productivity system, it asks a simple question first: *how are you right now?* Then it adjusts everything around that answer.

---

## what it does

When you open Misu, you pick your current capacity. Maybe you're tired and only able to handle small things. Maybe you're in a rare state of deep focus and want to run. Either way, Misu shapes itself around that. The colors shift, the recommendations change, and the background reacts — all to match where you actually are, not where you wish you were.

---

## features

### 🌿 energy-aware interface
Five energy levels — from quiet rest to deep flow — that change the entire app. The color palette, visual rhythm, and task suggestions all adapt to your selection in real time.

### 🌊 dynamic 3d background
A WebGL-powered background (`PrismaticBurst`) that breathes and shifts colors based on your current energy state. It's subtle enough to not distract, alive enough to feel like company.

### 💡 gentle task recommendations
A quiet algorithm that looks at your energy constraints and upcoming deadlines, then surfaces the one task that actually makes sense right now — no overwhelming backlog, no guilt.

### 🤖 ai weekly planner
Integration with Google's Gemini AI to automatically spread your tasks across a balanced seven-day schedule. It thinks about effort, deadlines, and pacing so you don't have to.

### 🎵 ambient music player
An energy-matched music player powered by YouTube, with curated playlists for each energy level. Includes a pixel wave visualizer, volume control, and a track queue you can browse and jump through. When Focus Shield activates, the music gently fades down on its own.

### 🛡️ focus shield
A do-not-disturb mode that dims distractions, mutes music, and generates ambient noise (white, pink, or brown) to help you stay in the zone. It syncs automatically with the Pomodoro timer when a session is running.

### ⏱️ pomodoro timer
A draggable focus timer with 25-minute work sessions, short breaks, and long breaks. Tracks your session count, plays distinct sounds at each transition, and shows a satisfying SVG ring counting down your progress.

### 📅 calendar view
A monthly calendar overview so you can see how your tasks and deadlines land across the weeks ahead.

### ⌘ command palette
Hit `⌘K` (or `Ctrl+K`) to open a spotlight-style command palette. From there you can toggle any widget, switch your energy level, change language, flip between light and dark mode, add tasks instantly, and more — all without lifting your hands from the keyboard.

### 🖱️ draggable widgets
Every widget (music player, pomodoro, focus shield) is freely draggable and remembers where you left it. Arrange your workspace however feels right.

### ☁️ cloud sync
Integrated with Supabase for persistent, cross-device authentication and data storage. Your tasks and settings follow you.

### 🔒 private by design
Everything lives in your own Supabase instance. There's also a local storage fallback if you prefer not to sign in.

### 🌍 multilingual
Available in English, Español, and Italiano.

### 🌙 light & dark mode
A smooth theme toggle that works alongside the energy system — your colors adapt to both your vibe and your preference.

---

## tech stack

- **React 18** & **Vite** — fast, modern frontend
- **Google Gemini SDK** — AI-powered weekly scheduling
- **OGL** — lightweight WebGL for the animated gradient background
- **Framer Motion** — smooth micro-animations throughout
- **YouTube IFrame API** — embedded audio player with no visible player UI
- **Web Audio API** — procedurally generated ambient noise (no files, no latency)
- **Supabase** — auth and cloud data storage
- **cmdk** — command palette foundation
- **Vanilla CSS** & **Lucide Icons**

---

## how it works

You open Misu. You pick how you're feeling — maybe a 🌿 (rest) because your brain is foggy, or a ✨ (flow) because you've got that rare focused energy. The interface shifts around you: colors soften or brighten, the background changes its rhythm, and the task recommendation narrows down from everything on your plate to the one thing that fits where you are.

As you work, you can open the music player to put on something that matches your energy level, start a Pomodoro to give your session structure, and activate the Focus Shield when you really need to lock in. Everything talks to each other — the shield syncs with the timer, the music fades when you go into focus mode, and the weekly planner keeps the bigger picture in order.

---

## setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/misu.git
   cd misu
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local dev server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser.

> **Note:** The AI weekly planner requires a Gemini API key. You can add it from the settings modal inside the app — no `.env` file needed.

---

## future ideas

- drag-and-drop manual reordering for the AI planner
- nested subtasks for larger projects
- recurring tasks and habits
- integration with native calendar apps 🫧
- mobile app (the web version is already responsive, but a dedicated app would be nice)

---

take care of your energy. 🤍

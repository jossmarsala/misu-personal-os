# misu 🤍

A task manager that pays attention to how you feel. 

Instead of forcing you to push through exhaustion, Misu asks for your current energy level and adapts its interface, suggestions, and schedule to match your state of mind. It's a quiet attempt at reducing friction between human limits and the work we need to do.

## features

* **energy-aware interface.** five distinct energy levels—from quiet rest (🌿) to deep focus (✨). The entire application's color palette and visual rhythm shifts to match your selection.
* **dynamic 3d backgrounds.** a subtle, WebGL-powered background (`PrismaticBurst`) that flows and changes colors according to your current energy state.
* **gentle recommendations.** a quiet algorithm that suggests an appropriate task based on your energy constraints and impending deadlines, rather than overwhelming you with a massive backlog.
* **ai weekly planner.** integration with Google's Gemini AI to automatically organize and chunk your active tasks across a balanced, seven-day schedule. 
* **cloud-sync ready.** now integrated with Supabase for persistent, cross-device authentication and data storage. [Last Update: 2026-04-13]
* **private by design.** everything is kept securely in your own Supabase instance or local storage fallback.

## tech stack

* React 18 & Vite
* Google Gemini SDK (for scheduling logic)
* OGL (for lightweight, 3D animated gradients)
* Vanilla CSS & Lucide Icons

## how it works

When you open Misu, you select your current capacity—maybe you're feeling sluggish, or maybe you're highly focused. The UI colors soften or brighten accordingly. As you add tasks with effort estimations and energy requirements, Misu groups them and tells you exactly what corresponds to your current mood, effectively removing the decision fatigue of figuring out *"what do I do next?"*

## setup

1. clone the repository:
   ```bash
   git clone https://github.com/yourusername/misu.git
   cd misu
   ```
2. install the dependencies:
   ```bash
   npm install
   ```
3. start the local server:
   ```bash
   npm run dev
   ```
4. the project will run on `http://localhost:5173`. 

*Note: for the AI weekly planner to function, you'll need to provide your own Gemini API key via the settings modal inside the app.*

## future ideas

* drag-and-drop manual reordering for the planner
* nested subtasks for larger projects
* integration with native calendar apps 🫧

---

take care of your energy.

import { useSyncExternalStore } from "react";
import {
  shiftKey,
  type Habit,
  type HabitColor,
  type Priority,
  type Todo,
  type TrackerState,
} from "./habit-stats";

const STORAGE_KEY = "dayglow-tracker-v2";
let state: TrackerState | null = null;
const listeners = new Set<() => void>();

const uid = () => Math.random().toString(36).slice(2, 10);

/** Tracking begins on this day; every earlier day stays empty (nothing done). */
export const TRACKING_START = "2026-11-12";

/** Starting state: the sample habits begin on TRACKING_START with no history before it. */
export function createDemoState(): TrackerState {
  const habits: Habit[] = [
    { id: "h-water", name: "Drink 4L of water", emoji: "💧", color: "sky", createdAt: TRACKING_START },
    { id: "h-meditate", name: "Meditate 10 min", emoji: "🧘", color: "lime", createdAt: TRACKING_START },
    { id: "h-read", name: "Read 20 pages", emoji: "📚", color: "amber", createdAt: TRACKING_START },
    { id: "h-move", name: "Workout 1 hr", emoji: "🏃", color: "coral", createdAt: TRACKING_START },
    { id: "h-sleep", name: "Sleep before 11pm", emoji: "🌙", color: "rose", createdAt: TRACKING_START },
  ];
  return { habits, completions: {}, todos: {} };
}

/** Label updates applied to trackers already saved in the browser. */
const RENAMES: Record<string, string> = {
  "drink 2l of water": "Drink 4L of water",
  "move for 30 min": "Workout 1 hr",
};

/** Renames habits whose saved label is outdated; returns the same object if none changed. */
export function applyRenames(s: TrackerState): TrackerState {
  let changed = false;
  const habits = s.habits.map((h) => {
    const next = RENAMES[h.name.trim().toLowerCase()];
    if (!next || next === h.name) return h;
    changed = true;
    return { ...h, name: next };
  });
  return changed ? { ...s, habits } : s;
}

function load(): TrackerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = applyRenames(JSON.parse(raw) as TrackerState);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      return saved;
    }
  } catch {
    /* fall through to demo data */
  }
  const demo = createDemoState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
  return demo;
}

function getSnapshot() {
  if (!state) state = load();
  return state;
}
const getServerSnapshot = () => null;

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function update(fn: (s: TrackerState) => TrackerState) {
  state = fn(getSnapshot());
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

/** null during SSR / first hydration pass, then the saved tracker state. */
export function useTracker() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const setTodos = (s: TrackerState, key: string, fn: (t: Todo[]) => Todo[]): TrackerState => ({
  ...s,
  todos: { ...s.todos, [key]: fn(s.todos[key] ?? []) },
});

export const tracker = {
  toggleHabit(key: string, habitId: string) {
    update((s) => {
      const cur = s.completions[key] ?? [];
      const next = cur.includes(habitId) ? cur.filter((id) => id !== habitId) : [...cur, habitId];
      return { ...s, completions: { ...s.completions, [key]: next } };
    });
  },
  addHabit(name: string, emoji: string, color: HabitColor, createdAt: string) {
    update((s) => ({ ...s, habits: [...s.habits, { id: uid(), name, emoji, color, createdAt }] }));
  },
  removeHabit(habitId: string) {
    update((s) => ({
      ...s,
      habits: s.habits.filter((h) => h.id !== habitId),
      completions: Object.fromEntries(
        Object.entries(s.completions).map(([k, ids]) => [k, ids.filter((id) => id !== habitId)]),
      ),
    }));
  },
  addTodo(key: string, text: string, priority: Priority) {
    update((s) => setTodos(s, key, (t) => [...t, { id: uid(), text, done: false, priority }]));
  },
  toggleTodo(key: string, id: string) {
    update((s) => setTodos(s, key, (t) => t.map((x) => (x.id === id ? { ...x, done: !x.done } : x))));
  },
  removeTodo(key: string, id: string) {
    update((s) => setTodos(s, key, (t) => t.filter((x) => x.id !== id)));
  },
  moveTodoToNextDay(key: string, id: string) {
    update((s) => {
      const todo = (s.todos[key] ?? []).find((x) => x.id === id);
      if (!todo) return s;
      const removed = setTodos(s, key, (t) => t.filter((x) => x.id !== id));
      return setTodos(removed, shiftKey(key, 1), (t) => [...t, { ...todo, done: false }]);
    });
  },
  resetDemo() {
    update(() => createDemoState());
  },
  startFresh() {
    update(() => ({ habits: [], completions: {}, todos: {} }));
  },
};

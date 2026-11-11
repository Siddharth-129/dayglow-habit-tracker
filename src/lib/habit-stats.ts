import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";

export type HabitColor = "lime" | "coral" | "sky" | "amber" | "rose";
export type Priority = "low" | "med" | "high";

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: HabitColor;
  /** First day (yyyy-MM-dd) the habit counts toward progress. */
  createdAt: string;
}

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  priority: Priority;
}

export interface TrackerState {
  habits: Habit[];
  /** dayKey -> ids of habits completed that day */
  completions: Record<string, string[]>;
  /** dayKey -> todos planned for that day */
  todos: Record<string, Todo[]>;
}

export const toKey = (d: Date) => format(d, "yyyy-MM-dd");
export const fromKey = (k: string) => parseISO(k);
export const shiftKey = (k: string, days: number) => toKey(addDays(fromKey(k), days));

const pct = (done: number, total: number) => (total ? Math.round((done / total) * 100) : 0);

export function habitsActiveOn(state: TrackerState, key: string) {
  return state.habits.filter((h) => h.createdAt <= key);
}

export function isHabitDone(state: TrackerState, habitId: string, key: string) {
  return (state.completions[key] ?? []).includes(habitId);
}

export interface DayProgress {
  habitsDone: number;
  habitsTotal: number;
  todosDone: number;
  todosTotal: number;
  habitsPct: number;
  todosPct: number;
  overall: number;
}

export function dayProgress(state: TrackerState, key: string): DayProgress {
  const active = habitsActiveOn(state, key);
  const done = state.completions[key] ?? [];
  const habitsDone = active.filter((h) => done.includes(h.id)).length;
  const todos = state.todos[key] ?? [];
  const todosDone = todos.filter((t) => t.done).length;
  return {
    habitsDone,
    habitsTotal: active.length,
    todosDone,
    todosTotal: todos.length,
    habitsPct: pct(habitsDone, active.length),
    todosPct: pct(todosDone, todos.length),
    overall: pct(habitsDone + todosDone, active.length + todos.length),
  };
}

export interface MonthPoint {
  key: string;
  day: number;
  label: string;
  future: boolean;
  overall: number | null;
  habits: number | null;
  todos: number | null;
}

export function monthDays(anyKeyInMonth: string) {
  const d = fromKey(anyKeyInMonth);
  return eachDayOfInterval({ start: startOfMonth(d), end: endOfMonth(d) }).map(toKey);
}

/** Per-day progress for the month; days after `todayKey` get null values (gaps in charts). */
export function monthSeries(state: TrackerState, anyKeyInMonth: string, todayKey: string): MonthPoint[] {
  return monthDays(anyKeyInMonth).map((key) => {
    const future = key > todayKey;
    const p = dayProgress(state, key);
    return {
      key,
      day: fromKey(key).getDate(),
      label: format(fromKey(key), "EEE, MMM d"),
      future,
      overall: future ? null : p.overall,
      habits: future ? null : p.habitsPct,
      todos: future ? null : p.todosTotal ? p.todosPct : null,
    };
  });
}

export interface HabitRate {
  habit: Habit;
  done: number;
  eligible: number;
  rate: number;
}

/** Completion rate per habit this month, counting only days the habit existed, up to today. */
export function habitMonthlyRates(state: TrackerState, anyKeyInMonth: string, todayKey: string): HabitRate[] {
  const days = monthDays(anyKeyInMonth).filter((k) => k <= todayKey);
  return state.habits.map((habit) => {
    const eligibleDays = days.filter((k) => k >= habit.createdAt);
    const done = eligibleDays.filter((k) => isHabitDone(state, habit.id, k)).length;
    return { habit, done, eligible: eligibleDays.length, rate: pct(done, eligibleDays.length) };
  });
}

/**
 * Consecutive completed days ending at `key`. If `key` itself isn't done yet,
 * the streak is still alive from the day before.
 */
export function habitStreak(state: TrackerState, habitId: string, key: string) {
  let cursor = isHabitDone(state, habitId, key) ? key : shiftKey(key, -1);
  let streak = 0;
  while (isHabitDone(state, habitId, cursor)) {
    streak++;
    cursor = shiftKey(cursor, -1);
  }
  return streak;
}

export function perfectDays(state: TrackerState, anyKeyInMonth: string, todayKey: string) {
  return monthDays(anyKeyInMonth).filter((k) => {
    if (k > todayKey) return false;
    const p = dayProgress(state, k);
    return p.habitsTotal + p.todosTotal > 0 && p.overall === 100;
  }).length;
}

export function todosCompletedInMonth(state: TrackerState, anyKeyInMonth: string) {
  return monthDays(anyKeyInMonth).reduce(
    (sum, k) => sum + (state.todos[k] ?? []).filter((t) => t.done).length,
    0,
  );
}

export function weekKeys(key: string) {
  const start = startOfWeek(fromKey(key), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => toKey(addDays(start, i)));
}

export function lastNDays(key: string, n: number) {
  return Array.from({ length: n }, (_, i) => toKey(subDays(fromKey(key), n - 1 - i)));
}

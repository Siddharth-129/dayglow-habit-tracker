import { describe, expect, it } from "vitest";
import {
  dayProgress,
  habitMonthlyRates,
  habitStreak,
  monthSeries,
  perfectDays,
  type TrackerState,
} from "./habit-stats";

const base = (): TrackerState => ({
  habits: [
    { id: "a", name: "Water", emoji: "💧", color: "sky", createdAt: "2026-11-01" },
    { id: "b", name: "Read", emoji: "📚", color: "amber", createdAt: "2026-11-01" },
    { id: "c", name: "Late", emoji: "🌙", color: "rose", createdAt: "2026-11-10" },
  ],
  completions: {},
  todos: {},
});

describe("dayProgress", () => {
  it("combines habits and todos into one overall score", () => {
    const s = base();
    s.completions["2026-11-11"] = ["a", "b"];
    s.todos["2026-11-11"] = [
      { id: "t1", text: "x", done: true, priority: "low" },
      { id: "t2", text: "y", done: false, priority: "low" },
    ];
    const p = dayProgress(s, "2026-11-11");
    expect(p.habitsPct).toBe(67); // 2 of 3 habits
    expect(p.todosPct).toBe(50);
    expect(p.overall).toBe(60); // 3 of 5 items
  });

  it("ignores habits that did not exist yet on that day", () => {
    const s = base();
    s.completions["2026-11-05"] = ["a", "b"];
    expect(dayProgress(s, "2026-11-05").habitsTotal).toBe(2);
    expect(dayProgress(s, "2026-11-05").overall).toBe(100);
  });
});

describe("habitStreak", () => {
  it("keeps the streak alive when today is not checked yet", () => {
    const s = base();
    s.completions["2026-11-08"] = ["a"];
    s.completions["2026-11-09"] = ["a"];
    s.completions["2026-11-10"] = ["a"];
    expect(habitStreak(s, "a", "2026-11-11")).toBe(3);
    s.completions["2026-11-11"] = ["a"];
    expect(habitStreak(s, "a", "2026-11-11")).toBe(4);
  });

  it("breaks on a missed day", () => {
    const s = base();
    s.completions["2026-11-08"] = ["a"];
    s.completions["2026-11-10"] = ["a"];
    expect(habitStreak(s, "a", "2026-11-10")).toBe(1);
  });
});

describe("monthly stats", () => {
  it("leaves future days empty in the monthly chart", () => {
    const series = monthSeries(base(), "2026-11-11", "2026-11-11");
    expect(series).toHaveLength(30);
    expect(series[10]?.overall).not.toBeNull();
    expect(series[11]?.overall).toBeNull();
  });

  it("rates a habit only over days it existed, up to today", () => {
    const s = base();
    s.completions["2026-11-10"] = ["c"];
    const c = habitMonthlyRates(s, "2026-11-11", "2026-11-11").find((r) => r.habit.id === "c")!;
    expect(c.eligible).toBe(2);
    expect(c.rate).toBe(50);
  });

  it("counts a perfect day only when everything is done", () => {
    const s = base();
    s.completions["2026-11-03"] = ["a", "b"];
    s.completions["2026-11-04"] = ["a"];
    expect(perfectDays(s, "2026-11-11", "2026-11-11")).toBe(1);
  });
});

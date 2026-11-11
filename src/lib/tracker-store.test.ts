import { describe, expect, it } from "vitest";
import { dayProgress, type TrackerState } from "./habit-stats";
import { TRACKING_START, applyRenames, createDemoState } from "./tracker-store";

describe("starting state", () => {
  it("starts tracking on Nov 12, 2026", () => {
    expect(TRACKING_START).toBe("2026-11-12");
    expect(createDemoState().habits.every((h) => h.createdAt === "2026-11-12")).toBe(true);
  });

  it("has nothing done on any day before the start", () => {
    const s = createDemoState();
    expect(Object.keys(s.completions)).toHaveLength(0);
    expect(Object.keys(s.todos)).toHaveLength(0);
    const before = dayProgress(s, "2026-11-11");
    expect(before.habitsTotal + before.todosTotal).toBe(0);
    expect(dayProgress(s, "2026-11-12").habitsDone).toBe(0);
  });

  it("lists the water and workout habits the user asked for", () => {
    const names = createDemoState().habits.map((h) => h.name);
    expect(names).toContain("Drink 4L of water");
    expect(names).toContain("Workout 1 hr");
    expect(names).not.toContain("Drink 2L of water");
    expect(names).not.toContain("Move for 30 min");
  });
});

describe("applyRenames", () => {
  it("renames habits in a tracker already saved in the browser", () => {
    const saved: TrackerState = {
      habits: [
        { id: "h-water", name: "Drink 2L of water", emoji: "💧", color: "sky", createdAt: TRACKING_START },
        { id: "h-move", name: "Move for 30 min", emoji: "🏃", color: "coral", createdAt: TRACKING_START },
      ],
      completions: { "2026-11-12": ["h-water"] },
      todos: {},
    };
    const migrated = applyRenames(saved);
    expect(migrated.habits.map((h) => h.name)).toEqual(["Drink 4L of water", "Workout 1 hr"]);
    expect(migrated.completions).toEqual({ "2026-11-12": ["h-water"] });
    expect(applyRenames(migrated)).toBe(migrated);
  });
});

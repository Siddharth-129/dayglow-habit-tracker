import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Flame, ListChecks, RotateCcw, Sparkles, Trophy, Eraser } from "lucide-react";
import { toast } from "sonner";
import {
  dayProgress,
  habitStreak,
  perfectDays,
  todosCompletedInMonth,
  toKey,
  type TrackerState,
} from "@/lib/habit-stats";
import { TRACKING_START, tracker, useTracker } from "@/lib/tracker-store";
import { Background } from "@/components/tracker/Background";
import { Confetti } from "@/components/tracker/Confetti";
import { DayNavigator } from "@/components/tracker/DayNavigator";
import { ProgressRings } from "@/components/tracker/ProgressRings";
import { StatStrip, type Stat } from "@/components/tracker/StatStrip";
import { HabitList } from "@/components/tracker/HabitList";
import { TodoList } from "@/components/tracker/TodoList";
import { HabitBreakdown, HabitMatrix, MonthHeatmap, MonthlyChart, WeekChart } from "@/components/tracker/charts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dayglow — Habit tracker, todos & monthly progress" },
      {
        name: "description",
        content: "Track daily habits and todos, flip between days, and watch your monthly progress glow with live charts.",
      },
      { property: "og:title", content: "Dayglow — Habit tracker, todos & monthly progress" },
      {
        property: "og:description",
        content: "Daily habits, todos, streaks and beautiful monthly charts in one glowing dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const state = useTracker();
  return (
    <div className="relative min-h-screen">
      <Background />
      {state ? <Dashboard state={state} /> : <Loading />}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-14 w-14 animate-spin rounded-full border-4 border-muted border-t-primary" />
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <span className="relative flex h-11 w-11 items-center justify-center">
        <span className="animate-spin-slow absolute inset-0 rounded-2xl bg-[image:var(--gradient-hero)] opacity-90 blur-[2px]" />
        <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-background">
          <Sparkles className="h-5 w-5 text-primary" />
        </span>
      </span>
      <div>
        <p className="font-display text-xl font-bold leading-none tracking-tight">Dayglow</p>
        <p className="text-xs text-muted-foreground">habits · todos · progress</p>
      </div>
    </div>
  );
}

function Dashboard({ state }: { state: TrackerState }) {
  const today = useMemo(() => toKey(new Date()), []);
  const [selected, setSelected] = useState(() => (today < TRACKING_START ? TRACKING_START : today));
  const [direction, setDirection] = useState(1);
  const [fire, setFire] = useState(0);
  const progress = dayProgress(state, selected);

  const select = (key: string) => {
    setDirection(key >= selected ? 1 : -1);
    setSelected(key);
  };

  // Arrow keys travel between days (ignored while typing).
  const selectRef = useRef(select);
  selectRef.current = select;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea")) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const d = new Date(selectedRef.current + "T00:00:00");
      d.setDate(d.getDate() + (e.key === "ArrowRight" ? 1 : -1));
      selectRef.current(toKey(d));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Confetti when the selected day reaches 100% through the user's own action.
  const last = useRef({ key: selected, pct: progress.overall });
  useEffect(() => {
    const prev = last.current;
    if (prev.key === selected && prev.pct < 100 && progress.overall === 100) {
      setFire((f) => f + 1);
      toast.success("Perfect day! Everything is glowing ✨");
    }
    last.current = { key: selected, pct: progress.overall };
  }, [selected, progress.overall]);

  const bestStreak = Math.max(0, ...state.habits.map((h) => habitStreak(state, h.id, today)));
  const stats: Stat[] = [
    { label: "Day score", value: progress.overall, suffix: "%", hint: "habits + todos combined", icon: Sparkles, tone: "lime" },
    { label: "Best streak", value: bestStreak, suffix: "d", hint: "longest active habit run", icon: Flame, tone: "amber" },
    { label: "Perfect days", value: perfectDays(state, selected, today), hint: "100% days this month", icon: Trophy, tone: "sky" },
    { label: "Todos crushed", value: todosCompletedInMonth(state, selected), hint: "completed this month", icon: ListChecks, tone: "coral" },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:py-10">
      <Confetti fire={fire} />
      <header className="animate-rise flex flex-wrap items-center justify-between gap-4">
        <Logo />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="hidden items-center gap-1 sm:flex">
            <kbd className="rounded-md border bg-muted px-1.5 py-0.5 font-mono">←</kbd>
            <kbd className="rounded-md border bg-muted px-1.5 py-0.5 font-mono">→</kbd>
            travel days
          </span>
          <button
            onClick={() => {
              tracker.resetDemo();
              toast("Tracker reset — starts Nov 12");
            }}
            className="flex items-center gap-1.5 rounded-xl border bg-muted/50 px-3 py-2 transition hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
          <button
            onClick={() => {
              if (confirm("Clear all habits and todos?")) tracker.startFresh();
            }}
            className="flex items-center gap-1.5 rounded-xl border bg-muted/50 px-3 py-2 transition hover:bg-muted hover:text-foreground"
          >
            <Eraser className="h-3.5 w-3.5" /> Start fresh
          </button>
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <DayNavigator state={state} selected={selected} today={today} direction={direction} onSelect={select} />
        <ProgressRings progress={progress} delay={100} />
      </section>

      <StatStrip stats={stats} />

      <section className="grid gap-5 lg:grid-cols-[7fr_5fr]">
        <HabitList state={state} dayKey={selected} today={today} />
        <TodoList state={state} dayKey={selected} />
      </section>

      <MonthlyChart state={state} dayKey={selected} today={today} onSelect={select} />

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <HabitBreakdown state={state} dayKey={selected} today={today} />
        <MonthHeatmap state={state} dayKey={selected} today={today} onSelect={select} />
        <WeekChart state={state} dayKey={selected} today={today} />
      </section>

      <HabitMatrix state={state} dayKey={selected} today={today} />

      <footer className="pb-4 pt-6 text-center text-xs text-muted-foreground">
        Saved in this browser · keep glowing, one day at a time.
      </footer>
    </main>
  );
}

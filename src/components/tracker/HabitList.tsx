import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Flame, Lock, Plus, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import {
  dayProgress,
  fromKey,
  habitStreak,
  habitsActiveOn,
  isHabitDone,
  lastNDays,
  type HabitColor,
  type TrackerState,
} from "@/lib/habit-stats";
import { tracker } from "@/lib/tracker-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Burst, CardTitle, GlowCard, hue } from "./primitives";

const EMOJIS = ["💧", "🧘", "📚", "🏃", "🌙", "🥗", "✍️", "🎸", "🌱", "💪", "🧠", "☀️"];
const COLORS: HabitColor[] = ["lime", "sky", "amber", "coral", "rose"];

function AddHabit({ dayKey, onDone }: { dayKey: string; onDone: () => void }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState<string>("✍️");
  const [color, setColor] = useState<HabitColor>("lime");
  const submit = () => {
    if (!name.trim()) return;
    tracker.addHabit(name.trim(), emoji, color, dayKey);
    onDone();
  };
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden"
    >
      <div className="mb-4 space-y-3 rounded-2xl border bg-muted/40 p-4" style={hue(color)}>
        <div className="flex gap-2">
          <span className="habit-tint flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl">{emoji}</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="e.g. Journal 5 minutes"
            className="h-11 flex-1 rounded-xl border bg-background/60 px-3 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={cn(
                "h-9 w-9 rounded-lg text-lg transition hover:scale-110",
                emoji === e ? "habit-tint ring-1 ring-current" : "bg-background/40",
              )}
            >
              {e}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={hue(c)}
                aria-label={c}
                className={cn(
                  "habit-fill h-7 w-7 rounded-full transition",
                  color === c ? "habit-glow scale-110 ring-2 ring-foreground/70 ring-offset-2 ring-offset-background" : "opacity-60 hover:opacity-100",
                )}
              />
            ))}
          </div>
          <button
            onClick={submit}
            className="habit-fill rounded-xl px-4 py-2 text-sm font-bold transition hover:brightness-110 disabled:opacity-40"
            disabled={!name.trim()}
          >
            Add habit
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function HabitList({ state, dayKey, today }: { state: TrackerState; dayKey: string; today: string }) {
  const [adding, setAdding] = useState(false);
  const [burstId, setBurstId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const habits = habitsActiveOn(state, dayKey);
  const p = dayProgress(state, dayKey);
  const future = dayKey > today;
  const week = lastNDays(dayKey, 7);
  const upcoming = state.habits.map((h) => h.createdAt).filter((k) => k > dayKey).sort()[0];

  return (
    <GlowCard delay={250} className="h-full">
      <CardTitle
        eyebrow="Daily rituals"
        title={
          <>
            Habits <span className="text-muted-foreground">· {p.habitsDone}/{p.habitsTotal}</span>
          </>
        }
        right={
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => setAdding((a) => !a)}
            aria-expanded={adding}
            className={cn(
              "flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-sm font-bold transition",
              adding
                ? "border bg-muted/60 hover:bg-muted"
                : "bg-primary text-primary-foreground glow-primary hover:brightness-110",
            )}
          >
            {adding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {adding ? "Close" : "New habit"}
          </motion.button>
        }
      />

      <AnimatePresence>{adding && <AddHabit dayKey={dayKey} onDone={() => setAdding(false)} />}</AnimatePresence>

      {future && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" /> Habits unlock when this day arrives — plan your todos meanwhile.
        </div>
      )}

      <ul className="space-y-2.5">
        <AnimatePresence initial={false}>
          {habits.map((h, i) => {
            const done = isHabitDone(state, h.id, dayKey);
            const streak = habitStreak(state, h.id, dayKey);
            return (
              <motion.li
                key={h.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0, transition: { delay: i * 0.04 } }}
                exit={{ opacity: 0, x: 40, height: 0 }}
                style={{ ["--hc" as string]: `var(--${h.color})` }}
                className="group relative overflow-hidden rounded-2xl border bg-muted/30"
              >
                <motion.span
                  className="habit-tint absolute inset-0 origin-left"
                  initial={false}
                  animate={{ scaleX: done ? 1 : 0 }}
                  transition={{ type: "spring", stiffness: 140, damping: 22 }}
                />
                <div className="relative flex items-center gap-3 p-3">
                  <span className="habit-tint flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                    {h.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate font-semibold transition-colors", done && "text-foreground")}>{h.name}</p>
                    <div className="mt-1 flex items-center gap-3">
                      <div className="flex gap-1">
                        {week.map((k) => (
                          <span
                            key={k}
                            title={k}
                            className={cn(
                              "h-1.5 w-3.5 rounded-full transition-colors",
                              k < h.createdAt ? "bg-transparent" : isHabitDone(state, h.id, k) ? "habit-fill" : "bg-muted",
                            )}
                          />
                        ))}
                      </div>
                      {streak > 0 && (
                        <span className="flex items-center gap-0.5 font-mono text-[11px] text-amber">
                          <Flame className="h-3 w-3" />
                          {streak}d
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setConfirmId(h.id)}
                    className="rounded-lg p-2 text-muted-foreground/70 transition hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Delete ${h.name}`}
                    title="Delete habit"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    whileHover={{ scale: future ? 1 : 1.06 }}
                    disabled={future}
                    onClick={() => {
                      if (!done) setBurstId(`${h.id}-${Date.now()}`);
                      tracker.toggleHabit(dayKey, h.id);
                    }}
                    aria-label={done ? `Mark ${h.name} not done` : `Mark ${h.name} done`}
                    aria-pressed={done}
                    className={cn(
                      "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-colors disabled:cursor-not-allowed disabled:opacity-30",
                      done ? "habit-fill habit-glow border-transparent" : "border-current/30 text-muted-foreground hover:border-current",
                    )}
                  >
                    <AnimatePresence>
                      {done && (
                        <motion.span
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 18 }}
                        >
                          <Check className="h-5 w-5" strokeWidth={3} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {burstId?.startsWith(h.id) && <Burst key={burstId} />}
                  </motion.button>
                </div>

                <AnimatePresence>
                  {confirmId === h.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-10 flex items-center justify-between gap-3 rounded-2xl bg-background/95 px-4 backdrop-blur-sm"
                    >
                      <p className="min-w-0 truncate text-sm font-semibold">
                        Delete <span className="text-destructive">{h.name}</span>?
                      </p>
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => setConfirmId(null)}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted"
                        >
                          Keep
                        </button>
                        <button
                          onClick={() => {
                            tracker.removeHabit(h.id);
                            setConfirmId(null);
                            toast(`Deleted "${h.name}"`, { description: "Its history is gone too." });
                          }}
                          className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-bold text-destructive-foreground transition hover:brightness-110"
                        >
                          Delete habit
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {!habits.length && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-10 text-center">
          <span className="animate-float text-4xl">🌱</span>
          {upcoming ? (
            <>
              <p className="font-semibold">Tracking starts {format(fromKey(upcoming), "MMMM d")}</p>
              <p className="text-sm text-muted-foreground">Nothing to check off before then.</p>
            </>
          ) : (
            <>
              <p className="font-semibold">No habits yet</p>
              <p className="text-sm text-muted-foreground">Plant your first ritual with "New habit".</p>
            </>
          )}
        </div>
      )}
    </GlowCard>
  );
}

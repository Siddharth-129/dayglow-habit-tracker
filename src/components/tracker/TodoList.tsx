import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRightToLine, Check, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { dayProgress, type Priority, type TrackerState } from "@/lib/habit-stats";
import { tracker } from "@/lib/tracker-store";
import { cn } from "@/lib/utils";
import { CardTitle, GlowCard } from "./primitives";

const PRIORITY: Record<Priority, { label: string; color: string }> = {
  high: { label: "High", color: "coral" },
  med: { label: "Med", color: "amber" },
  low: { label: "Low", color: "sky" },
};
const ORDER: Record<Priority, number> = { high: 0, med: 1, low: 2 };

export function TodoList({ state, dayKey }: { state: TrackerState; dayKey: string }) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<Priority>("med");
  const todos = [...(state.todos[dayKey] ?? [])].sort(
    (a, b) => Number(a.done) - Number(b.done) || ORDER[a.priority] - ORDER[b.priority],
  );
  const p = dayProgress(state, dayKey);

  const add = () => {
    if (!text.trim()) return;
    tracker.addTodo(dayKey, text.trim(), priority);
    setText("");
  };

  return (
    <GlowCard delay={320} className="flex h-full flex-col">
      <CardTitle
        eyebrow="Get it done"
        title={
          <>
            Todos <span className="text-muted-foreground">· {p.todosDone}/{p.todosTotal}</span>
          </>
        }
        right={<span className="font-display text-2xl font-bold text-coral">{p.todosPct}%</span>}
      />
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-coral"
          initial={false}
          animate={{ width: `${p.todosPct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Add a task and press Enter…"
            className="h-11 min-w-0 flex-1 rounded-xl border bg-background/50 px-3 text-sm outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/30"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={add}
            disabled={!text.trim()}
            aria-label="Add todo"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground transition hover:brightness-110 disabled:opacity-40"
          >
            <Plus className="h-5 w-5" />
          </motion.button>
        </div>
        <div className="flex gap-1.5">
          {(Object.keys(PRIORITY) as Priority[]).map((k) => (
            <button
              key={k}
              onClick={() => setPriority(k)}
              style={{ ["--hc" as string]: `var(--${PRIORITY[k].color})` }}
              className={cn(
                "rounded-lg px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition",
                priority === k ? "habit-tint ring-1 ring-current" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {PRIORITY[k].label}
            </button>
          ))}
        </div>
      </div>

      <ul className="flex-1 space-y-2">
        <AnimatePresence initial={false}>
          {todos.map((t) => (
            <motion.li
              key={t.id}
              layout
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              style={{ ["--hc" as string]: `var(--${PRIORITY[t.priority].color})` }}
              className={cn("group flex items-center gap-3 rounded-xl border bg-muted/30 px-3 py-2.5", t.done && "opacity-60")}
            >
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => tracker.toggleTodo(dayKey, t.id)}
                aria-label={t.done ? "Mark not done" : "Mark done"}
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors",
                  t.done ? "border-transparent bg-accent text-accent-foreground" : "border-muted-foreground/40 hover:border-accent",
                )}
              >
                {t.done && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 600, damping: 15 }}>
                    <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
                  </motion.span>
                )}
              </motion.button>
              <span className="relative min-w-0 flex-1 truncate text-sm">
                {t.text}
                <motion.span
                  className="absolute left-0 top-1/2 h-px w-full origin-left bg-foreground/70"
                  initial={false}
                  animate={{ scaleX: t.done ? 1 : 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                />
              </span>
              <span className="habit-fill h-2 w-2 shrink-0 rounded-full" title={`${PRIORITY[t.priority].label} priority`} />
              <div className="flex opacity-0 transition group-hover:opacity-100">
                {!t.done && (
                  <button
                    onClick={() => {
                      tracker.moveTodoToNextDay(dayKey, t.id);
                      toast("Pushed to the next day", { description: t.text });
                    }}
                    className="rounded-lg p-1.5 text-muted-foreground transition hover:text-sky"
                    aria-label="Move to next day"
                    title="Move to next day"
                  >
                    <ArrowRightToLine className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => tracker.removeTodo(dayKey, t.id)}
                  className="rounded-lg p-1.5 text-muted-foreground transition hover:text-destructive"
                  aria-label="Delete todo"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {!todos.length && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed py-10 text-center">
          <span className="animate-float text-4xl">✨</span>
          <p className="font-semibold">A clean slate</p>
          <p className="text-sm text-muted-foreground">Nothing planned for this day yet.</p>
        </div>
      )}
    </GlowCard>
  );
}

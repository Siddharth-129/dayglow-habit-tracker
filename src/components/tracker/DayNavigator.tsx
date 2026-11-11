import { differenceInCalendarDays, format } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, CalendarCheck } from "lucide-react";
import { dayProgress, fromKey, shiftKey, weekKeys, type TrackerState } from "@/lib/habit-stats";
import { cn } from "@/lib/utils";
import { GlowCard } from "./primitives";

function relativeLabel(key: string, today: string) {
  const diff = differenceInCalendarDays(fromKey(key), fromKey(today));
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return diff > 0 ? `In ${diff} days` : `${-diff} days ago`;
}

export function DayNavigator({
  state,
  selected,
  today,
  direction,
  onSelect,
}: {
  state: TrackerState;
  selected: string;
  today: string;
  direction: number;
  onSelect: (key: string) => void;
}) {
  const date = fromKey(selected);
  const week = weekKeys(selected);

  return (
    <GlowCard className="flex flex-col justify-between gap-6 overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em]",
              selected === today ? "bg-primary text-primary-foreground glow-primary" : "bg-muted text-muted-foreground",
            )}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
            </span>
            {relativeLabel(selected, today)}
          </span>
          <div className="relative mt-3 h-[4.2rem] overflow-hidden sm:h-[5.4rem]">
            <AnimatePresence mode="popLayout" initial={false} custom={direction}>
              <motion.h1
                key={selected}
                custom={direction}
                initial={{ y: direction >= 0 ? 60 : -60, opacity: 0, filter: "blur(8px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ y: direction >= 0 ? -60 : 60, opacity: 0, filter: "blur(8px)" }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
                className="text-gradient font-display text-6xl font-extrabold leading-none tracking-tighter sm:text-7xl"
              >
                {format(date, "EEEE")}
              </motion.h1>
            </AnimatePresence>
          </div>
          <p className="text-lg text-muted-foreground">{format(date, "MMMM d, yyyy")}</p>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ x: -2 }}
            onClick={() => onSelect(shiftKey(selected, -1))}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-muted/60 transition-colors hover:bg-muted"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-5 w-5" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => onSelect(today)}
            disabled={selected === today}
            className="flex h-12 items-center gap-2 rounded-2xl border bg-muted/60 px-4 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-40"
          >
            <CalendarCheck className="h-4 w-4" /> Today
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ x: 2 }}
            onClick={() => onSelect(shiftKey(selected, 1))}
            className="glow-primary flex h-12 items-center gap-1 rounded-2xl bg-primary pl-4 pr-3 text-sm font-bold text-primary-foreground"
            aria-label="Next day"
          >
            Next day <ChevronRight className="h-5 w-5" />
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {week.map((key) => {
          const p = dayProgress(state, key);
          const active = key === selected;
          const future = key > today;
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className="group relative flex flex-col items-center gap-1 rounded-2xl px-1 py-3 transition-colors hover:bg-muted/50"
            >
              {active && (
                <motion.span
                  layoutId="day-pill"
                  className="absolute inset-0 rounded-2xl border border-primary/40 bg-primary/10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {format(fromKey(key), "EEE")}
              </span>
              <span className={cn("relative font-display text-lg font-semibold", key === today && "text-primary")}>
                {format(fromKey(key), "d")}
              </span>
              <span className="relative h-1 w-8 overflow-hidden rounded-full bg-muted">
                <span
                  className={cn("block h-full rounded-full transition-all duration-700", future ? "bg-muted-foreground/30" : "bg-primary")}
                  style={{ width: `${future ? (p.todosTotal ? 100 : 0) : p.overall}%` }}
                />
              </span>
            </button>
          );
        })}
      </div>
    </GlowCard>
  );
}

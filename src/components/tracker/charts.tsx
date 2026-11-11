import { useState } from "react";
import { format } from "date-fns";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  dayProgress,
  fromKey,
  habitMonthlyRates,
  isHabitDone,
  lastNDays,
  monthDays,
  monthSeries,
  perfectDays,
  type MonthPoint,
  type TrackerState,
} from "@/lib/habit-stats";
import { tracker } from "@/lib/tracker-store";
import { cn } from "@/lib/utils";
import { CardTitle, GlowCard, hue } from "./primitives";

type Props = { state: TrackerState; dayKey: string; today: string; onSelect: (k: string) => void };

interface TipEntry {
  name?: string;
  value?: number | null;
  color?: string;
  payload?: { label?: string };
}
function GlassTooltip({ active, payload }: { active?: boolean; payload?: TipEntry[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-popover/90 px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
      <p className="mb-1 font-semibold">{payload[0]?.payload?.label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-mono text-foreground">{p.value ?? "—"}%</span>
        </p>
      ))}
    </div>
  );
}

const SERIES = [
  { key: "overall", name: "Overall", color: "var(--lime)" },
  { key: "habits", name: "Habits", color: "var(--sky)" },
  { key: "todos", name: "Todos", color: "var(--coral)" },
] as const;

export function MonthlyChart({ state, dayKey, today, onSelect }: Props) {
  const [hidden, setHidden] = useState<string[]>([]);
  const data = monthSeries(state, dayKey, today);
  const past = data.filter((d) => d.overall !== null);
  const avg = past.length ? Math.round(past.reduce((s, d) => s + (d.overall ?? 0), 0) / past.length) : 0;
  const perfect = perfectDays(state, dayKey, today);
  const selectedDay = fromKey(dayKey).getDate();

  return (
    <GlowCard delay={380}>
      <CardTitle
        eyebrow="Monthly progress · by day"
        title={format(fromKey(dayKey), "MMMM yyyy")}
        right={
          <div className="flex gap-5 text-right">
            <div>
              <p className="font-display text-2xl font-bold text-lime">{avg}%</p>
              <p className="text-[11px] text-muted-foreground">daily average</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-amber">{perfect}</p>
              <p className="text-[11px] text-muted-foreground">perfect days</p>
            </div>
          </div>
        }
      />
      <div className="mb-3 flex flex-wrap gap-2">
        {SERIES.map((s) => {
          const off = hidden.includes(s.key);
          return (
            <button
              key={s.key}
              onClick={() => setHidden((h) => (off ? h.filter((x) => x !== s.key) : [...h, s.key]))}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition",
                off ? "opacity-40" : "bg-muted/60",
              )}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
              {s.name}
            </button>
          );
        })}
        <span className="ml-auto self-center text-xs text-muted-foreground">Tap a day to jump to it</span>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 6, left: -22, bottom: 0 }}
            onClick={(s) => {
              const p = s?.activePayload?.[0]?.payload as MonthPoint | undefined;
              if (p) onSelect(p.key);
            }}
            className="cursor-pointer"
          >
            <defs>
              <linearGradient id="g-overall" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--lime)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--lime)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
            <Tooltip content={<GlassTooltip />} cursor={{ stroke: "var(--lime)", strokeOpacity: 0.3, strokeWidth: 30 }} />
            <ReferenceLine x={selectedDay} stroke="var(--amber)" strokeDasharray="4 4" />
            {!hidden.includes("overall") && (
              <Area type="monotone" dataKey="overall" name="Overall" stroke="var(--lime)" strokeWidth={3} fill="url(#g-overall)" animationDuration={1400} activeDot={{ r: 6, strokeWidth: 0 }} />
            )}
            {!hidden.includes("habits") && (
              <Line type="monotone" dataKey="habits" name="Habits" stroke="var(--sky)" strokeWidth={2} dot={false} animationDuration={1600} />
            )}
            {!hidden.includes("todos") && (
              <Line type="monotone" dataKey="todos" name="Todos" stroke="var(--coral)" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls animationDuration={1800} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </GlowCard>
  );
}

export function HabitBreakdown({ state, dayKey, today }: Omit<Props, "onSelect">) {
  const rates = habitMonthlyRates(state, dayKey, today);
  const data = [...rates].reverse().map((r) => ({ name: r.habit.name, value: r.rate, fill: `var(--${r.habit.color})` }));
  return (
    <GlowCard delay={440} className="h-full">
      <CardTitle eyebrow="This month" title="Habit consistency" />
      {rates.length ? (
        <>
          <div className="relative mx-auto h-52 max-w-[16rem]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart data={data} innerRadius="28%" outerRadius="100%" startAngle={90} endAngle={-270} barSize={10}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "var(--muted)" }} animationDuration={1500} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-4 space-y-2">
            {rates.map((r) => (
              <li key={r.habit.id} style={hue(r.habit.color)} className="flex items-center gap-2 text-sm">
                <span>{r.habit.emoji}</span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{r.habit.name}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {r.done}/{r.eligible}
                </span>
                <span className="habit-tint w-12 rounded-md py-0.5 text-center font-mono text-xs font-semibold">{r.rate}%</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Add a habit to see how consistent you are.</p>
      )}
    </GlowCard>
  );
}

export function MonthHeatmap({ state, dayKey, today, onSelect }: Props) {
  const days = monthDays(dayKey);
  const lead = (fromKey(days[0] ?? dayKey).getDay() + 6) % 7;
  return (
    <GlowCard delay={500} className="h-full">
      <CardTitle eyebrow="Glow calendar" title="Every day, at a glance" />
      <div className="grid grid-cols-7 gap-1.5">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} className="pb-1 text-center font-mono text-[10px] text-muted-foreground">
            {d}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`e${i}`} />
        ))}
        {days.map((k, i) => {
          const p = dayProgress(state, k);
          const future = k > today;
          const empty = p.habitsTotal + p.todosTotal === 0;
          const mix = future || empty ? 0 : 12 + p.overall * 0.88;
          return (
            <button
              key={k}
              onClick={() => onSelect(k)}
              title={`${format(fromKey(k), "MMM d")} · ${future ? "upcoming" : `${p.overall}%`}`}
              className={cn(
                "animate-rise relative aspect-square rounded-lg text-[11px] font-semibold transition hover:scale-110 hover:z-10",
                future && "border border-dashed",
                k === dayKey && "ring-2 ring-amber ring-offset-2 ring-offset-background",
                k === today && "glow-primary",
                mix > 60 ? "text-primary-foreground" : "text-muted-foreground",
              )}
              style={{
                animationDelay: `${500 + i * 15}ms`,
                background: future ? "transparent" : `color-mix(in oklab, var(--lime) ${mix}%, var(--muted))`,
              }}
            >
              {fromKey(k).getDate()}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
        less
        {[0, 30, 55, 80, 100].map((m) => (
          <span key={m} className="h-3 w-3 rounded" style={{ background: `color-mix(in oklab, var(--lime) ${m}%, var(--muted))` }} />
        ))}
        more
      </div>
    </GlowCard>
  );
}

export function WeekChart({ state, dayKey, today }: Omit<Props, "onSelect">) {
  const data = lastNDays(dayKey, 7).map((k) => {
    const p = dayProgress(state, k);
    const future = k > today;
    return {
      label: format(fromKey(k), "EEE d"),
      short: format(fromKey(k), "EEEEE"),
      Habits: future ? 0 : p.habitsPct,
      Todos: p.todosPct,
    };
  });
  return (
    <GlowCard delay={560} className="h-full">
      <CardTitle eyebrow="Last 7 days" title="Habits vs todos" />
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 0, left: -26, bottom: 0 }} barGap={3}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="short" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
            <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
            <Tooltip content={<GlassTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
            <Bar dataKey="Habits" fill="var(--lime)" radius={[6, 6, 2, 2]} animationDuration={1200} />
            <Bar dataKey="Todos" fill="var(--coral)" radius={[6, 6, 2, 2]} animationDuration={1500} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-lime" />Habits</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-coral" />Todos</span>
      </div>
    </GlowCard>
  );
}

export function HabitMatrix({ state, dayKey, today }: Omit<Props, "onSelect">) {
  const days = monthDays(dayKey);
  if (!state.habits.length) return null;
  return (
    <GlowCard delay={620}>
      <CardTitle
        eyebrow="Daily progress · each habit"
        title="Habit matrix"
        right={<span className="hidden text-xs text-muted-foreground sm:block">Click a past cell to toggle it</span>}
      />
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[720px] space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-40 shrink-0" />
            <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
              {days.map((k) => (
                <span key={k} className={cn("text-center font-mono text-[10px]", k === dayKey ? "text-amber" : "text-muted-foreground")}>
                  {fromKey(k).getDate()}
                </span>
              ))}
            </div>
          </div>
          {state.habits.map((h) => (
            <div key={h.id} className="flex items-center gap-3" style={hue(h.color)}>
              <span className="flex w-40 shrink-0 items-center gap-2 truncate text-sm">
                <span>{h.emoji}</span>
                <span className="truncate text-muted-foreground">{h.name}</span>
              </span>
              <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
                {days.map((k) => {
                  const before = k < h.createdAt;
                  const future = k > today;
                  const done = isHabitDone(state, h.id, k);
                  return (
                    <button
                      key={k}
                      disabled={before || future}
                      onClick={() => tracker.toggleHabit(k, h.id)}
                      aria-label={`${h.name} on ${k}`}
                      className={cn(
                        "aspect-square rounded-md transition duration-300 hover:scale-125 disabled:hover:scale-100",
                        before ? "opacity-0" : future ? "border border-dashed opacity-50" : done ? "habit-fill habit-glow" : "bg-muted",
                        k === dayKey && "ring-1 ring-amber",
                      )}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlowCard>
  );
}

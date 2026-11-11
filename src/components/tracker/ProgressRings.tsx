import { useEffect, useState } from "react";
import type { DayProgress } from "@/lib/habit-stats";
import { CountUp, GlowCard } from "./primitives";

function Ring({ r, stroke, value, color, delay }: { r: number; stroke: number; value: number; color: string; delay: number }) {
  const c = 2 * Math.PI * r;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setShown(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <>
      <circle cx="120" cy="120" r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} opacity={0.6} />
      <circle
        cx="120"
        cy="120"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        opacity={shown > 0 ? 1 : 0}
        strokeDasharray={c}
        strokeDashoffset={c * (1 - shown / 100)}
        transform="rotate(-90 120 120)"
        style={{
          transition: "stroke-dashoffset 1.2s cubic-bezier(0.22, 1.2, 0.36, 1)",
          filter: `drop-shadow(0 0 10px color-mix(in oklab, ${color} 60%, transparent))`,
        }}
      />
    </>
  );
}

export function ProgressRings({ progress, delay = 0 }: { progress: DayProgress; delay?: number }) {
  return (
    <GlowCard delay={delay} className="flex flex-col items-center justify-center gap-5">
      <div className="relative">
        <svg viewBox="0 0 240 240" className="h-52 w-52 sm:h-56 sm:w-56">
          <Ring r={104} stroke={16} value={progress.habitsPct} color="var(--lime)" delay={150} />
          <Ring r={80} stroke={16} value={progress.todosPct} color="var(--coral)" delay={300} />
          <Ring r={56} stroke={10} value={progress.overall} color="var(--sky)" delay={450} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-bold">
            <CountUp value={progress.overall} suffix="%" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">glow</span>
        </div>
      </div>
      <div className="grid w-full grid-cols-3 gap-2 text-center">
        {[
          { label: "Habits", v: `${progress.habitsDone}/${progress.habitsTotal}`, cls: "bg-lime" },
          { label: "Todos", v: `${progress.todosDone}/${progress.todosTotal}`, cls: "bg-coral" },
          { label: "Overall", v: `${progress.overall}%`, cls: "bg-sky" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-muted/50 px-2 py-2.5">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${s.cls}`} />
              {s.label}
            </div>
            <div className="mt-0.5 font-display text-lg font-semibold tabular-nums">{s.v}</div>
          </div>
        ))}
      </div>
    </GlowCard>
  );
}

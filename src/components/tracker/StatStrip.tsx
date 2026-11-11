
import type { LucideIcon } from "lucide-react";
import { CountUp, GlowCard } from "./primitives";

export interface Stat {
  label: string;
  value: number;
  suffix?: string;
  hint: string;
  icon: LucideIcon;
  tone: "lime" | "coral" | "sky" | "amber";
}



export function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((s, i) => (
        <GlowCard key={s.label} delay={150 + i * 70} className="group p-4 sm:p-5" style={{ ["--hc" as string]: `var(--${s.tone})` }}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{s.label}</span>
            <span className="habit-tint flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
              <s.icon className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 font-display text-4xl font-bold tracking-tight">
            <CountUp value={s.value} suffix={s.suffix} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
        </GlowCard>
      ))}
    </div>
  );
}

import { useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { HabitColor } from "@/lib/habit-stats";

export const hue = (c: HabitColor) => ({ "--hc": `var(--${c})` }) as CSSProperties;

export function GlowCard({
  className,
  children,
  delay = 0,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement> & { delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
      className={cn("glass spotlight animate-rise p-5 sm:p-6", className)}
      style={{ animationDelay: `${delay}ms`, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  eyebrow,
  title,
  right,
}: {
  eyebrow: string;
  title: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
        <h2 className="mt-1 font-display text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
      </div>
      {right}
    </div>
  );
}

export function useCountUp(value: number, duration = 900) {
  const [display, setDisplay] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const origin = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const v = origin + (value - origin) * (1 - Math.pow(1 - t, 3));
      from.current = v;
      setDisplay(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return Math.round(display);
}

export function CountUp({ value, suffix = "" }: { value: number; suffix?: string | undefined }) {
  const v = useCountUp(value);
  return (
    <span className="tabular-nums">
      {v}
      {suffix}
    </span>
  );
}

/** Small radial sparkle that plays once whenever it mounts. */
export function Burst() {
  return (
    <span className="pointer-events-none absolute left-1/2 top-1/2">
      {Array.from({ length: 8 }, (_, i) => (
        <span
          key={i}
          className="animate-burst habit-fill absolute h-1.5 w-1.5 rounded-full"
          style={{ ["--angle" as string]: `${i * 45}deg` }}
        />
      ))}
    </span>
  );
}

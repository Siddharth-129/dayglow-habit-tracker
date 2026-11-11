import { useEffect, useState } from "react";

const COLORS = ["lime", "coral", "sky", "amber", "rose"];

interface Piece {
  id: string;
  x: number;
  delay: number;
  dur: number;
  rot: number;
  drift: number;
  color: string;
  size: number;
  round: boolean;
}

export function Confetti({ fire }: { fire: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  useEffect(() => {
    if (!fire) return;
    setPieces(
      Array.from({ length: 110 }, (_, i) => ({
        id: `${fire}-${i}`,
        x: Math.random() * 100,
        delay: Math.random() * 0.4,
        dur: 2.2 + Math.random() * 1.6,
        rot: Math.random() * 900 - 450,
        drift: Math.random() * 240 - 120,
        color: COLORS[i % COLORS.length] ?? "lime",
        size: 6 + Math.random() * 8,
        round: i % 3 === 0,
      })),
    );
    const t = setTimeout(() => setPieces([]), 4500);
    return () => clearTimeout(t);
  }, [fire]);

  if (!pieces.length) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="animate-confetti absolute top-0 opacity-0"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.45,
            borderRadius: p.round ? 999 : 2,
            background: `var(--${p.color})`,
            ["--delay" as string]: `${p.delay}s`,
            ["--dur" as string]: `${p.dur}s`,
            ["--rot" as string]: `${p.rot}deg`,
            ["--drift" as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

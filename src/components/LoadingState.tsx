import { useEffect, useState } from "react";

const STEPS = [
  "Generating partner profiles...",
  "Designing tiering structure...",
  "Selecting motions per archetype...",
  "Computing economic model...",
  "Building enablement track...",
  "Drafting 100-day launch plan...",
  "Writing strategic rationale...",
  "Surfacing risks...",
  "Composing executive summary...",
];

interface Props {
  totalMs: number;
}

export function LoadingState({ totalMs }: Props) {
  const [done, setDone] = useState(0);

  useEffect(() => {
    const perStep = totalMs / STEPS.length;
    const timers = STEPS.map((_, i) =>
      window.setTimeout(() => setDone((d) => Math.max(d, i + 1)), perStep * (i + 1)),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [totalMs]);

  return (
    <div className="border border-border bg-card p-8 max-w-xl">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-5">
        Generating program design
      </div>
      <ul className="space-y-2.5">
        {STEPS.map((step, i) => {
          const isDone = i < done;
          const isActive = i === done;
          return (
            <li
              key={step}
              className={`flex items-center gap-3 text-sm ${
                isDone
                  ? "text-foreground"
                  : isActive
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-4 h-4 text-[10px] ${
                  isDone
                    ? "text-primary"
                    : isActive
                    ? "text-primary animate-pulse"
                    : "text-border"
                }`}
              >
                {isDone ? "✓" : isActive ? "•" : "○"}
              </span>
              {step}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

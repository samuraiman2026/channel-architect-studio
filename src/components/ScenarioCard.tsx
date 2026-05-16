import type { Scenario } from "@/lib/types";

interface Props {
  scenario: Scenario;
  onSelect: (scenario: Scenario) => void;
}

export function ScenarioCard({ scenario, onSelect }: Props) {
  const facts: Array<[string, string]> = [
    ["ARR", scenario.arr],
    ["Motion", scenario.motion],
    ["ICP", scenario.icp],
    ["Strategic ask", scenario.ask],
  ];

  return (
    <div className="flex flex-col h-full border border-border bg-card p-6">
      <h3 className="font-serif text-xl text-primary leading-tight mb-4">
        {scenario.label}
      </h3>
      <dl className="flex-1 space-y-2 text-sm">
        {facts.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[80px_1fr] gap-3">
            <dt className="text-muted-foreground uppercase tracking-wider text-[10px] pt-0.5">
              {k}
            </dt>
            <dd className="text-foreground leading-snug">{v}</dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        onClick={() => onSelect(scenario)}
        className="mt-6 w-full bg-primary text-primary-foreground text-sm font-medium py-2.5 hover:bg-primary/90 transition-colors"
      >
        Use this scenario
      </button>
    </div>
  );
}

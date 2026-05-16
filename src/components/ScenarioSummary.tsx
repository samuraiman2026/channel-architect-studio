import type { AxisSettings, Scenario } from "@/lib/types";

interface Props {
  scenario: Scenario;
  settings: AxisSettings;
}

export function ScenarioSummary({ scenario, settings }: Props) {
  const econ = settings.economics;
  const econStr = `R ${econ.resell} · Ref ${econ.refer} · Inf ${econ.influence} · BO ${econ.buildOn}`;
  return (
    <div className="border border-border bg-card p-4 text-sm">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Scenario
          </div>
          <div className="font-serif text-base text-primary leading-tight">
            {scenario.label}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Economics
          </div>
          <div className="text-foreground">{econStr}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Stage
          </div>
          <div className="text-foreground">{settings.stage}</div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Primary:</span>{" "}
        {settings.primaryArchetypes.join(", ") || "—"}
        {settings.secondaryArchetypes.length > 0 && (
          <>
            {"  "}
            <span className="font-medium text-foreground ml-3">Secondary:</span>{" "}
            {settings.secondaryArchetypes.join(", ")}
          </>
        )}
      </div>
    </div>
  );
}

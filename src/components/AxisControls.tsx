import { useState, useEffect } from "react";
import type { AxisSettings, Archetype, Scenario, Stage } from "@/lib/types";

const ALL_ARCHETYPES: Archetype[] = [
  "SI / Consulting",
  "ISV",
  "VAR",
  "MSP",
  "Referral / Agency",
  "Marketplace",
];

const STAGES: Stage[] = [
  "Pre-PMF",
  "Early Scale ($1-10M ARR)",
  "Scaling ($10-50M ARR)",
  "Mature ($50M+ ARR)",
];

interface Props {
  scenario: Scenario;
  initial: AxisSettings;
  onGenerate: (settings: AxisSettings) => void;
  onChangeScenario: () => void;
}

export function AxisControls({ scenario, initial, onGenerate, onChangeScenario }: Props) {
  const [settings, setSettings] = useState<AxisSettings>(initial);

  useEffect(() => setSettings(initial), [initial]);

  const econTotal =
    settings.economics.resell +
    settings.economics.refer +
    settings.economics.influence +
    settings.economics.buildOn;

  const canGenerate = econTotal === 100 && settings.primaryArchetypes.length >= 1;

  const toggle = (group: "primaryArchetypes" | "secondaryArchetypes", a: Archetype) => {
    setSettings((s) => {
      const has = s[group].includes(a);
      return {
        ...s,
        [group]: has ? s[group].filter((x) => x !== a) : [...s[group], a],
      };
    });
  };

  const updateEcon = (key: keyof AxisSettings["economics"], v: number) => {
    setSettings((s) => ({
      ...s,
      economics: { ...s.economics, [key]: Math.max(0, Math.min(100, v || 0)) },
    }));
  };

  return (
    <div className="space-y-12">
      {/* Selected scenario summary */}
      <div className="flex items-start justify-between border border-border bg-card p-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Selected scenario
          </div>
          <div className="font-serif text-lg text-primary">{scenario.label}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {scenario.arr} · {scenario.motion}
          </div>
        </div>
        <button
          type="button"
          onClick={onChangeScenario}
          className="text-sm text-primary underline underline-offset-4 hover:no-underline"
        >
          change scenario
        </button>
      </div>

      {/* Axis 1 */}
      <section>
        <h2 className="font-serif text-2xl text-primary mb-1">How will partners make money?</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Allocate 100% of your planning attention. These are not commission rates.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(
            [
              ["resell", "Resell %"],
              ["refer", "Refer %"],
              ["influence", "Influence %"],
              ["buildOn", "Build-on %"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block">
              <span className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                {label}
              </span>
              <input
                type="number"
                min={0}
                max={100}
                value={settings.economics[key]}
                onChange={(e) => updateEcon(key, parseInt(e.target.value, 10))}
                className="w-full border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </label>
          ))}
        </div>
        <div
          className={`mt-3 text-xs ${
            econTotal === 100 ? "text-muted-foreground" : "text-destructive"
          }`}
        >
          Total: {econTotal}% {econTotal !== 100 && "(must equal 100%)"}
        </div>
      </section>

      {/* Axis 2 */}
      <section>
        <h2 className="font-serif text-2xl text-primary mb-1">Who are the partners?</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Pick at least one primary partner type. The pilot will be designed around these.
        </p>

        <div className="mb-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Primary</div>
          <div className="flex flex-wrap gap-2">
            {ALL_ARCHETYPES.map((a) => {
              const active = settings.primaryArchetypes.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggle("primaryArchetypes", a)}
                  className={`px-3 py-1.5 text-sm border transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:border-primary"
                  }`}
                >
                  {a}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Secondary
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_ARCHETYPES.map((a) => {
              const active = settings.secondaryArchetypes.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggle("secondaryArchetypes", a)}
                  className={`px-3 py-1.5 text-sm border transition-colors ${
                    active
                      ? "bg-accent text-accent-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary"
                  }`}
                >
                  {a}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Axis 3 */}
      <section>
        <h2 className="font-serif text-2xl text-primary mb-1">What stage is the vendor?</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Stage determines what&rsquo;s affordable, not just what&rsquo;s optimal.
        </p>
        <div className="inline-flex border border-border overflow-hidden flex-wrap">
          {STAGES.map((stage, i) => {
            const active = settings.stage === stage;
            return (
              <button
                key={stage}
                type="button"
                onClick={() => setSettings((s) => ({ ...s, stage }))}
                className={`px-4 py-2 text-sm transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-foreground hover:bg-accent"
                } ${i > 0 ? "border-l border-border" : ""}`}
              >
                {stage}
              </button>
            );
          })}
        </div>
      </section>

      {settings.stage === "Pre-PMF" && (
        <div className="border border-border bg-accent p-4 text-sm text-accent-foreground">
          At Pre-PMF stage, the tool will recommend <strong>NOT</strong> building a formal program.
          This is a deliberate output.
        </div>
      )}

      <div className="pt-4">
        <button
          type="button"
          disabled={!canGenerate}
          onClick={() => onGenerate(settings)}
          className="w-full sm:w-auto bg-primary text-primary-foreground px-8 py-3 text-base font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Generate program design
        </button>
      </div>
    </div>
  );
}

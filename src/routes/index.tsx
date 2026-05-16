import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { SCENARIO_LIST } from "@/lib/scenarios";
import type { AxisSettings, Scenario, SectionKey } from "@/lib/types";
import { ScenarioCard } from "@/components/ScenarioCard";
import { AxisControls } from "@/components/AxisControls";
import { LoadingState } from "@/components/LoadingState";
import { OutputSection } from "@/components/OutputSection";
import { ScenarioSummary } from "@/components/ScenarioSummary";

export const Route = createFileRoute("/")({
  component: ChannelArchitect,
  head: () => ({
    meta: [
      { title: "Channel Architect" },
      {
        name: "description",
        content:
          "Partner program design for SaaS companies, in 60 seconds. A credible v1 program design grounded in real benchmarks.",
      },
    ],
  }),
});

type Phase = "select" | "configure" | "loading" | "output";

type Sections = Record<SectionKey, string>;

const ORDER: Array<{ key: SectionKey; letter: string; title: string }> = [
  { key: "exec-summary", letter: "A", title: "Executive Summary" },
  { key: "strategic-rationale", letter: "B", title: "Strategic Rationale" },
  { key: "ipp", letter: "C", title: "Ideal Partner Profile" },
  { key: "tiering", letter: "D", title: "Tiering Structure" },
  { key: "economics", letter: "E", title: "Economic Model" },
  { key: "motions", letter: "F", title: "Motion Selection" },
  { key: "enablement", letter: "G", title: "Enablement Track per Tier" },
  { key: "launch-plan", letter: "H", title: "100-Day Launch Plan" },
  { key: "risks", letter: "I", title: "Risks and Watch-Items" },
];

async function fetchSection(key: SectionKey, scenarioId: string, settings: AxisSettings) {
  const res = await fetch(`/api/generate/${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario: scenarioId, axisSettings: settings }),
  });
  const json = (await res.json()) as { section: string };
  return json.section;
}

function ChannelArchitect() {
  const [phase, setPhase] = useState<Phase>("select");
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [settings, setSettings] = useState<AxisSettings | null>(null);
  const [sections, setSections] = useState<Partial<Sections>>({});

  const handleSelectScenario = (s: Scenario) => {
    setScenario(s);
    setSettings(s.defaults);
    setPhase("configure");
  };

  const handleGenerate = async (axisSettings: AxisSettings) => {
    if (!scenario) return;
    setSettings(axisSettings);
    setSections({});
    setPhase("loading");

    const start = Date.now();

    const run = async () => {
      const acc: Partial<Sections> = {};
      // Batch 1: ipp, tiering, motions
      const b1 = await Promise.all(
        (["ipp", "tiering", "motions"] as SectionKey[]).map((k) =>
          fetchSection(k, scenario.id, axisSettings).then((v) => [k, v] as const),
        ),
      );
      b1.forEach(([k, v]) => (acc[k] = v));
      // Batch 2
      const b2 = await Promise.all(
        (["economics", "enablement", "launch-plan"] as SectionKey[]).map((k) =>
          fetchSection(k, scenario.id, axisSettings).then((v) => [k, v] as const),
        ),
      );
      b2.forEach(([k, v]) => (acc[k] = v));
      // Batch 3
      const b3 = await Promise.all(
        (["strategic-rationale", "risks"] as SectionKey[]).map((k) =>
          fetchSection(k, scenario.id, axisSettings).then((v) => [k, v] as const),
        ),
      );
      b3.forEach(([k, v]) => (acc[k] = v));
      // Batch 4
      acc["exec-summary"] = await fetchSection("exec-summary", scenario.id, axisSettings);
      return acc;
    };

    const data = await run();
    // Hold for theatrical minimum (30s) so loading sequence completes
    const MIN = 30000;
    const elapsed = Date.now() - start;
    if (elapsed < MIN) {
      await new Promise((r) => setTimeout(r, MIN - elapsed));
    }
    setSections(data);
    setPhase("output");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border" data-print-hide>
        <div className="max-w-[1100px] mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl text-primary tracking-tight">
            Channel Architect
          </Link>
          <nav className="text-sm">
            <Link
              to="/about"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              About
            </Link>
          </nav>
        </div>
      </header>

      <div data-print-header className="text-center">
        Channel Architect — {scenario?.label ?? ""}
      </div>

      <main className="max-w-[1100px] mx-auto px-6 py-16">
        {phase === "select" && (
          <ScenarioSelector onSelect={handleSelectScenario} />
        )}

        {phase === "configure" && scenario && settings && (
          <div className="max-w-[760px] mx-auto">
            <AxisControls
              scenario={scenario}
              initial={settings}
              onGenerate={handleGenerate}
              onChangeScenario={() => setPhase("select")}
            />
          </div>
        )}

        {phase === "loading" && (
          <div className="max-w-[760px] mx-auto flex justify-center pt-8">
            <LoadingState totalMs={32000} />
          </div>
        )}

        {phase === "output" && scenario && settings && (
          <OutputView
            scenario={scenario}
            settings={settings}
            sections={sections as Sections}
            onRegenerate={() => setPhase("configure")}
            onStartOver={() => {
              setPhase("select");
              setScenario(null);
              setSettings(null);
              setSections({});
            }}
          />
        )}
      </main>
    </div>
  );
}

function ScenarioSelector({ onSelect }: { onSelect: (s: Scenario) => void }) {
  return (
    <>
      <section className="max-w-[760px] mx-auto text-center pb-16">
        <h1 className="font-serif text-5xl sm:text-6xl text-primary tracking-tight mb-4">
          Channel Architect
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Partner program design for SaaS companies, in 60 seconds.
        </p>
        <p className="text-base text-foreground leading-relaxed">
          Most channel program failures are stage failures or motion failures. Channel
          Architect produces a credible v1 program design grounded in real benchmarks
          from Snowflake, HubSpot, and other published programs — so you can
          pressure-test design choices before committing.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-primary mb-6 text-center">
          Pick a scenario
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SCENARIO_LIST.map((s) => (
            <ScenarioCard key={s.id} scenario={s} onSelect={onSelect} />
          ))}
        </div>
        <p className="mt-8 text-center text-sm italic text-muted-foreground">
          Custom company input coming in v1.1.
        </p>
      </section>
    </>
  );
}

function OutputView({
  scenario,
  settings,
  sections,
  onRegenerate,
  onStartOver,
}: {
  scenario: Scenario;
  settings: AxisSettings;
  sections: Sections;
  onRegenerate: () => void;
  onStartOver: () => void;
}) {
  return (
    <div className="max-w-[760px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8" data-print-hide>
        <div className="flex-1">
          <ScenarioSummary scenario={scenario} settings={settings} />
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Download as PDF
          </button>
          <button
            type="button"
            onClick={onRegenerate}
            className="border border-border bg-background px-5 py-2.5 text-sm hover:bg-accent transition-colors"
          >
            Generate again
          </button>
          <button
            type="button"
            onClick={onStartOver}
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-primary py-1"
          >
            Start over
          </button>
        </div>
      </div>

      <article className="space-y-16">
        {ORDER.map(({ key, letter, title }) => (
          <OutputSection
            key={key}
            letter={letter}
            title={title}
            markdown={sections[key] ?? ""}
          />
        ))}
      </article>

      <footer className="mt-20 pt-8 border-t border-border">
        <p className="text-xs italic text-muted-foreground leading-relaxed">
          <span className="not-italic font-semibold text-foreground">
            Generated rationale.
          </span>{" "}
          This design was generated using a three-axis framework: economic role mix,
          primary partner archetypes, and vendor GTM stage. Each section was produced
          by a separately-prompted call to Claude (Anthropic), with reference
          benchmarks from published programs at Snowflake, HubSpot, and others. The
          framework and prompts are authored by Pranjal; see{" "}
          <Link to="/about" className="underline underline-offset-2">
            /about
          </Link>{" "}
          for details.
        </p>
      </footer>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { SCENARIO_LIST } from "@/lib/scenarios";
import type { AxisSettings, Scenario, SectionKey } from "@/lib/types";
import {
  DESIGN_ENGINE_VERSION,
  generateDesign,
  validateDesignInputs,
  type Sections,
} from "@/lib/designEngine";
import { ScenarioCard } from "@/components/ScenarioCard";
import { AxisControls } from "@/components/AxisControls";
import { OutputSection } from "@/components/OutputSection";
import { ScenarioSummary } from "@/components/ScenarioSummary";
import { normalizeLocalDraftReview } from "@/lib/localDraftReview";

export const Route = createFileRoute("/")({
  component: ChannelArchitect,
  head: () => ({
    meta: [
      { title: "The Partner Brief | Channel Architect" },
      {
        name: "description",
        content:
          "Build a first partner-program design from your company context and planning choices.",
      },
    ],
  }),
});

type Phase = "select" | "configure" | "output";

interface SavedDraft {
  id: string;
  programId: string;
  version: number;
  engineVersion: string;
  savedAt: string;
  owner: string;
  status: "draft";
  localEndorsement?: { name: string; at: string };
  /** Older browser saves called this an approval. It is migrated to a local endorsement on read. */
  approval?: { name: string; at: string };
  scenario: Scenario;
  settings: AxisSettings;
  sections: Sections;
}

const STORAGE_KEY = "channel-architect-drafts-v1";

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

function ChannelArchitect() {
  const [phase, setPhase] = useState<Phase>("select");
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [settings, setSettings] = useState<AxisSettings | null>(null);
  const [sections, setSections] = useState<Sections | null>(null);
  const [drafts, setDrafts] = useState<SavedDraft[]>([]);
  const [notice, setNotice] = useState("");
  const [programId, setProgramId] = useState("");
  const [owner, setOwner] = useState("");
  const [activeDraftId, setActiveDraftId] = useState("");

  useEffect(() => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(parsed)) {
        const normalized = parsed
          .filter(
            (item): item is SavedDraft =>
              typeof item === "object" &&
              item !== null &&
              typeof item.id === "string" &&
              typeof item.savedAt === "string" &&
              typeof item.scenario?.label === "string" &&
              typeof item.settings?.stage === "string" &&
              typeof item.sections?.["exec-summary"] === "string",
          )
          .map((item) => {
            const {
              approval: legacyApproval,
              status: _legacyStatus,
              localEndorsement: savedEndorsement,
              ...saved
            } = item;
            return {
              ...saved,
              ...normalizeLocalDraftReview(savedEndorsement, legacyApproval),
              programId: typeof item.programId === "string" ? item.programId : item.id,
              version: typeof item.version === "number" ? item.version : 1,
              engineVersion:
                typeof item.engineVersion === "string" ? item.engineVersion : "legacy-unversioned",
              owner: typeof item.owner === "string" ? item.owner : "Local browser user",
            };
          });
        setDrafts(normalized);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      }
    } catch {
      setNotice("Saved drafts on this device could not be read.");
    }
  }, []);

  const handleSelectScenario = (s: Scenario) => {
    setScenario(s);
    setSettings(s.defaults);
    setProgramId(crypto.randomUUID());
    setOwner("");
    setActiveDraftId("");
    setPhase("configure");
  };

  const handleGenerate = (axisSettings: AxisSettings) => {
    if (!scenario) return;
    const errors = validateDesignInputs(scenario, axisSettings);
    if (!owner.trim()) errors.push("A program owner is required.");
    if (errors.length) {
      setNotice(errors.join(" "));
      return;
    }
    const output = generateDesign(scenario, axisSettings);
    setSettings(axisSettings);
    setSections(output);
    const version =
      Math.max(
        0,
        ...drafts.filter((item) => item.programId === programId).map((item) => item.version),
      ) + 1;
    const draft: SavedDraft = {
      id: crypto.randomUUID(),
      programId: programId || crypto.randomUUID(),
      version,
      engineVersion: DESIGN_ENGINE_VERSION,
      savedAt: new Date().toISOString(),
      owner: owner.trim(),
      status: "draft",
      scenario,
      settings: axisSettings,
      sections: output,
    };
    const next = [draft, ...drafts];
    setActiveDraftId(draft.id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setDrafts(next);
      setNotice("Draft saved on this device. It is not synced or backed up.");
    } catch {
      setNotice(
        "Design generated, but this device could not save it. Print or copy what you need.",
      );
    }
    setPhase("output");
  };

  const openDraft = (draft: SavedDraft) => {
    setScenario(draft.scenario);
    setSettings(draft.settings);
    setSections(draft.sections);
    setProgramId(draft.programId);
    setOwner(draft.owner);
    setActiveDraftId(draft.id);
    setNotice(`Opened saved draft from ${new Date(draft.savedAt).toLocaleString()}.`);
    setPhase("output");
  };

  const recordLocalEndorsement = (name: string) => {
    const active = drafts.find((item) => item.id === activeDraftId);
    if (!active || !name.trim()) return;
    const updated = {
      ...active,
      status: "draft" as const,
      localEndorsement: { name: name.trim(), at: new Date().toISOString() },
    };
    const next = drafts.map((item) => (item.id === active.id ? updated : item));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setDrafts(next);
      setNotice(
        `Local endorsement noted for version ${updated.version}. This browser-only record does not approve or authorize the program.`,
      );
    } catch {
      setNotice("This device could not save the local endorsement note.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border" data-print-hide>
        <div className="max-w-[1100px] mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl text-primary tracking-tight">
            The Partner Brief
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
        The Partner Brief — {scenario?.label ?? ""}
      </div>

      <main className="max-w-[1100px] mx-auto px-6 py-16">
        {notice && (
          <p
            role="status"
            className="max-w-[760px] mx-auto mb-8 text-sm text-muted-foreground"
            data-print-hide
          >
            {notice}
          </p>
        )}
        {phase === "select" && (
          <ScenarioSelector
            onSelect={handleSelectScenario}
            drafts={drafts}
            onOpenDraft={openDraft}
          />
        )}

        {phase === "configure" && scenario && settings && (
          <div className="max-w-[760px] mx-auto">
            <label className="block mb-8 text-sm text-foreground">
              Program owner *
              <input
                className="mt-1 w-full border border-border bg-background px-3 py-2"
                value={owner}
                maxLength={120}
                onChange={(event) => setOwner(event.target.value)}
                placeholder="Name of the person accountable for this program"
              />
            </label>
            <AxisControls
              scenario={scenario}
              initial={settings}
              onGenerate={handleGenerate}
              onChangeScenario={() => setPhase("select")}
            />
          </div>
        )}

        {phase === "output" && scenario && settings && sections && (
          <OutputView
            scenario={scenario}
            settings={settings}
            sections={sections}
            draft={drafts.find((item) => item.id === activeDraftId)}
            onRecordLocalEndorsement={recordLocalEndorsement}
            onRegenerate={() => setPhase("configure")}
            onStartOver={() => {
              setPhase("select");
              setScenario(null);
              setSettings(null);
              setSections(null);
              setProgramId("");
              setOwner("");
              setActiveDraftId("");
            }}
          />
        )}
      </main>
    </div>
  );
}

function ScenarioSelector({
  onSelect,
  drafts,
  onOpenDraft,
}: {
  onSelect: (s: Scenario) => void;
  drafts: SavedDraft[];
  onOpenDraft: (draft: SavedDraft) => void;
}) {
  const [custom, setCustom] = useState({ label: "", arr: "", motion: "", icp: "", ask: "" });
  const createCustom = () =>
    onSelect({
      id: "custom",
      ...custom,
      defaults: {
        economics: { resell: 0, refer: 40, influence: 40, buildOn: 20 },
        primaryArchetypes: ["SI / Consulting"],
        secondaryArchetypes: [],
        stage: "Early Scale ($1-10M ARR)",
      },
    });
  return (
    <>
      <section className="max-w-[760px] mx-auto text-center pb-16">
        <h1 className="font-serif text-5xl sm:text-6xl text-primary tracking-tight mb-4">
          The Partner Brief
        </h1>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-5">
          A Channel Architect planning tool
        </p>
        <p className="text-lg text-muted-foreground mb-8">
          A working draft for your partner program, built from your choices.
        </p>
        <p className="text-base text-foreground leading-relaxed">
          Explore a partner motion, pressure-test the assumptions, and decide what to validate with
          customers and partners before committing resources.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-primary mb-6 text-center">Start with a scenario</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SCENARIO_LIST.map((s) => (
            <ScenarioCard key={s.id} scenario={s} onSelect={onSelect} />
          ))}
        </div>
        <div className="max-w-[760px] mx-auto mt-12 border border-border bg-card p-6">
          <h3 className="font-serif text-xl text-primary mb-2">Or use your company</h3>
          <p className="text-sm text-muted-foreground mb-5">
            Keep customer details non-sensitive. Drafts stay in this browser only.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["label", "Company or project name", true],
                ["arr", "ARR or stage context", false],
                ["motion", "Current sales motion", false],
                ["icp", "Ideal customer", true],
                ["ask", "Strategic partner goal", true],
              ] as const
            ).map(([key, label, required]) => (
              <label key={key} className="text-sm text-foreground">
                <span className="block mb-1">
                  {label}
                  {required ? " *" : ""}
                </span>
                <input
                  className="w-full border border-border bg-background px-3 py-2"
                  value={custom[key]}
                  maxLength={240}
                  onChange={(event) => setCustom({ ...custom, [key]: event.target.value })}
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={createCustom}
            disabled={!custom.label.trim() || !custom.icp.trim() || !custom.ask.trim()}
            className="mt-5 bg-primary text-primary-foreground px-5 py-2.5 text-sm disabled:opacity-40"
          >
            Design for my company
          </button>
        </div>
        {drafts.length > 0 && (
          <div className="max-w-[760px] mx-auto mt-12">
            <h3 className="font-serif text-xl text-primary mb-3">
              Saved program versions on this device
            </h3>
            <ul className="space-y-2">
              {drafts.map((draft) => (
                <li key={draft.id}>
                  <button
                    type="button"
                    onClick={() => onOpenDraft(draft)}
                    className="text-left underline underline-offset-4 text-primary"
                  >
                    {draft.scenario.label} · v{draft.version} · Local draft, unapproved ·{" "}
                    {draft.owner} · {new Date(draft.savedAt).toLocaleString()}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </>
  );
}

function OutputView({
  scenario,
  settings,
  sections,
  draft,
  onRecordLocalEndorsement,
  onRegenerate,
  onStartOver,
}: {
  scenario: Scenario;
  settings: AxisSettings;
  sections: Sections;
  draft?: SavedDraft;
  onRecordLocalEndorsement: (name: string) => void;
  onRegenerate: () => void;
  onStartOver: () => void;
}) {
  const [reviewer, setReviewer] = useState("");
  return (
    <div className="max-w-[760px] mx-auto">
      <div
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8"
        data-print-hide
      >
        <div className="flex-1">
          <ScenarioSummary scenario={scenario} settings={settings} />
          {draft && (
            <div className="mt-3 border border-border bg-card p-4 text-sm">
              <div className="flex flex-wrap gap-x-5 gap-y-1">
                <span>
                  Owner: <strong>{draft.owner}</strong>
                </span>
                <span>
                  Version: <strong>v{draft.version}</strong>
                </span>
                <span>
                  Design rules: <strong>{draft.engineVersion}</strong>
                </span>
                <span>
                  Status: <strong>Local draft, unapproved</strong>
                </span>
              </div>
              {draft.localEndorsement && (
                <p className="mt-2 text-muted-foreground">
                  Local endorsement noted by {draft.localEndorsement.name} ·{" "}
                  {new Date(draft.localEndorsement.at).toLocaleString()}
                </p>
              )}
              <div className="mt-3 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground mb-2">
                  Local note only: this does not verify identity, permission, or program approval.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    aria-label="Endorser name"
                    className="min-w-0 flex-1 border border-border bg-background px-3 py-2"
                    value={reviewer}
                    maxLength={120}
                    onChange={(event) => setReviewer(event.target.value)}
                    placeholder="Endorser name"
                  />
                  <button
                    type="button"
                    onClick={() => onRecordLocalEndorsement(reviewer)}
                    disabled={!reviewer.trim()}
                    className="bg-primary text-primary-foreground px-4 py-2 disabled:opacity-40"
                  >
                    Record local endorsement
                  </button>
                </div>
              </div>
            </div>
          )}
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
            Revise design
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
          <OutputSection key={key} letter={letter} title={title} markdown={sections[key] ?? ""} />
        ))}
      </article>

      <footer className="mt-20 pt-8 border-t border-border">
        <p className="text-xs italic text-muted-foreground leading-relaxed">
          <span className="not-italic font-semibold text-foreground">Planning draft.</span> This
          design is produced by a transparent rules-based framework using the inputs shown above. It
          does not call an AI model, contain verified market benchmarks, or establish commercial
          terms. Validate assumptions with your team, partners, and customers. See{" "}
          <Link to="/about" className="underline underline-offset-2">
            /about
          </Link>{" "}
          for details.
        </p>
      </footer>
    </div>
  );
}

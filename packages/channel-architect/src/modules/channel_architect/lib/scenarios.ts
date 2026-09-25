import type { Scenario, ScenarioId } from "./types";

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  "ai-infra-b": {
    id: "ai-infra-b",
    label: "AI Infrastructure, Series B",
    arr: "$20M ARR",
    motion: "PLG with sales-assist",
    icp: "Engineering leaders at mid-market tech companies",
    ask: "Crack enterprise and reduce direct-sales reliance",
    defaults: {
      economics: { resell: 0, refer: 20, influence: 70, buildOn: 10 },
      primaryArchetypes: ["SI / Consulting", "ISV"],
      secondaryArchetypes: ["Referral / Agency"],
      stage: "Scaling ($10-50M ARR)",
    },
  },
  "vertical-ai-a": {
    id: "vertical-ai-a",
    label: "Vertical AI SaaS, Series A",
    arr: "$5M ARR",
    motion: "Founder-led sales",
    icp: "Mid-market customers in regulated industries (legal/healthcare)",
    ask: "Accelerate vertical penetration and reduce founder time per deal",
    defaults: {
      economics: { resell: 0, refer: 30, influence: 60, buildOn: 10 },
      primaryArchetypes: ["SI / Consulting", "Referral / Agency"],
      secondaryArchetypes: ["ISV"],
      stage: "Early Scale ($1-10M ARR)",
    },
  },
  "ai-devtools-c": {
    id: "ai-devtools-c",
    label: "AI Developer Tools, Series C",
    arr: "$50M ARR",
    motion: "PLG expanding to platform sales",
    icp: "Developers and platform teams",
    ask: "Build ISV ecosystem and reduce CAC via partner-influenced enterprise deals",
    defaults: {
      economics: { resell: 10, refer: 20, influence: 30, buildOn: 40 },
      primaryArchetypes: ["ISV", "Marketplace"],
      secondaryArchetypes: ["SI / Consulting"],
      stage: "Scaling ($10-50M ARR)",
    },
  },
};

export const SCENARIO_LIST = Object.values(SCENARIOS);

export type ScenarioId = "ai-infra-b" | "vertical-ai-a" | "ai-devtools-c";

export type Archetype =
  | "SI / Consulting"
  | "ISV"
  | "VAR"
  | "MSP"
  | "Referral / Agency"
  | "Marketplace";

export type Stage =
  | "Pre-PMF"
  | "Early Scale ($1-10M ARR)"
  | "Scaling ($10-50M ARR)"
  | "Mature ($50M+ ARR)";

export interface EconomicMix {
  resell: number;
  refer: number;
  influence: number;
  buildOn: number;
}

export interface AxisSettings {
  economics: EconomicMix;
  primaryArchetypes: Archetype[];
  secondaryArchetypes: Archetype[];
  stage: Stage;
}

export interface Scenario {
  id: ScenarioId | "custom";
  label: string;
  arr: string;
  motion: string;
  icp: string;
  ask: string;
  defaults: AxisSettings;
}

export type SectionKey =
  | "exec-summary"
  | "strategic-rationale"
  | "ipp"
  | "tiering"
  | "economics"
  | "motions"
  | "enablement"
  | "launch-plan"
  | "risks";

import type { AxisSettings, Scenario, Sections } from "./types";

export type { Sections } from "./types";
export { DESIGN_ENGINE_VERSION } from "./types";

const ROLES = ["resell", "refer", "influence", "buildOn"] as const;
const ROLE_NAMES = {
  resell: "Resell",
  refer: "Referral",
  influence: "Influence",
  buildOn: "Build-on",
};

export function validateDesignInputs(scenario: Scenario, settings: AxisSettings): string[] {
  const errors: string[] = [];
  if (!scenario.label.trim() || !scenario.icp.trim() || !scenario.ask.trim()) {
    errors.push("Company, ideal customer, and strategic goal are required.");
  }
  const values = ROLES.map((role) => settings.economics[role]);
  if (
    values.some((value) => !Number.isInteger(value) || value < 0 || value > 100) ||
    values.reduce((sum, value) => sum + value, 0) !== 100
  ) {
    errors.push("Planning emphasis must use whole numbers from 0 to 100 that total 100%.");
  }
  if (!settings.primaryArchetypes.length) errors.push("Choose at least one primary partner type.");
  return errors;
}

export function generateDesign(scenario: Scenario, settings: AxisSettings): Sections {
  const errors = validateDesignInputs(scenario, settings);
  if (errors.length) throw new Error(errors.join(" "));

  const ranked = [...ROLES].sort((a, b) => settings.economics[b] - settings.economics[a]);
  const active = ranked.filter((role) => settings.economics[role] > 0);
  const lead = active[0];
  const partnerTypes = settings.primaryArchetypes.join(", ");
  const isPrePmf = settings.stage === "Pre-PMF";
  const partnerUnit = isPrePmf ? "design partners" : "pilot partners";
  const roles = active
    .map((role) => `${ROLE_NAMES[role]} ${settings.economics[role]}%`)
    .join(" · ");
  const secondary = settings.secondaryArchetypes.length
    ? `Secondary candidates: ${settings.secondaryArchetypes.join(", ")}. Keep these exploratory until the primary motion works.`
    : "No secondary partner types selected. Keep the first pilot focused.";
  const roleWork: Record<(typeof ROLES)[number], string> = {
    resell: "partner-owned sales, quoting, and customer handoff",
    refer: "qualified introductions with a clear acceptance and feedback loop",
    influence: "documented partner contribution to opportunities already in motion",
    buildOn: "integrations or complementary solutions that customers actually use",
  };
  const leadWork = roleWork[lead];
  const stageGuardrail = isPrePmf
    ? "Do not launch a formal tiered program yet. Learn with a small number of design partners before committing to incentives or a portal."
    : "Start with a narrow pilot. Expand only after repeatable partner value and operating capacity are visible.";
  const evidence =
    "**Evidence status:** This is a planning hypothesis derived from the inputs above, not a benchmark, forecast, or validated customer finding.";

  return {
    "exec-summary": `**Company context supplied:** ${scenario.label}; ${scenario.arr || "ARR not supplied"}; ${scenario.motion || "sales motion not supplied"}. Target customer: ${scenario.icp}. Strategic goal: ${scenario.ask}.\n\n**Design direction:** ${isPrePmf ? "Run a design-partner discovery pilot" : `Pilot a ${ROLE_NAMES[lead].toLowerCase()}-led partner motion`} with ${partnerTypes}. Planning emphasis: ${roles}. These percentages allocate attention, not commissions or revenue credit.\n\n**Decision gate:** ${stageGuardrail}\n\n${evidence}`,
    "strategic-rationale": `### Why this motion\nThe stated goal is **${scenario.ask}**. A ${ROLE_NAMES[lead].toLowerCase()}-led pilot tests whether partners can create value through ${leadWork} for **${scenario.icp}**.\n\n### What must be learned\n- Can a partner identify a specific customer problem and make the next step happen?\n- Does the vendor have a named owner who can respond and support the partner?\n- Is the outcome incremental, or would the same deal have happened directly?\n\n${stageGuardrail}\n\n${evidence}`,
    ipp: `### Primary profile\nRecruit for **${partnerTypes}** that already serve **${scenario.icp}**. Prioritize proven customer access, a complementary offer, a named delivery or sales owner, and willingness to run a measured pilot.\n\n### Screening questions\n1. Which specific customer workflow can we improve together?\n2. Who owns the relationship, delivery, and support on each side?\n3. What permission exists to discuss or share customer information?\n4. What would count as a useful result for both parties?\n\n${secondary}\n\n${evidence}`,
    tiering: isPrePmf
      ? `**No formal tiers yet.** Use a single design-partner status with a written hypothesis, named owners, and a review date. Do not promise future benefits or exclusivity.\n\nPromotion criterion: repeatable customer value, not a logo or signed agreement.\n\n${evidence}`
      : `### Pilot status\nInvite a limited cohort with a named sponsor, agreed customer use case, onboarding checklist, and review date. Benefits are access to a joint plan and support, not automatic discounts.\n\n### Scale status, proposed only\nConsider a higher tier after evidence of customer outcomes, reliable collaboration, and support capacity. Define thresholds from observed pilot data before publishing them.\n\n${evidence}`,
    economics: `### Planning emphasis, not payout terms\n${active.map((role) => `- **${ROLE_NAMES[role]}: ${settings.economics[role]}%** of design attention. Test ${roleWork[role]}.`).join("\n")}\n\nNo commission rates, margins, revenue-share terms, or ROI are implied by these weights. Before any commercial offer, model unit economics, attribution, payment triggers, clawbacks, and legal approval using actual company data.\n\n${evidence}`,
    motions: `### First motion: ${ROLE_NAMES[lead]}\nDefine a single pilot workflow for ${leadWork}. State the customer trigger, partner action, vendor response, handoff owner, and outcome to record.\n\n${active.slice(1).length ? `### Later tests\n${active.slice(1).map((role) => `- ${ROLE_NAMES[role]}: test ${roleWork[role]} after the first workflow is operable.`).join("\n")}` : "Keep other motions out of scope until the first one is understood."}\n\nDo not count a partner-influenced opportunity as partner-sourced. Preserve separate source, influence, and fulfillment fields.\n\n${evidence}`,
    enablement: `### ${isPrePmf ? "Design-partner" : "Pilot-partner"} onboarding\n- One-page customer problem and ideal customer profile.\n- Demo or discovery script for **${scenario.icp}**.\n- Role-specific workflow for **${ROLE_NAMES[lead]}**, including what the partner may and may not promise.\n- Named contacts, escalation path, data-sharing permissions, and a feedback cadence.\n- A joint practice run before customer outreach.\n\nOnly create scaled certification or tier-specific materials after the pilot exposes a repeatable need.\n\n${evidence}`,
    "launch-plan": `### Days 1–30: frame and recruit\nConfirm the target customer problem, choose a small set of ${partnerUnit}, assign owners, and record a baseline for the direct motion. Agree on one ${ROLE_NAMES[lead].toLowerCase()} workflow.\n\n### Days 31–60: run\nOnboard partners, work real customer cases with consent, log each handoff and outcome, and hold a weekly friction review.\n\n### Days 61–100: decide\nReview customer outcomes, partner effort, vendor effort, incremental contribution, and support burden. Continue, revise, or stop. ${isPrePmf ? "Stay in discovery until product-market fit evidence supports a repeatable channel motion." : "Only then set tier thresholds or commercial terms."}\n\n${evidence}`,
    risks: `- **False attribution:** Separate sourced, influenced, and fulfilled activity. Capture the evidence and decision owner.\n- **Premature complexity:** ${stageGuardrail}\n- **Partner/customer mismatch:** Validate access to ${scenario.icp} with real cases before scaling recruitment.\n- **Unpriced obligations:** Do not publish payout or support promises before finance, legal, and operations review.\n- **Data and trust:** Obtain permission for shared customer data; define access, retention, and revocation.\n- **Unverified claims:** Treat this document as hypotheses until customer, partner, and company evidence is attached.\n\n${evidence}`,
  };
}

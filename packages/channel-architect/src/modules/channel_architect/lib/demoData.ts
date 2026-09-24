import type { AxisSettings, Scenario } from "./types";

export type DemoProgram = {
  name: string;
  scenario: Scenario;
  settings: AxisSettings;
  reviewRationale: string;
  pilot: {
    name: string;
    cohortLabel: string;
    durationDays: number;
    checkpoints: { title: string; dayOffset: number }[];
  };
};

/** Fictional examples for product demonstrations. These are not benchmarks or forecasts. */
export const DEMO_PROGRAMS: DemoProgram[] = [
  {
    name: "Northstar Vector Enterprise SI Program",
    scenario: {
      id: "custom",
      label: "Northstar Vector",
      arr: "$18M ARR",
      motion: "Product-led adoption with sales-assisted enterprise expansion",
      icp: "Data and platform engineering teams at mid-market software companies",
      ask: "Test whether implementation partners can shorten enterprise activation without making services a prerequisite",
      defaults: {
        economics: { resell: 0, refer: 15, influence: 70, buildOn: 15 },
        primaryArchetypes: ["SI / Consulting"],
        secondaryArchetypes: ["ISV", "Referral / Agency"],
        stage: "Scaling ($10-50M ARR)",
      },
    },
    settings: {
      economics: { resell: 0, refer: 15, influence: 70, buildOn: 15 },
      primaryArchetypes: ["SI / Consulting"],
      secondaryArchetypes: ["ISV", "Referral / Agency"],
      stage: "Scaling ($10-50M ARR)",
    },
    reviewRationale:
      "Approve a limited design-partner pilot. Keep implementation optional, define a repeatable activation milestone, and review partner-sourced versus partner-influenced evidence separately.",
    pilot: {
      name: "Enterprise Activation Design Partner Pilot",
      cohortLabel: "Synthetic cohort, mid-market data platforms",
      durationDays: 42,
      checkpoints: [
        { title: "Confirm partner profile and customer-fit criteria", dayOffset: 7 },
        { title: "Review first joint activation plans", dayOffset: 21 },
        { title: "Assess time-to-first-value and enablement friction", dayOffset: 35 },
        { title: "Record continue, revise, or stop recommendation", dayOffset: 42 },
      ],
    },
  },
  {
    name: "Juniper Harbor Responsible AI Advisory Program",
    scenario: {
      id: "custom",
      label: "Juniper Harbor AI",
      arr: "$4.5M ARR",
      motion: "Founder-led sales with a small direct enterprise team",
      icp: "Operations and compliance leaders at regional financial-services firms",
      ask: "Learn whether specialist advisors can improve qualified access while preserving implementation and risk accountability",
      defaults: {
        economics: { resell: 0, refer: 35, influence: 55, buildOn: 10 },
        primaryArchetypes: ["Referral / Agency", "SI / Consulting"],
        secondaryArchetypes: ["ISV"],
        stage: "Early Scale ($1-10M ARR)",
      },
    },
    settings: {
      economics: { resell: 0, refer: 35, influence: 55, buildOn: 10 },
      primaryArchetypes: ["Referral / Agency", "SI / Consulting"],
      secondaryArchetypes: ["ISV"],
      stage: "Early Scale ($1-10M ARR)",
    },
    reviewRationale:
      "Return for revision before pilot. Add explicit data-handling boundaries, a named internal owner for risk questions, and a qualification rule that avoids implying regulatory approval.",
    pilot: {
      name: "Responsible AI Advisory Readiness Pilot",
      cohortLabel: "Synthetic cohort, regulated-industry advisory firms",
      durationDays: 35,
      checkpoints: [
        { title: "Approve partner-facing claims and data boundaries", dayOffset: 7 },
        { title: "Run a qualification and escalation tabletop", dayOffset: 18 },
        { title: "Review advisor feedback and internal handoffs", dayOffset: 28 },
        { title: "Decide whether the revised model is ready to test", dayOffset: 35 },
      ],
    },
  },
  {
    name: "Copperline Developer Ecosystem Launch",
    scenario: {
      id: "custom",
      label: "Copperline Build",
      arr: "$52M ARR",
      motion: "Developer-led adoption expanding into platform agreements",
      icp: "Developer-platform teams standardizing build and release workflows",
      ask: "Test whether a small set of integration partners can improve product discovery and platform adoption",
      defaults: {
        economics: { resell: 10, refer: 20, influence: 25, buildOn: 45 },
        primaryArchetypes: ["ISV", "Marketplace"],
        secondaryArchetypes: ["SI / Consulting"],
        stage: "Mature ($50M+ ARR)",
      },
    },
    settings: {
      economics: { resell: 10, refer: 20, influence: 25, buildOn: 45 },
      primaryArchetypes: ["ISV", "Marketplace"],
      secondaryArchetypes: ["SI / Consulting"],
      stage: "Mature ($50M+ ARR)",
    },
    reviewRationale:
      "Approve a narrow integration pilot. Require a maintained integration owner, a documented support boundary, and evidence of activation rather than listing or announcement volume.",
    pilot: {
      name: "Integration-Led Platform Adoption Pilot",
      cohortLabel: "Synthetic cohort, build-and-release ecosystem",
      durationDays: 49,
      checkpoints: [
        { title: "Select integration use case and support owner", dayOffset: 7 },
        { title: "Validate integration workflow with internal users", dayOffset: 21 },
        { title: "Review adoption signals and support burden", dayOffset: 35 },
        { title: "Make an evidence-based continuation decision", dayOffset: 49 },
      ],
    },
  },
];

/** Produce valid future pilot dates without baking stale dates into the fixture pack. */
export function buildDemoPilotDates(program: DemoProgram, startDate = new Date()) {
  if (!Number.isFinite(startDate.getTime())) {
    throw new RangeError("Demo pilot start date must be a valid date.");
  }

  const durationDays = program.pilot.durationDays;
  const checkpoints = program.pilot.checkpoints;
  if (!Number.isInteger(durationDays) || durationDays < 1) {
    throw new RangeError("Demo pilot duration must be a positive whole number of days.");
  }
  if (checkpoints.length < 1 || checkpoints.length > 30) {
    throw new RangeError("Demo pilot schedules must contain between 1 and 30 checkpoints.");
  }
  if (
    checkpoints.some(
      ({ title, dayOffset }) =>
        typeof title !== "string" ||
        !title.trim() ||
        !Number.isInteger(dayOffset) ||
        dayOffset < 0 ||
        dayOffset > durationDays,
    )
  ) {
    throw new RangeError("Demo checkpoint offsets must be whole days within the pilot window.");
  }

  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0, 0);
  const toDateOnly = (date: Date) => {
    const year = date.getUTCFullYear();
    if (!Number.isFinite(date.getTime()) || year < 0 || year > 9999) {
      throw new RangeError("Demo pilot dates must fit the YYYY-MM-DD format.");
    }
    return `${String(year).padStart(4, "0")}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  };
  const addDays = (days: number) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + days);
    return toDateOnly(date);
  };

  return {
    targetStartDate: toDateOnly(start),
    targetEndDate: addDays(durationDays),
    checkpoints: checkpoints.map(({ title, dayOffset }) => ({
      title,
      dueDate: addDays(dayOffset),
    })),
  };
}

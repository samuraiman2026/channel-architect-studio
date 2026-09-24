# Channel Architect demo data

This pack contains three fictional partner-program briefs for demonstrating the Open Mercato module. It does not create or modify database records. Enter the examples through the Partner programs screen so normal authentication, review separation, audit logging, and pilot rules remain in effect.

The typed source data is in `src/modules/channel_architect/lib/demoData.ts`. Each record includes the exact scenario fields and planning emphasis accepted by the create form, reviewer rationale, and a pilot outline. Pilot dates are generated relative to the day you start the demo, so the examples do not become stale.

## Suggested 10-minute walkthrough

Use two authorized accounts: one to create programs and operate pilots, and a different account with approval access to review them. The creator cannot review their own program version. The examples and all partner cohorts are fictional; do not add real partner or customer names to the cohort field.

1. Create **Northstar Vector Enterprise SI Program** from the first `DEMO_PROGRAMS` entry. Show how the strategic goal, customer profile, partner archetypes, stage, and 100% planning emphasis shape the generated hypothesis.
2. Sign in as the reviewer, approve version 1 with its supplied review rationale, then return as the operator and create its pilot. Generate dates with `buildDemoPilotDates` and enter the resulting target dates and checkpoints.
3. Start the pilot, complete a checkpoint, and show that a final outcome is unavailable until every checkpoint is completed or skipped. Complete with `continue` for the walkthrough.
4. Create **Juniper Harbor AI** and reject it using the supplied rationale. This demonstrates a clear review decision without suggesting that generated guidance is evidence or regulatory advice.
5. Create **Copperline Build** and approve it using a focused rationale adapted from its pilot description. Start a pilot and leave it planned to show multiple records and lifecycle states in the list.
6. Open a program's history, revise its inputs, and show that the new version is a draft while the earlier review remains attached to its original immutable version.

## Data and date notes

- All company names, financial context, goals, and cohorts are synthetic examples created for demos.
- ARR figures are context supplied to the design engine, not verified facts.
- Planning emphasis percentages are not commissions, margin, attribution, or revenue credit.
- Generated program content is a hypothesis, not a benchmark, forecast, commercial offer, or compliance determination.
- The Juniper Harbor example intentionally demonstrates a rejected review. It should not be approved without first revising the stated risk and accountability boundaries.
- `buildDemoPilotDates(program, startDate?)` returns date-only strings for the pilot and checkpoints. Pass a fixed UTC date in tests or a live date for demonstrations.

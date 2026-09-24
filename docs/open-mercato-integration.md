# Open Mercato integration boundary

This repository is the Studio prototype and design reference, not the operational PRM system. The current design engine runs entirely in the browser. Drafts are snapshots in localStorage. There is no authentication, tenant isolation, shared storage, enforced approval, partner record, or live CRM integration here.

## Next vertical slice

Build an original `@open-mercato/channel-architect` module for a standalone Open Mercato host application. Open Mercato's current module system supports custom entities, API routes, and backend pages as an external extension, without changing core. Use a locally ejected module when the product needs to own its source. Verify the host's supported APIs and version before implementation. The separate PRM ready-app repository has no identified license as of 2026-09-23; do not copy its code without permission. See the [module development guide](https://github.com/open-mercato/open-mercato/blob/main/.ai/docs/module-development.md) and the [official module workspace](https://github.com/open-mercato/official-modules).

1. **Program**: vendor organization, name, strategic goal, owner, status.
2. **Program version**: immutable input snapshot (`Scenario` and `AxisSettings`), deterministic engine version, output sections, creator, timestamp, and review state. Revisions create a new version, never overwrite the approved one.
3. **Decision**: approver, decision, rationale, and timestamp. Only an approved version may activate a pilot.
4. **Pilot**: linked program version, cohort, owner, checkpoints, and continue/revise/stop decision.
5. **Enrollment and contribution**: link partner organization and opportunity records to the governing program version. Keep sourced, influenced, resold, and built-on roles distinct, with evidence and reviewer.

The first migration step is to make `generateDesign()` in `src/lib/designEngine.ts` a shared, versioned service and persist its exact inputs and outputs server-side. Local drafts must be treated as unapproved, untrusted imports. Never use client-provided prose, payouts, or tier status as authority for operational actions.

## Acceptance checks for the Open Mercato slice

- A user can create a program, change its design, and inspect both versions.
- A second authorized user can review and approve one version; unauthorized users cannot.
- One pilot enrollment and one opportunity contribution link to the approved version.
- All records remain within their tenant and preserve actor, time, and source.
- A rejected or superseded version cannot silently alter active partner terms.

Commercial rates, source data, evidence attachments, and model-assisted narrative are later work. Planning-emphasis percentages in the Studio are not commissions or forecasts.

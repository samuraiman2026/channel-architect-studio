# Open Mercato integration boundary

This repository is the Studio prototype and design reference, not the operational PRM system. The current design engine runs entirely in the browser. Drafts are snapshots in localStorage, limited to 20 per browser. There is no authentication, tenant isolation, shared storage, approval, partner record, or live CRM integration here.

## Next vertical slice

Build an original Channel Architect module on the MIT-licensed Open Mercato core. Verify the installed core's module hooks and entity APIs before implementing this contract. The separate PRM ready-app repository has no identified license as of 2026-09-23; do not copy its code without permission.

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

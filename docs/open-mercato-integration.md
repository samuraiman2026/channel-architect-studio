# Open Mercato integration boundary

This repository is the Studio prototype and design reference, not the operational PRM system. The current design engine runs entirely in the browser. Drafts are snapshots in localStorage. There is no authentication, tenant isolation, shared storage, enforced approval, partner record, or live CRM integration here.

## Integration progress

Build an original `@open-mercato/channel-architect` module for a standalone Open Mercato host application. Open Mercato's current module system supports custom entities, API routes, and backend pages as an external extension, without changing core. Use a locally ejected module when the product needs to own its source. Verify the host's supported APIs and version before implementation. The separate PRM ready-app repository has no identified license as of 2026-09-23; do not copy its code without permission. See the [module development guide](https://github.com/open-mercato/open-mercato/blob/main/.ai/docs/module-development.md) and the [official module workspace](https://github.com/open-mercato/official-modules).

The deterministic generator, input/output types, and scenario presets now live in `packages/channel-architect`, and the Studio imports that canonical implementation. New local drafts record the engine version; legacy drafts are labeled `legacy-unversioned`. The Open Mercato module now includes tenant-scoped Program, ProgramVersion, and ProgramReview entities, feature grants, input validators, command handlers, authenticated API routes, and an initial backend workspace for create/revise/review and version history. The package build explicitly preserves TypeScript's legacy decorator transform, which MikroORM's legacy decorators require at runtime.

The current Studio is still browser-local. Its approval affordance is not authenticated approval. Open Mercato 0.6.x sandbox generation discovered the module's entities, API routes, and backend page. A separate standalone-layout check confirmed that the CLI resolves `@open-mercato/channel-architect` from `node_modules`, targets `dist/modules/channel_architect`, and can load all three entity classes. The module source has no remaining diagnostics in the targeted host typecheck output, but the full sandbox typecheck still fails on unrelated generated-route and duplicate-Zod issues elsewhere in the host. The OpenAPI generator also hits an environment limitation: the sandbox's `isolated-vm` native build is unavailable under Node 26.7. Migration generation still requires a reachable PostgreSQL database and has not been confirmed; no migration was applied. End-to-end authorization/data checks remain outstanding, so the module is not install-ready yet.

1. **Program**: tenant/organization, name, owner user ID, state, current version, and timestamps.
2. **Program version**: immutable `Scenario` and `AxisSettings` snapshots, deterministic engine version, generated sections, creator, and timestamp. Revisions append; they do not overwrite prior or approved versions.
3. **Review decision**: approver, decision, rationale, and timestamp. At most one final decision applies to one immutable version. Approval does not transfer to later versions.
4. **Pilot**: later scope, linked to a specific reviewed program version, cohort, owner, checkpoints, and continue/revise/stop decision.
5. **Enrollment and contribution**: later scope, link partner organization and opportunity records to the governing program version. Keep sourced, influenced, resold, and built-on roles distinct, with evidence and reviewer.

Persist the exact engine inputs and outputs server-side through the Open Mercato host. Local drafts must be treated as unapproved, untrusted imports. Never use client-provided prose, payouts, or tier status as authority for operational actions.

## Acceptance checks for the Open Mercato slice

- A user can create a program, change its design, and inspect both versions.
- A second authorized user can review and approve one version; unauthorized users cannot.
- One pilot enrollment and one opportunity contribution link to the approved version.
- All records remain within their tenant and preserve actor, time, and source.
- A rejected or superseded version cannot silently alter active partner terms.

Commercial rates, source data, evidence attachments, and model-assisted narrative are later work. Planning-emphasis percentages in the Studio are not commissions or forecasts.

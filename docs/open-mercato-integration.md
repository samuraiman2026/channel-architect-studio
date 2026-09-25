# Open Mercato integration

## Product boundary

Channel Architect contains two related experiences, not one shared deployment:

- **The Partner Brief** is a standalone, browser-local planning tool. It has no login, shared database, or server-side review.
- `packages/channel-architect` is an Open Mercato 0.6.x extension with authenticated, tenant- and organization-scoped programs, immutable versions, review decisions, pilots, and checkpoints.

Both use the deterministic design engine in `packages/channel-architect/src/modules/channel_architect/lib/`. A draft made in the standalone app is not synchronized into Open Mercato. Local endorsement notes are not authenticated approvals.

The module extends Open Mercato without patching core. It does not manage CRM partner records, opportunity attribution, enrollment, commissions, payouts, or payment execution. Planning-emphasis percentages are not commission rates, margin, or revenue credit. Generated copy is a hypothesis, not a verified benchmark or forecast.

## Current implementation and verification

The initial module scope is implemented: program and version persistence, review workflow, pilot/checkpoint workflow, default feature grants, scoped API routes and commands, backend list/detail forms, search, filters, version history, and migration artifacts.

The package was integrated with Open Mercato CLI/Core/Shared/UI 0.6.0. Its initial migration was applied only to a disposable PostgreSQL 17 acceptance database. The host Playwright acceptance flow was run there, covering role grants, owner/reviewer separation, organization isolation, version creation and revision, approval/rejection, pilot transitions and checkpoints, and archive constraints. This validation does not migrate a new host or authorize applying the migration to any other database.

The standalone and demo-data tests can be run from the repository root:

```sh
bun test src/lib packages/channel-architect/tests/demoData.test.ts
```

The Open Mercato command tests require the host's Open Mercato and MikroORM peer packages. The module acceptance scenario lives at `packages/channel-architect/src/modules/channel_architect/__integration__/TC-CHANNEL-ARCHITECT-001.spec.ts` and is intentionally omitted from package runtime output.

One broader validation caveat remains: the focused module type-check succeeds against the pinned host packages, while the wider sandbox type-check has a transitive duplicate-React type mismatch. The host's bundled OpenAPI generator also falls back to static parsing when `isolated-vm` lacks a native build for the installed Node version. Neither caveat changes the module's migration or data-scope rules.

## Install into a host

See the [module installation guide](../packages/channel-architect/README.md) for the full command sequence. In brief: build the local package, add it to a separate Open Mercato 0.6.x host using a local file dependency, enable the module, regenerate host registries, then review and apply the migration through the host's normal process. Use a fresh disposable database for acceptance and demos. For production, require the operator's migration review, backup, and release procedure.

When the module is enabled in a host that already has users and roles, synchronize the default grants with:

```sh
yarn mercato auth sync-role-acls
```

The `admin` and `superadmin` setup defaults include all program and pilot permissions. `employee` defaults to view-only access. A program owner or version creator cannot review that version. Every request must still be authorized by the host; client-supplied tenant, organization, actor, reviewer, or version values are not authoritative.

## Records and workflows

1. **Program:** stable identity, owning user, lifecycle status, current version, and tenant/organization scope.
2. **Program version:** append-only input and output snapshot, scenario, planning settings, engine version, creator, and timestamp. Revisions append instead of editing prior versions.
3. **Review:** one immutable approve/reject decision and rationale for one version. Approval does not carry forward to later versions.
4. **Pilot:** bound to the current approved program version at creation. Operators use the documented lifecycle and resolve all checkpoints before recording a continue/revise/stop outcome.

Module records use scalar IDs rather than cross-module ORM relationships. Domain writes go through audited, non-undoable commands. API reads and writes are scoped to the authenticated tenant and organization, including detail, review, revision, archive, pilot, and checkpoint operations.

## Demo data

Fictional programs and the guided walkthrough are documented in [`packages/channel-architect/demo/README.md`](../packages/channel-architect/demo/README.md). They are typed examples, not a database seed. Enter them through the Open Mercato UI so real user identity, review separation, authorization, and audit behavior remain active. Never use the demo cohort labels for real customer or partner data.

## Remaining product boundaries

The module is a governed partner-program hypothesis and initial pilot tracker. Future work would be needed for partner CRM, opportunities and sourced/influenced evidence, enrollment, evidence attachments, commercial terms, payout execution, external-system synchronization, and model-assisted narrative. Do not infer these capabilities from the current program or pilot records.

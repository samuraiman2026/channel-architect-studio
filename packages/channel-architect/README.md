# Channel Architect for Open Mercato

`@open-mercato/channel-architect` is an extension module for Open Mercato 0.6.x. It adds shared partner-program design, independent review, immutable version history, and pilot/checkpoint tracking. It uses the deterministic design engine shared with The Partner Brief. It does not patch or fork Open Mercato core.

## Build and install

Build this package from the Channel Architect repository root:

```sh
bun run --cwd packages/channel-architect build
```

From a separate Open Mercato host root, install the local package. Replace the example path with the absolute path to this repository on your machine:

```sh
yarn add @open-mercato/channel-architect@file:/path/to/channel-architect-studio/packages/channel-architect
yarn mercato module enable @open-mercato/channel-architect
yarn generate
```

If the host already existed before enabling the module, synchronize default ACL grants:

```sh
yarn mercato auth sync-role-acls
```

For an acceptance or demo installation, configure the host to use a fresh disposable PostgreSQL database, review the generated migration, and apply it through the host's normal migration workflow:

```sh
yarn mercato db:migrate
```

Building the package does not run a migration. Always confirm the target database before migrating. For production, use the host operator's backup, review, and release process. The migration has been applied only in a disposable acceptance environment, not by this package build.

## Use the module

Open **Channel Architect → Partner Programs** in the Open Mercato backend. The module supports:

- Program creation with company context, strategic goal, planning emphasis, partner archetypes, and stage.
- Immutable program versions with reproducible generated output and engine version.
- Separate approve/reject decisions attached to individual versions.
- Pilots created only from a program's current approved version.
- Checkpoints, constrained pilot transitions, and explicit continue/revise/stop outcomes.
- Searchable and paginated program and pilot lists.

Default role grants are configured in `src/modules/channel_architect/setup.ts`. Administrators receive view/manage/approve and pilot management access. Employees receive view access. The program owner and version creator cannot review their own version. The host's server-side authorization remains authoritative even when the UI hides unavailable actions.

## Demo data

See [`demo/README.md`](demo/README.md) for the synthetic program briefs and a role-aware walkthrough. The fixtures are not an automatic database seeder. Enter them through the module so authenticated actors, independent review, authorization, audit metadata, and pilot constraints remain in force.

## Data and product boundaries

The package stores tenant- and organization-scoped programs, versions, review decisions, pilots, and checkpoints. It does not create or modify CRM partner records, opportunities, enrollments, commissions, revenue attribution, or payments. Planning-emphasis values are not commercial rates or revenue credit. Generated content is a hypothesis, not a benchmark, forecast, commercial offer, or compliance determination.

The Partner Brief remains browser-local. Its saved drafts and local endorsements are not shared with this module and are not authenticated approvals. See the root [developer and user guide](../../dev_context.md), the [Open Mercato integration notes](../../docs/open-mercato-integration.md), and [SPEC-001](../../.ai/specs/SPEC-001-channel-architect-open-mercato.md).

## Compatibility and verification

The package targets Open Mercato 0.6.x and was validated against CLI/Core/Shared/UI 0.6.0. The module migration and Playwright workflow were exercised in a disposable PostgreSQL 17 acceptance environment. That environment is separate from any host where you install this package.

The standalone/demo test slice is:

```sh
bun test src/lib packages/channel-architect/tests/demoData.test.ts
```

The command tests need Open Mercato and MikroORM peer dependencies from a host workspace. The host-discoverable Playwright acceptance scenario is `src/modules/channel_architect/__integration__/TC-CHANNEL-ARCHITECT-001.spec.ts`; host builds omit it from runtime output.

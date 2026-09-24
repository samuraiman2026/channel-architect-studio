# Channel Architect for Open Mercato

An original Open Mercato module package for partner-program design, reviewed version history, and pilot tracking. The backend design form captures planning emphasis, primary and secondary partner archetypes, and program stage, while version details display their immutable inputs. Approving a current version activates its program; archiving preserves history and blocks revisions and new pilots. The package targets Open Mercato 0.6.x and is maintained in the Channel Architect Studio repository.

The deterministic design engine and scenario presets live in `src/modules/channel_architect/lib/`. The Studio app imports those implementations directly. The module includes tenant-scoped program, version, review, pilot, and checkpoint entities; guarded API routes; registered state-transition commands; and a first backend workspace. Build the package with `npm run build` before connecting it to an Open Mercato host.

The module's discovery, runtime, and schema checks used the official-modules workspace at commit `2d548d603f6ae099ff95f17089b8a7d064b9541b`; its sandbox uses Open Mercato CLI/Core/Shared/UI `0.6.0`. Sandbox generation discovers all five entities, the program and pilot API routes, and the backend page. Runtime loading resolves all five entity classes, and a fresh runtime check against the pinned host packages confirms all seven program and pilot commands register. The host schema generator produced the initial PostgreSQL migration and matching snapshot against a disposable PostgreSQL 17 database. No migration has been applied. The package build preserves legacy decorators and includes the migration snapshot plus the entity source needed by the standalone schema generator. All seven commands include host audit metadata with redo inputs limited to safe identifiers/statuses, excluding free text, and are non-undoable. The Studio build, typecheck, and 36 deterministic-engine replay, pilot-rule, local-review migration, version-state, and mocked program/pilot-command tests pass. The command suite verifies tenant and organization scope rejection plus a competing revision that cannot persist a duplicate version. Checkpoint updates recheck pilot status inside the transaction lock to prevent a cancellation race. A targeted strict module typecheck passes against 0.6.0 types; a transitive duplicate-React type mismatch remains in the wider sandbox. The host's OpenAPI bundle path is unavailable because `isolated-vm` has no native build under Node 26.7; static fallback generation succeeds. Full host typecheck and end-to-end authorization/data checks remain outstanding. Do not apply migrations to any environment without an explicit request.

The host-discoverable Playwright acceptance scenario is in `src/modules/channel_architect/__integration__/TC-CHANNEL-ARCHITECT-001.spec.ts`. Open Mercato associates it with the `channel_architect` module, and the package build omits it from runtime output. It typechecks against the pinned host test package, but still needs to be run with this module installed in an Open Mercato sandbox and the migration applied to its disposable database.

It also creates a separate organization and verifies that an admin scoped to the original organization cannot access that organization's program using a guessed ID. This check is implemented in the acceptance scenario but has not yet been run against a migrated host.

## Connect to a local Open Mercato host

Build this package first from the Channel Architect Studio repository root:

```sh
npm run build --prefix packages/channel-architect
```

Then, from the root of a standalone Open Mercato 0.6.x host, add the local package and enable the module:

```sh
yarn add @open-mercato/channel-architect@file:/absolute/path/to/channel-architect-studio/packages/channel-architect
yarn mercato module enable @open-mercato/channel-architect
yarn generate
```

Before applying the migration, point `DATABASE_URL` at a fresh disposable PostgreSQL database and review the generated migration. Then run `yarn mercato db:migrate`, start the host, and execute the host's Playwright integration runner for `TC-CHANNEL-ARCHITECT-001`. For an already provisioned host, run `yarn mercato auth sync-role-acls` so existing roles receive the module's feature grants. Do not apply this migration to production as part of the acceptance run.

Program and pilot lists are tenant- and organization-scoped, paginated, searchable by name, and filterable by lifecycle status. The pilot list also resolves each pilot's program name and immutable version number, so pilots remain attributable to the right design even when another program is selected. Saving a program opens its persisted detail and version history. The backend UI reads Open Mercato feature grants to show role-appropriate controls, while every mutation remains enforced by the server.

Generated partner-program content is a planning hypothesis. It is not a benchmark, forecast, commercial offer, commission schedule, or source of attribution truth.

Fictional example programs and a role-aware walkthrough are in [`demo/README.md`](demo/README.md). The demo pack is opt-in and does not write records to a database; create its examples through the backend UI to preserve the module's normal authorization and review workflow.

See [SPEC-001](../../.ai/specs/SPEC-001-channel-architect-open-mercato.md) and the repository's [Open Mercato integration notes](../../docs/open-mercato-integration.md) for the intended data and security boundaries.

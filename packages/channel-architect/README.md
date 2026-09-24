# Channel Architect for Open Mercato

An original Open Mercato module package for partner-program design, reviewed version history, and pilot tracking. The package targets Open Mercato 0.6.x and is maintained in the Channel Architect Studio repository.

The deterministic design engine and scenario presets live in `src/modules/channel_architect/lib/`. The Studio app imports those implementations directly. The module includes tenant-scoped program, version, review, pilot, and checkpoint entities; guarded API routes; registered state-transition commands; and a first backend workspace. Build the package with `npm run build` before connecting it to an Open Mercato host.

Open Mercato 0.6.x sandbox generation discovers all five entities, the program and pilot API routes, and the backend page. Standalone runtime loading resolves the five entity classes and registers all six commands. The host schema generator produced the initial PostgreSQL migration and matching snapshot against a disposable PostgreSQL 17 database. No migration has been applied. The package build preserves legacy decorators and includes the migration snapshot plus the entity source needed by the standalone schema generator. The Studio build, typecheck, and 13 design-engine, pilot-rule, local-review migration, and version-state tests pass. A targeted module type-check found no package-owned errors against Open Mercato 0.6.x types, with one transitive upstream React type mismatch remaining. The host's OpenAPI bundle path is unavailable because `isolated-vm` has no native build under Node 26.7; static fallback generation succeeds. Full host typecheck and end-to-end authorization/data checks remain outstanding. Do not apply migrations to any environment without an explicit request.

Generated partner-program content is a planning hypothesis. It is not a benchmark, forecast, commercial offer, commission schedule, or source of attribution truth.

See [SPEC-001](../../.ai/specs/SPEC-001-channel-architect-open-mercato.md) and the repository's [Open Mercato integration notes](../../docs/open-mercato-integration.md) for the intended data and security boundaries.

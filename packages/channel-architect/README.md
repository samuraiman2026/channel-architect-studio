# Channel Architect for Open Mercato

An original Open Mercato module package for partner-program design and reviewed version history. The package targets Open Mercato 0.6.x and is maintained in the Channel Architect Studio repository.

The deterministic design engine and scenario presets live in `src/modules/channel_architect/lib/`. The Studio app imports those implementations directly. The module includes tenant-scoped entities, guarded API routes, version/review commands, and a first backend workspace. Build the package with `npm run build` before connecting it to an Open Mercato host.

The 0.6.x generator discovered the package's entities, API routes, and backend page in a temporary sandbox. A clean full host typecheck is still blocked by unrelated sandbox errors, and OpenAPI generation hits a missing `isolated-vm` native build under Node 26.7. Migration generation and end-to-end authorization checks remain outstanding. Do not apply migrations to a live environment as part of package setup.

Generated partner-program content is a planning hypothesis. It is not a benchmark, forecast, commercial offer, commission schedule, or source of attribution truth.

See [SPEC-001](../../.ai/specs/SPEC-001-channel-architect-open-mercato.md) and the repository's [Open Mercato integration notes](../../docs/open-mercato-integration.md) for the intended data and security boundaries.

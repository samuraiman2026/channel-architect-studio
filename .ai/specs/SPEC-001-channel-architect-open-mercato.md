# SPEC-001: Channel Architect module for Open Mercato

**Status:** Initial module scope implemented and validated in a disposable Open Mercato host
**Target host:** Open Mercato 0.6.x
**Module package:** `@open-mercato/channel-architect`
**Module ID:** `channel_architect`

## Implementation status

The shared deterministic engine has a pinned version registry, so persisted inputs replay only with their recorded engine; unsupported versions fail visibly. The Open Mercato package includes scenario presets, tenant-scoped program/version/review and pilot/checkpoint entities, validators, registered commands, guarded API routes, a backend workspace, default feature grants, and the initial migration. Program versions are immutable; reviews belong to one version; pilots require the current approved version. The host create/revise form captures planning emphasis, archetypes, and stage. Lists support search, pagination, and status filters. Program/pilot commands emit host audit metadata with safe redo payloads and are non-undoable. Review controls are withheld from the owner/version creator, and server authorization remains authoritative.

The standalone Studio continues to work without a host. Its drafts are browser-local, remain unapproved, and record the design-engine version. Historical local approval labels are migrated to clearly identified endorsement notes. The shared demo pack contains fictional examples only and does not seed a database.

Host discovery/runtime/schema checks used the official-modules sandbox and Open Mercato CLI/Core/Shared/UI 0.6.0. The initial schema migration was generated and applied only to a disposable PostgreSQL 17 acceptance database. The host Playwright acceptance scenario was run there and covers role grants, owner/reviewer separation, cross-organization isolation, persisted versions, approval/rejection, pilot creation and completion, stale/unapproved version rejection, and archive behavior. The package build excludes the acceptance spec from runtime output. The standalone and demo-data test slice passes; the module command suite additionally requires the host peer packages. Focused strict module type-checking passes against host packages. A transitive duplicate-React type mismatch remains in the wider sandbox check, and the host's bundled OpenAPI generator uses its static fallback when `isolated-vm` has no native build for the installed Node version.

## Outcome

Evolve Channel Architect Studio from a single-browser planning prototype into an installable Open Mercato module for designing, versioning, and reviewing partner programs. Preserve the standalone Studio experience while making one deterministic design engine the source of truth.

## Product boundary

- This module helps teams form and govern partner-program hypotheses. It does not claim that generated recommendations are validated benchmarks or forecasts.
- Planning-emphasis percentages are not commissions, margin, attribution, or revenue credit.
- Pilot tracking is an initial execution capability, bound to an approved program version. Partner CRM, opportunity attribution, enrollments, and payout execution remain later capabilities. The module does not mutate CRM or financial records.
- The Open Mercato module is an extension package. Do not fork or patch Open Mercato core for this product.
- Browser-local drafts are untrusted imports and remain clearly marked as local and unapproved.

## Data model

### Program

Tenant- and organization-scoped record containing the program name, company context, strategic goal, owner user ID, lifecycle state, current version number, creator, and timestamps. It is the stable identity across revisions.

### Program version

Append-only snapshot containing the program ID, sequential version number, exact scenario and axis inputs, generated section output, design-engine version, creator, and creation time. Neither input nor output is edited in place. A revision creates the next version. Enforce uniqueness for `(program_id, version_number)` and scope every read by tenant and organization.

### Review decision

Append-only record attached to one immutable version, with approved/rejected decision, authenticated reviewer ID, rationale, and time. Enforce at most one final decision per version. A review applies only to the reviewed version; a later revision is not approved by inheritance. Only users with `channel_architect.programs.approve` may decide.

Use scalar IDs between module records and other modules. Do not create cross-module ORM relationships.

### Pilot and checkpoint

A pilot is scoped to a tenant and organization and references one approved, current program version by ID. It records a name, cohort label, owner, target dates, lifecycle status, and final continue/revise/stop outcome. Checkpoints are separate scoped records with an ordered title, due date, and planned/completed/skipped status. Do not put individual partner/customer details or free-text personal notes in this first version.

## Workflows

1. An authorized user creates a program. The server derives tenant, organization, and actor from the authenticated request, validates the submitted design inputs, runs the versioned deterministic engine, and atomically stores the program and version 1.
2. An authorized manager revises the design. The server creates a new immutable version and updates the stable program's current version atomically. Concurrent revision attempts must not silently produce duplicate or out-of-order versions.
3. A separate authorized reviewer approves or rejects a specific version with rationale. Decisions are immutable. A reviewer cannot decide a version outside the active tenant/organization scope.
4. An authorized user can create a planned pilot only from the program's current approved version. Pilot creation snapshots that version ID, owner, cohort, date range, and at least one checkpoint.
5. Pilot operators move planned pilots to active or cancelled, pause/resume active pilots, and complete or skip checkpoints. A pilot can be completed only after every checkpoint is resolved, with an explicit continue/revise/stop outcome. Terminal states cannot be reopened.
6. The UI shows version history and clearly distinguishes draft, approved, rejected, and superseded states. Approval is not inherited by a later version.
7. Approving the current version activates a draft program. Archiving a program preserves its versions and decisions while preventing revisions and new pilots.

## Authorization and data safety

- `channel_architect.programs.view`: list and inspect programs in the current organization and tenant.
- `channel_architect.programs.manage`: create programs and append revisions.
- `channel_architect.programs.approve`: record a final review decision.
- Never trust client-supplied `tenantId`, `organizationId`, actor, reviewer, or current version values.
- The program owner and version creator cannot review that version, even if their role includes reviewer permission.
- Enforce organization and tenant scoping in every query and mutation, including nested version and decision lookup.
- Domain writes go through Open Mercato commands and mutation guard conventions. Commands must preserve audit and undo behavior where the host contract supports it; immutable versions and decisions must never be rewritten during undo.
- Treat an imported browser draft as input only. Revalidate and regenerate output on the server; do not import its claimed approval state.

## Initial scope

- Extract the deterministic generator and design types into the module source; Studio imports that canonical implementation.
- Define Open Mercato ACL and tenant setup defaults.
- Add persistent Program, ProgramVersion, and ReviewDecision entities, validators, scoped command handlers, and authenticated API routes.
- Add a backend list/create/detail/review experience with version history.
- Add persistent Pilot and PilotCheckpoint entities, authenticated create/list/status/checkpoint routes, and a backend pilot workflow. Require the current version to be approved and all checkpoints to be resolved before recording an outcome.
- Produce module migration artifacts for the host. Apply them only through the host operator's reviewed migration process, using a disposable database for acceptance.
- Add host-install documentation and record the tested Open Mercato version.

## Acceptance criteria

- Existing Studio generation still uses the same nine-section deterministic output after extraction.
- Two users in the same tenant can access shared program data according to their feature grants.
- A user in another tenant or organization cannot list, retrieve, revise, or review the program by guessing IDs.
- Every persisted version can be regenerated from its stored input and engine version, and prior versions remain unchanged after revisions.
- Only an authorized reviewer can create one immutable decision for a specific version.
- A pilot can only reference the current approved version at creation; concurrent program revision cannot make the pilot stale during creation.
- Pilot state transitions are constrained, checkpoints are tenant-scoped, and a completed pilot records one explicit continue/revise/stop outcome.
- A rejected or superseded version cannot be represented as the current approved version.
- Approving the current version activates its program, while archiving preserves history and prevents revisions and new pilots, including under concurrent requests.
- Generated prose is labeled as a hypothesis; no payout, forecast, or attribution authority is implied.
- Host compatibility is verified against Open Mercato 0.6.x before calling the module installable.

## Remaining product and validation boundaries

- The Studio repository is not itself an Open Mercato host. Each adopter must install the package, generate its host registries, configure role grants, and apply the migration through its own reviewed deployment process.
- The standalone Studio remains browser-local. Its endorsement note is not an authenticated review decision or authorization boundary.
- Partner CRM, opportunity attribution, enrollment, commercial-term execution, payouts, and external synchronization are out of scope for this module slice.
- The wider host sandbox type-check retains a transitive duplicate-React issue; see `docs/open-mercato-integration.md` for current validation notes.

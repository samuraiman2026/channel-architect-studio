# Developer and user context

This guide explains how to run Channel Architect from a fresh download, how to use its two product surfaces, and where the current boundaries are. The Partner Brief is the standalone browser planning tool. The Channel Architect module for Open Mercato is the separate team workspace. They share the design engine, but they do not share storage or identity.

## 1. What the product does

Channel Architect helps a SaaS team make a first partner-program hypothesis concrete. It combines company context, partner archetypes, program stage, and a 100-point allocation of planning emphasis, then produces nine sections:

1. Executive summary
2. Strategic rationale
3. Ideal partner profile
4. Tiering structure
5. Economic model
6. Motion selection
7. Enablement by tier
8. 100-day launch plan
9. Risks and watch-items

The engine is deterministic. It does not call an AI model or consult verified market benchmarks. Treat generated material as a draft for discussion and validation with real partners, customers, and internal teams.

The project provides two ways to use that engine:

| Experience                            | Best for                                                                     | Storage and identity                                                    |
| ------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| The Partner Brief, standalone app     | Explore scenarios, refine a design, print a brief                            | Browser local storage; no sign-in or shared workspace                   |
| Channel Architect Open Mercato module | Shared programs, independent approval, immutable history, and pilot tracking | Host authentication, tenant/organization scoping, and the host database |

The Partner Brief does not sync with the module automatically. To use team workflows, install the package into an Open Mercato host.

## 2. Download and run The Partner Brief

### Requirements

- Bun 1.3 or later. The repository includes `bun.lock` and was checked with Bun 1.3.14.
- A browser with JavaScript enabled.
- No database, account, API key, or `.env` file for the standalone app.
- If cloning the private GitHub repository, an invitation/access to it. If you received a source ZIP instead, extract it and start with the Bun install command inside the extracted folder.

### Install and launch

```sh
git clone https://github.com/samuraiman2026/channel-architect-studio.git
cd channel-architect-studio
bun install --frozen-lockfile
bun run dev
```

Open the URL printed in the terminal. Stop the local server with Ctrl+C.

Useful commands from the repository root:

```sh
bun run dev                                  # start the local Studio
bun run build                                # production-build the standalone app
bun run lint                                 # no errors; six React Refresh warnings in shared UI components
bun run typecheck                            # check standalone TypeScript types
bun test src/lib packages/channel-architect/tests/demoData.test.ts
bun run --cwd packages/channel-architect build
bun run check                                # run all five checks above
```

The focused test command runs standalone rules and demo-data tests. Open Mercato command tests need the Open Mercato peer packages installed in the host workspace. The host acceptance test is `packages/channel-architect/src/modules/channel_architect/__integration__/TC-CHANNEL-ARCHITECT-001.spec.ts`.

## 3. Use The Partner Brief

1. On the home screen, choose a scenario or fill in the custom company/project fields. Keep customer details non-sensitive.
2. Enter the person accountable for the program.
3. Choose the primary and secondary partner archetypes and program stage.
4. Adjust the planning emphasis across resell, refer, influence, and build-on. The values must total 100. They are planning attention, not commissions, margin, or credit.
5. Generate the design and review all nine sections. Change inputs and regenerate when the first result exposes an assumption worth testing.
6. Select **Download as PDF** to open the browser print dialog. Choose “Save as PDF” there if you want a file.
7. Reopen saved program versions from the home screen on the same browser and device. A regenerated design is stored as the next local version for that program.

### Local draft behavior

- Drafts are stored in the browser's local storage under `channel-architect-drafts-v1`.
- Clearing browser data, changing browsers, or using another device can make those drafts unavailable. There is no account-based sync or server backup in the standalone app.
- A recorded local endorsement is only a browser note. It does not identify or authenticate the endorser, create an Open Mercato review decision, or authorize a pilot.
- Older local saves that used an “approval” label are shown as unapproved drafts with an endorsement note preserved for context.

If a draft matters, use the PDF action to save a copy somewhere appropriate. Do not enter sensitive customer, partner, or personal information.

## 4. Work with the Open Mercato module

### What the module adds

The package at `packages/channel-architect` adds a backend workspace to an Open Mercato 0.6.x application. It supports:

- Tenant- and organization-scoped programs and immutable design versions.
- Review decisions tied to a specific version. A later version needs its own review.
- Role-controlled program viewing, creation/revision, approval, and pilot operations.
- Pilots that can only be started from the current approved version.
- Planned, active, paused, completed, and cancelled pilot states, with completion outcomes and ordered checkpoints.
- Searchable, paginated program and pilot lists.

Programs and pilots are not CRM partner records. This scope does not add partner contacts, opportunity attribution, enrollment, commissions, payment execution, or synchronization to another system.

### Host requirements

- A separate Open Mercato host compatible with version 0.6.x. The module was validated against Open Mercato CLI/Core/Shared/UI 0.6.0.
- A database configured for that host.
- A package manager supported by the host. The example commands below use Yarn, as in the validated host.
- Access to the current Channel Architect source path.

This repository is an extension package, not a fork of Open Mercato core. Keep the host's core source unchanged.

### Install into a host

First, from the Studio repository root, build the package:

```sh
bun run --cwd packages/channel-architect build
```

Then, from the root of the Open Mercato host, add the local package. Replace the example path with the absolute location where you downloaded this repository:

```sh
yarn add @open-mercato/channel-architect@file:/path/to/channel-architect-studio/packages/channel-architect
yarn mercato module enable @open-mercato/channel-architect
yarn generate
```

If the host was already initialized before this module was enabled, synchronize role grants:

```sh
yarn mercato auth sync-role-acls
```

Restart the host if its normal module workflow requires it. In the backend navigation, open **Channel Architect → Partner Programs**.

### Database migration safety

The package contains a migration that creates its program, version, review, pilot, and checkpoint tables. Building the package does not apply the migration.

For an acceptance/demo host, point the host's `DATABASE_URL` at a fresh disposable PostgreSQL database, inspect the generated migration, then apply it through the host's normal migration command:

```sh
yarn mercato db:migrate
```

Never run that command against a database until you have verified which database the host is configured to use. For a production host, follow the organization's migration review, backup, and release process. Do not use demo data in production.

### Roles and review separation

Default module grants are defined in `packages/channel-architect/src/modules/channel_architect/setup.ts`:

| Feature grant                        | Capability                                            |
| ------------------------------------ | ----------------------------------------------------- |
| `channel_architect.programs.view`    | View programs and versions in the active organization |
| `channel_architect.programs.manage`  | Create programs and append revisions                  |
| `channel_architect.programs.approve` | Approve or reject one version                         |
| `channel_architect.pilots.view`      | View pilots and checkpoints                           |
| `channel_architect.pilots.manage`    | Create pilots and update pilot/checkpoint state       |

The default `admin` and `superadmin` roles receive all five grants. `employee` receives view access to programs and pilots. Adjust role assignments using the host's normal access-control tools. A program owner or version creator cannot review that version, even if the role has approval access. Use a second authorized account for review demonstrations.

### Program and pilot workflow

1. A manager creates a program. The host validates the inputs and stores version 1 with the exact inputs, generated output, and design-engine version.
2. A different authorized user approves or rejects that specific version and records a rationale.
3. A pilot can be created only from the current approved version. It stores the governing version ID and checkpoints.
4. The operator moves the pilot through valid states and resolves each checkpoint. Completing a pilot requires every checkpoint to be completed or skipped and an explicit continue, revise, or stop outcome.
5. Revising a program creates a new draft version. Approval does not carry forward. Archiving preserves history and prevents new revisions or pilots.

All reads and writes are scoped by the authenticated tenant and organization. The UI hides controls users cannot access, while server authorization remains authoritative.

## 5. Use the demo data

Three synthetic program briefs and a walkthrough live at [`packages/channel-architect/demo/README.md`](packages/channel-architect/demo/README.md). The data itself is defined in `packages/channel-architect/src/modules/channel_architect/lib/demoData.ts` as `DEMO_PROGRAMS`.

The pack is not an automatic seeder and does not create database records. Use its fields as examples in the Open Mercato form. `buildDemoPilotDates(program)` calculates date-only pilot and checkpoint values relative to the current date; pass a fixed `Date` in tests to get repeatable dates. Create programs through the UI/API so normal identity, independent review, permissions, audit, and version rules apply.

All company names, ARR context, goals, and cohorts are fictional. ARR is just supplied context, not verified financial information. The Juniper Harbor example is designed to be rejected pending revision.

## 6. Repository map

| Path                                                                   | Purpose                                                                  |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `src/routes/index.tsx`                                                 | Standalone planning experience and browser-local drafts                  |
| `src/lib/`                                                             | Standalone app adapters and product tests                                |
| `packages/channel-architect/src/modules/channel_architect/lib/`        | Shared canonical scenarios, types, generator, pilot rules, and demo data |
| `packages/channel-architect/src/modules/channel_architect/backend/`    | Open Mercato backend screen                                              |
| `packages/channel-architect/src/modules/channel_architect/api/`        | Authenticated module API routes                                          |
| `packages/channel-architect/src/modules/channel_architect/commands/`   | Scoped, audited domain mutations                                         |
| `packages/channel-architect/src/modules/channel_architect/data/`       | ORM entities and Zod validators                                          |
| `packages/channel-architect/src/modules/channel_architect/migrations/` | Host database migration artifacts                                        |
| `packages/channel-architect/tests/`                                    | Module command and demo-data tests                                       |
| `packages/channel-architect/demo/`                                     | Demo walkthrough                                                         |
| `.ai/specs/SPEC-001-channel-architect-open-mercato.md`                 | Product/module specification and acceptance scope                        |

When changing generation behavior, edit the shared implementation in `packages/channel-architect/src/modules/channel_architect/lib/`. The standalone app imports/re-exports that implementation; avoid creating a second divergent engine.

## 7. Test and verification notes

Run the standalone and demo-data test slice with:

```sh
bun test src/lib packages/channel-architect/tests/demoData.test.ts
```

The module command tests import Open Mercato and MikroORM peer packages. Run them in a host workspace where those dependencies are installed. The Playwright acceptance scenario covers authorization, cross-organization isolation, version history, review separation, pilots, checkpoints, and archive behavior. The disposable Open Mercato 0.6.0 acceptance environment has been migrated and exercised; this does not mean a fresh host or production database is migrated for you.

The root `bun run lint` command is not currently a clean verification gate. It reports repository-wide Prettier mismatches, including existing module files, and can include generated package output after a build. The Markdown files in this guide were checked with Prettier. Do not interpret a failing root lint run as a failure of the documented setup commands.

## 8. Known boundaries

- The Partner Brief is browser-local and has no user accounts or shared database.
- The module must be installed in a separate Open Mercato host for shared records and authenticated approvals.
- The generator is deterministic and does not make its hypotheses evidence-backed.
- Planning emphasis is not commercial economics or revenue credit.
- The current scope has no partner CRM, opportunities, sourced/influenced attribution ledger, enrollment, payout, or payment execution.
- Check repository/dependency licensing before redistribution. This checkout has no root `LICENSE` file, and the module package declares itself private.

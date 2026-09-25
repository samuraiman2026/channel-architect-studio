# Channel Architect

Channel Architect is a partner-program planning workspace with two related experiences:

- **The Partner Brief**, a standalone browser app for shaping a first partner-program hypothesis.
- **Channel Architect for Open Mercato**, an installable module for shared, permissioned program design, review, version history, and pilot tracking.

The two experiences use the same deterministic design engine. The standalone app is useful for exploring an idea. The Open Mercato module is the operational workspace for teams that need authenticated users and persistent records.

## Run the standalone app

Requirements: [Bun](https://bun.sh/) 1.3 or later. No database, API key, or environment file is needed for The Partner Brief.

The GitHub repository is currently private. Give a recipient repository access before sending the link, or send them a source ZIP. With a ZIP, extract it first and run the commands from the extracted `channel-architect-studio` folder, starting at `bun install --frozen-lockfile`.

```sh
git clone https://github.com/samuraiman2026/channel-architect-studio.git
cd channel-architect-studio
bun install --frozen-lockfile
bun run dev
```

Open the local URL printed by Bun. The Partner Brief is a client-side planning tool. Choose one of the included scenarios or enter a company/project context, set an owner, adjust the partner and planning inputs, then generate a nine-section draft. Use **Download as PDF** to open the browser's print dialog and save a copy.

For a quick demo, choose **AI Infrastructure, Series B**, enter a program owner, and select **Generate program design**. Refresh the page to find the saved version under **Saved program versions on this device**. No setup data or login is required.

Drafts are saved in local storage in the current browser only. They are not synced or backed up. A local endorsement is only a note on that device, not an authenticated approval.

## Use the Open Mercato module

The package targets Open Mercato 0.6.x and is maintained under [`packages/channel-architect`](packages/channel-architect). It stores tenant- and organization-scoped programs, immutable versions, review decisions, pilots, and checkpoints in the host database. See the [module guide](packages/channel-architect/README.md) for installation, access, workflows, and migration safety.

For a guided demo with fictional program briefs, see [`packages/channel-architect/demo/README.md`](packages/channel-architect/demo/README.md). The examples are source fixtures, not a one-click database loader.

## Development checks

```sh
bun run check
```

This checks lint, TypeScript, the standalone and demo-data tests, the standalone production build, and the module build. Lint may report six existing React Refresh warnings in shared UI components, but has no errors. The Open Mercato command tests require the module's host peer dependencies. The host acceptance scenario is at `packages/channel-architect/src/modules/channel_architect/__integration__/TC-CHANNEL-ARCHITECT-001.spec.ts`.

Read [`dev_context.md`](dev_context.md) for the detailed user and developer guide, and [`docs/open-mercato-integration.md`](docs/open-mercato-integration.md) for product boundaries and integration status.

## Product and reuse boundaries

Generated content is a planning hypothesis, not a benchmark, forecast, commission schedule, commercial offer, or compliance determination. Planning-emphasis percentages are not payouts or revenue attribution. The current product does not manage partner contacts, CRM opportunities, enrollment, or payment execution.

The standalone app needs no credentials and does not send its drafts to a server. Before redistributing or embedding this downloaded code, check the repository and dependency licenses. The Open Mercato package is marked private and is intended for local integration with a compatible host.

# AstroBai: Red Frontier

A browser-based Mars adventure for ages 7–12, built with React, TypeScript and Vite. The main app connects the existing mission engines to interactive character movement, short crew dialogue and a ten-sol outpost campaign.

Play from the menu through equipment preparation, launch, visual travel, landing, outpost exploration and mission debrief. Project ICEBOUND supports rover, crew and combined expeditions with deterministic positive, negative and inconclusive findings. Optional science work may remain incomplete without preventing the approved outpost ending.

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 4177 --strictPort
```

Open [the game](http://127.0.0.1:4177/). The team repository root is the application; the nested `AstroBai-Red-Frontier` folder is an older scaffold.

Tap clear ground to walk, or select a building and wait for arrival. Use Tab and Enter for building controls. Buildings open contextual actions; Escape closes panels or leaves an interior. Settings supports larger text and reduced motion. Saves stay on this device and replay validated actions after reload.

Exploration fills the viewport with an overlay HUD and portrait dialogue. The four resources use a 0–10 scale with visible numbers and bars. Preparation automatically selects 5 each (20/35 cargo); confirmation copies the exact selected amounts, with no extra reserves. Standard outpost equipment supports ICEBOUND without optional cargo. See [the resource-balancing report](docs/resource-balancing-report.md) for costs, save compatibility and validation.

Each sol now consumes 1 of each resource. Use one-job facility actions to collect 5 Energy or replenish 4 Oxygen, Water or Food (the latter three cost 1 Energy). Operations run once per sol. Record a research site's report to unlock other locations; earlier samples and reports remain saved. The HUD can be minimized and restored. See [the gameplay-fixes report](docs/gameplay-fixes-report.md) for balancing, validation and save compatibility. Power allocation, repairs and storm-response events remain outside this change.

## Requirements

- Node.js compatible with the installed Vite version
- npm

## Setup

```sh
npm install
npm run dev
```

Vite prints the local development URL in the terminal.

## Build and checks

```sh
npm run build
npm run lint
```

`npm run build` runs the TypeScript project build and creates a production bundle in `dist`. `npm run lint` runs Oxlint.

## Project map

See [docs/architecture.md](docs/architecture.md), [docs/team-ownership.md](docs/team-ownership.md), and [docs/integration-contract.md](docs/integration-contract.md) for structure, ownership, and the shared-interface agreement process. Follow [AGENTS.md](AGENTS.md) when contributing.

## Tests

```sh
npm test
```

Tests use Node's built-in test runner and native TypeScript type stripping (Node.js 24); no test dependencies are added.

The default suite includes mission/store, character navigation, story presentation and science-data tests. It runs sequentially to avoid concurrent native preview-builder memory spikes on Windows.

Optional browser QA uses an external Playwright installation and installed Chrome:

```powershell
$env:PLAYWRIGHT_MODULE = 'file:///absolute/path/to/playwright/index.mjs'
npm.cmd run test:browser
```

It starts and closes its own localhost server on port 4188, uses isolated browser contexts, and writes current evidence under `docs/qa/hud-supplies`. No Playwright dependency is added to the game.

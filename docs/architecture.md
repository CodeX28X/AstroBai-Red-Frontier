# Architecture

## Current playable integration

The pixel-art presentation pass adds shared `gameAssets` definitions, `PixelImage` failure handling, feature-owned character portraits, resource/equipment images, a compact `HudObjective` layer and a summary-first `MissionEnding`. These read existing state and dispatch existing callbacks; no new resource, outcome or mission engine exists. Navigation uses pad-aligned footprints, exact segment collision checks, common facility approaches, depth ordering and a configured 25% speed/cadence increase. Scout's stored position is retained when assigned as a companion. See `pixel-assets-report.md` for current visual evidence. Simulation/progression/scientific contracts below remain unchanged.

The current gameplay fixes keep 0–10 resources, 35 cargo spaces and the default 5-each loadout. `features/simulation/outpostSystems.ts` owns pure production/consumption rules; the central reducer commits resources, one-job costs, per-sol operation locks, consumed-sol records and natural supply failure atomically. Standard capabilities and selectable operational optional cargo are listed separately. ICEBOUND retains per-site investigation records plus cumulative samples, analyses, costs and global progress; site-scoped markers prevent replay. The existing science classifier is unchanged. ResourceHud reads authoritative resources; compact/minimized HUD state is presentation-only. Save v4 replays current-rule histories and rejects older histories that lacked daily consumption. See `docs/gameplay-fixes-report.md`.

`src/app/App.tsx` mounts `AdventureExperience`. Feature-owned preparation, map, interiors and mission panels read `GameProvider`; typed player intents go to the existing reducer and mission engines. The old A/B previews remain available for independent design review.

- A: `adventureDirector` derives one objective/dialogue beat from real mission progress. The adventure components render contextual controls and existing story artwork.
- B: `navigation.ts` provides grid A*, scene-coordinate conversion and elapsed-time movement. `NavigatingActor` keeps visual positions in refs and handles route cancellation, facing, formation and animation boundaries. `MarsMap` opens inspections on arrival; `FacilityInterior` uses a separate room collision mesh.
- C: the reducer remains authoritative. `campaign.ts` explicitly configures fictional installed lab/drilling capabilities through the existing initialization interface. `saveGame.ts` validates and replays a bounded player-action history; saves cannot inject raw resource or readiness values.
- D: existing preparation, progression and ICEBOUND engines retain eligibility, costs and scientific classifications. The final-sol boundary now distinguishes playing Sol 10 from completing it.
- E: cached, typed NASA science summaries live in `src/data/nasa/scienceFacts.ts`, with source links and real/fictional labels. Core gameplay makes no network requests.

Daily consumption and manual facility production are implemented. Power allocation, damage/repair events, solar-storm operations, separate crew health and partial-success thresholds remain absent. No passive generation is added. Earlier implementation reports are historical; `docs/integration-contract.md` records the current rules.

## Foundation

- `src/main.tsx` mounts the React application.
- `src/app` contains the application entry point.
- `src/features` groups feature-owned UI and domain code.
- `src/shared` is reserved for reviewed contracts, shared state, reusable components, and utilities.
- `src/data/nasa` holds source-backed NASA scenario data.
- `src/styles` contains global styles.
- `public/assets` groups static art and audio by asset type.

Keep Vite as the build foundation. Simulation and mission rules must remain separate from presentation and animation.

## Feature boundaries

Story, dashboard, and puzzle presentation; map interactions; simulation; and mission progression should remain independently owned. Cross-feature communication must use interfaces agreed by the affected owners rather than importing another feature's internals.

## Shared interface process

Before parallel implementation, write the proposed types, ownership, direction of data flow, and lifecycle expectations in `docs/integration-contract.md`. Review them with each affected owner (and E for scientific/content implications), resolve naming and responsibility questions, then record the agreed version before feature code depends on it. Change contracts through the same review process and coordinate migrations with consumers.

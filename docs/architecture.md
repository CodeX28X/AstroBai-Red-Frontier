# Architecture

## Current playable integration

The resource-balancing follow-up uses direct 0–10 resource units and 35 cargo spaces. Selection storage starts empty; START_GAME selects 5 each, and confirmation copies the exact selection into GameState resources once. Standard science capabilities allow ICEBOUND without optional cargo; optional equipment IDs are never auto-added. ResourceHud reads the authoritative resources directly. `supplyBalance.ts` centralizes supply/cargo/status values; landing and ICEBOUND cost definitions remain feature-owned. Save v3 replays new-scale histories and explicitly rejects older scales. Dialogue, guidance, artwork and map geometry are unchanged. See `docs/resource-balancing-report.md` for current evidence.

`src/app/App.tsx` mounts `AdventureExperience`. Feature-owned preparation, map, interiors and mission panels read `GameProvider`; typed player intents go to the existing reducer and mission engines. The old A/B previews remain available for independent design review.

- A: `adventureDirector` derives one objective/dialogue beat from real mission progress. The adventure components render contextual controls and existing story artwork.
- B: `navigation.ts` provides grid A*, scene-coordinate conversion and elapsed-time movement. `NavigatingActor` keeps visual positions in refs and handles route cancellation, facing, formation and animation boundaries. `MarsMap` opens inspections on arrival; `FacilityInterior` uses a separate room collision mesh.
- C: the reducer remains authoritative. `campaign.ts` explicitly configures fictional installed lab/drilling capabilities through the existing initialization interface. `saveGame.ts` validates and replays a bounded player-action history; saves cannot inject raw resource or readiness values.
- D: existing preparation, progression and ICEBOUND engines retain eligibility, costs and scientific classifications. The final-sol boundary now distinguishes playing Sol 10 from completing it.
- E: cached, typed NASA science summaries live in `src/data/nasa/scienceFacts.ts`, with source links and real/fictional labels. Core gameplay makes no network requests.

Recurring resource rates, power allocation, damage/repair events, solar-storm operations, crew health and partial-success thresholds are still absent. The older contract proposals below do not supply executable rules for them. See `docs/integration-contract.md` and `docs/overhaul-report.md`.

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

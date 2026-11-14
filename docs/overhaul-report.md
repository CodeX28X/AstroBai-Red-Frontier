# Adventure implementation and QA report

This records the preceding integration pass. The current follow-up is documented in [HUD, supplies, dialogue and guidance](hud-supplies-report.md), including new reserve balances and updated tests/screenshots.

Date: 2026-11-15. Branch: `feat/gameplay-story-ux-overhaul`. No commit, push, merge or reset was performed.

## Result and scope

The ordinary `/` entry now offers a playable, story-guided adventure from menu to Sol 10 debrief. It reuses the existing React/Vite application, GameProvider/reducer, preparation and ICEBOUND engines, story bitmaps and B's map/interior illustrations. No runtime dependency was added and no artwork file or Vite configuration was replaced.

Inspection found that the main entry was still a legacy setup screen, despite the playable feature previews and complete mission engines. It also found that this checkout has **no recurring resource simulation, battery allocation, repair/power/life-support/storm event engine, health system or partial-success evaluation**. Those cannot be honestly described as preserved working features. This implementation connects the approved existing MVP and clearly records the remaining gaps instead of adopting unapproved draft rules.

The implemented slice is ready for a pull-request review. It is **not a claim that every requested overhaul criterion is complete**: full simulation/event gameplay and independent C/D/E content/contract sign-off remain outstanding. No critical blocker was found for the implemented preparation → ICEBOUND → ten-sol debrief path.

## Movement, animation and interaction

- B's scene uses normalized coordinates and grid A* with smoothed collision-checked segments. Habitat/facility footprints, the flag platform, rocks, machinery, terrain limits and room benches block routes. Obstacle clicks resolve to nearby walkable ground; disconnected routes reject movement.
- Movement advances by elapsed frame time. Positions, velocity, facing, routes and animation state stay local; no GameState updates occur per frame. Character kinds retain separate scene positions.
- Rapid clicks replace routes. Scene changes, modal opening, hidden tabs and unmounts pause/cancel frame work and timers. Coordinates remain correct after resizing. Arrival tolerance is determined by the safe grid endpoint.
- States include idle, airlock preparation, turning pause, walking, arriving, inspecting, waiting, working, scanning and sampling. Entering an interior uses an indoor clothing variation of the existing SVG character; outdoor movement uses its EVA suit. Indoor steps have a shorter cadence; outdoor steps have a restrained spring. Rover wheels/lights and scans use separate effects, with no astronaut hop.
- Airlock checks are short visual transitions. Actual EVA equipment/readiness, communications, habitat, supplies and field hazard checks gate crew surface movement. Movement and inspections never spend major jobs or consume a second oxygen system.
- Rover-only, astronaut-team and combined plans determine which actors appear. Companions follow collision-aware paths after a short delay and stop with separation. These are symbolic mission formations: this engine has no named per-crew roster or persistent individual positions.
- Building selection opens context after arrival. Settings and supply inspection do not require travel. Mission commands are checked before travel and revalidated by the reducer at arrival. Accepted analysis events activate the real laboratory view/equipment animation; rejected operations never play a completion reward.
- Device and in-game reduced motion are respected. Minimal motion retains short visible route travel without bouncing or decorative loops. Native building buttons provide a keyboard alternative.

## Story and UX

The director derives one goal and dialogue beat from authoritative progress; it does not store a competing objective tracker. BAI, Captain Kiki, Dr. Kofi, Menemo, Dr. Olef and Scout use the canonical Part 1 names. The crew panel explains each role. Canonical scene copy guides setup, power inspection, reconnaissance, site comparison, planning, field work, samples, analysis, reporting and debrief. Sol 6 offers general space-weather science only, not a fabricated storm event. Early/late science completion adapts to actual objectives.

The HUD groups Energy, Supplies and Safety with words and symbols. Underlying quantities and readiness reasons remain available in panels. The 20/40 resource display bands are fictional presentation cues, not NASA thresholds or new simulation effects. Major controls use roughly 44px or larger touch targets. Dialogues use approximately 19–22px text; normal body text uses approximately 18px. Main scenes fit tested viewports, while preparation, debrief and modal details scroll internally. Native modal focus containment, Escape, visible focus and return from interiors remain available.

Preparation uses visual equipment cards, quantities, cargo space, an optional science essentials suggestion, and the real Mission Control review. Planning compares Scout/crew/together, actual tools and computed engine costs, with separate review and confirmation. The debrief reports actual findings, sample limitations, costs, cargo, landing choice and lessons. There is no compulsory building tour.

## State, saves and defects fixed

1. Integrated the previously disconnected main application and feature engines/UI.
2. Landing now enters Sol 1, not Sol 0. Advancing completes the current sol; Sol 10 must be completed before success debrief. Post-final-sol ICEBOUND effects are sealed.
3. Configured the playable campaign's existing trusted initialization option with fictional installed lab-analysis and drilling capability. Default engine initialization still has no invented lab/drill. Without this explicit setup, the old main app could not finish analysis.
4. Added versioned bounded action-history saves. Loading replays supported intents through the reducer, never trusts serialized resources/readiness, and rejects corrupt, unsupported, oversized or impossible histories. New missions reset the history and rewards. UI settings stay separate.
5. Cleared stale rejection feedback on a successful sol advance; otherwise the session could omit that successful advance from the save journal.
6. Corrected map/interior proportions, dialog contrast and scrolling close-header visibility. Removed the legacy page dashboard from the normal entry.
7. Added route cancellation, distinct character-kind positions, companion separation and reduced-motion travel. Preserved all existing art references and previews.

## NASA science and draft adaptation

Read the supplied 45-page draft as reference; the pasted request governs implementation. The following older mechanics were not copied: two-crate cargo limits, interactive cruise choices, evidence-point scoring, fixed-sol automatic rewards, Earth return, unimplemented power sliders, draft recurring formulas and invented DONKI data. Conflicting script names Mara/Lina/Sam were not used. Uncertain and negative results remain valid science, with the current ICEBOUND classifications.

Typed cached science summaries record stable IDs, organization, source URL, publication date when known, verification date, static mode and real-science classification:

- [NASA/JPL InSight: Mars at a Glance](https://www.jpl.nasa.gov/news/press_kits/insight/landing/facts/mars-at-a-glance/): approximately 38% Earth gravity and a roughly 24-hour, 39-minute day. Habitat pressure does not change Martian gravity.
- [NASA Mars facts](https://science.nasa.gov/mars/facts/): very thin atmosphere.
- [NASA SWIM map reference](https://science.nasa.gov/resource/swim-map-shows-subsurface-water-ice-on-mars/), published 2023-10-26: subsurface water ice and potential explorer uses. No map image was available as an approved bundled asset; the official reference link is included. Fictional sites are not mapped onto real deposits.
- [NASA Perseverance science objectives](https://science.nasa.gov/mission/mars-2020-perseverance/science-objectives/): geological observations and sample collection.
- [NASA space weather](https://science.nasa.gov/heliophysics/focus-areas/space-weather/): general threats to explorers. No DONKI event, live warning, dose, event identifier or API response was invented. Core gameplay has no API dependency.

## Verification

- `npm test`: **214 tests passed**, including the original engine/store/presentation checks, collision routing, frame-independent arrival, resizing, all three real scientific outcomes, save replay/recovery, final-sol sealing and science-source labels.
- `npm run build`: TypeScript and Vite production build passed.
- `npm run lint`: passed with no warnings.
- `npm run test:browser` with bundled external Playwright and installed Chrome: actual UI playthroughs for positive, negative and inconclusive findings; rover/crew/combined assignments; visible travel; indoor inspection; rapid retargeting; resizing during travel; pause/resume; modal focus; touch arrival; reduced motion; missing EVA gear; unfinished science with outpost success; corrupt saves; reload/resume; restart; offline facts and end-of-campaign play. See the machine-readable browser results below for the final run.
- Layout checked at **1366×768**, **1920×1080**, and **390×844**, without page-level overflow in the tested scenes. Browser console/page errors: **0**.
- Component suites run sequentially because a first concurrent native preview build exhausted the sandbox's memory. No test assertion was weakened to address that environment failure.

Evidence: [browser result log](qa/adventure/browser-results.json), [desktop outpost](qa/adventure/outpost-1366.png), [large outpost](qa/adventure/outpost-1920.png), [mobile outpost](qa/adventure/outpost-mobile.png), [interior](qa/adventure/habitat-1366.png), [lab analysis](qa/adventure/lab-analysis-1366.png), [plan review](qa/adventure/plan-1366.png), [positive report](qa/adventure/science-result-1366.png), [negative mobile result](qa/adventure/negative-mobile.png), [inconclusive result](qa/adventure/inconclusive-desktop.png), [debrief](qa/adventure/debrief-1366.png), [menu](qa/adventure/menu-1366.png).

## Files created or modified

- Application: `src/app/App.tsx`, `package.json`.
- A/story: new `AdventureExperience.tsx`, `AdventurePreparation.tsx`, `AdventureMission.tsx`, `adventure.css` under `src/features/story/components`; new `adventureDirector.ts`, `adventureLocations.ts` under story data.
- B/map: new `navigation/navigation.ts`, `components/mars/NavigatingActor.tsx`, `navigation.css`, `tests/navigation.test.mjs`; modified `MarsMap.tsx`, `FacilityInterior.tsx`, `MarsEffects.tsx`, map types and public exports.
- C/store: new `campaign.ts`, `saveGame.ts`, `adventure.test.mjs`; modified `GameContext.ts`, `GameProvider.tsx`, `gameReducer.ts`, `iceboundIntegration.ts` and their affected tests.
- D/missions: `engine/icebound/readiness.ts` final-sol guard and updated integration-test fixtures for the corrected Sol boundary.
- E/science/documentation: new `src/data/nasa/scienceFacts.ts`; updated root README, architecture, design and integration contract; this report; browser script and QA evidence.

## Remaining limitations and launch

The absent recurring simulation/event/power contracts remain the principal gap against the complete requested overhaul. No legitimate natural early-failure path exists in the current campaign engine; terminal-outcome guards are tested by the existing engine tests, not by inventing a successful browser failure run. Individual crew selection/portraits, bespoke carrying sprites, voiced dialogue, real device/child playtesting, live NASA data, offline cold-start installation and independent C/D/E sign-off are not supplied. Cached facts and an already loaded game work without a network; this is not a new service-worker/PWA install.

From `C:\Development\astrobai-red-frontier`:

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 4177 --strictPort
```

Open [http://127.0.0.1:4177/](http://127.0.0.1:4177/). No developer shortcuts are needed for the implemented full campaign.

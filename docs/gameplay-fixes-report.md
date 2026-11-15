# Gameplay fixes — 2026-11-15

Implemented on `feat/gameplay-facilities-exploration-fixes`, starting from a clean working tree. No commit, push or merge. Preparation screens, storyline, character animation, map geometry and NASA integration were preserved. All balance values are fictional game abstractions.

## Root causes and fixes

1. **Empty equipment selection:** the UI rendered only operational optional cargo, while the default manifest contains none. Standard capabilities were usable by the engine but invisible. `expeditionEquipment` now derives a labeled standard-equipment list and selectable, operational, confirmed optional tools using existing catalog IDs. Standard infrastructure cannot be removed or converted into cargo. Optional checkboxes update the actual draft; review/confirmation preserve the exact selection and show its names. No optional item is invented or granted.
2. **Only one research site:** the old engine had singleton site/plan/expedition/report fields, global objective guards and operation IDs, replacement sample arrays, and a permanently locked plan after confirmation. It now retains `investigations` records per site and scopes operation/event/objective markers by site. Global reconnaissance and completed-objective history remain intact; samples, analyses and costs append. New selection is allowed after reporting the active site; completed sites cannot be repeated. Planning metadata advances to a fresh revision without resetting global science progress. Map/list eligibility reflects these rules. One report completes overall ICEBOUND; additional research is optional. Previous reports remain readable.
3. **Nonfunctional facilities:** buildings previously offered only inspection, and solar/greenhouse display states were hardcoded offline. The reducer now commissions the standard power/greenhouse facilities explicitly and applies typed production requests through pure simulation rules. The existing habitat contains oxygen circulation and water recycling; no extra water building was invented. Facility panels and reserve panels expose production, costs and readiness reasons. Successful jobs show a checkmark/result treatment and update the HUD. Damage, offline/unbuilt state, power shortage, full storage, action limits and repeat attempts reject without spending anything.
4. **No daily consumption:** `ADVANCE_SOL` previously changed counters only. It now runs one atomic resource transaction, records the completed sol, updates resource revision, resets jobs and reports low reserves. UI requests include the expected sol; stale requests and consumed-sol records prevent replay. An unaffordable advance ends the mission without deductions; reaching zero after consumption causes failure. Terminal/phase/ten-sol guards remain enforced. Both natural failure and success endings were tested.
5. **Oversized HUD:** fixed large panels occupied substantial scene space. Compact overlays now use less padding, smaller portraits/panel heights and readable text. A labeled, keyboard-operable Minimize/Expand HUD button retains sol, four numerical resource meters/bars, current action and End Sol while hiding secondary panels. Mode persists through ordinary actions and dialogs; a new mission resets it. Desktop, tablet and mobile layouts were checked for overflow, overlapping header/objective panels and obscured facility centers.

## Balancing and resource rules

Maximum remains **10** for each resource; default preparation is **5 each**, **20/35 cargo**. Confirmation remains one-to-one with selected quantities. No extra starter resources or optional cargo are added.

| Operation | Effect | Major jobs | Limit |
| --- | --- | ---: | --- |
| Solar Array: Collect energy | +5 Energy | 1 | Once per sol |
| Habitat: Replenish oxygen | +4 Oxygen, −1 Energy | 1 | Once per sol |
| Habitat: Recycle water | +4 Water, −1 Energy | 1 | Once per sol |
| Greenhouse: Harvest food | +4 Food, −1 Energy | 1 | Once per sol |
| Finish a sol | −1 Energy, Oxygen, Water and Food | 0 | Once per completed sol |

Positive production caps at 10; full-resource jobs are disabled/rejected. Passive generation is explicitly **zero**: there was no existing passive system to retain, and manual production is never also paid out at the sol boundary. Job results use deterministic `facility:sol:operation` keys plus expected sol/resource revision. Resource depletion is not hidden by negative clamping. Low-reserve warnings appear at 2 or less and point toward facilities.

Landing effects remain the existing small-scale choices: Safe Landing −1 Energy/+1 Oxygen; Science Spot −2 Energy/+2 Water, once only. ICEBOUND costs remain 1 Energy for reconnaissance, rover trip, either sample method and lab analysis. Crew trip uses 1 Oxygen/Water/Food; combined trip adds 1 Energy. Each field/lab operation costs one job. Selection, review, confirmation and reporting remain free. Scenario conditions and the science classifier were not changed.

The standard greenhouse is now explicitly documented in baseline infrastructure and commissioned with the existing solar/habitat systems. This enables upkeep with the unchanged default loadout and does not grant seed-kit or other optional catalog IDs.

## Verified default-loadout route

This real reducer/browser route uses 18 of the available 20 major jobs, records two distinct investigations and ends with **4 Energy, 4 Oxygen, 3 Water, 3 Food**. Optional evidence tools change scientific confidence, not resource grants.

| Sol | Major jobs | Free science steps |
| --- | --- | --- |
| 1 | Collect energy; recycle water | Inspect freely |
| 2 | Collect energy; harvest food | Inspect freely |
| 3 | Reconnaissance; Lumen expedition | Select site, review and confirm plan |
| 4 | Sample; analyze | Record Lumen report |
| 5 | Collect energy; replenish oxygen | Review findings |
| 6 | Cinder expedition; sample | Select second site, review and confirm plan |
| 7 | Collect energy; analyze | Record Cinder report |
| 8 | Recycle water; harvest food | Review findings |
| 9 | Collect energy; replenish oxygen | Review findings |
| 10 | No jobs required | Finish the last sol and enter debrief |

One investigation needs fewer jobs. Regression playthroughs also use a simple spare-job policy (collect low energy, then replenish low supplies), rather than skipping consumption or bypassing action limits. Ignoring upkeep naturally fails.

## Files changed

Production/domain:

- New `src/features/simulation/outpostSystems.ts`
- `src/features/missions/data/equipmentCatalog.ts`, `supplyBalance.ts`
- `src/features/missions/types/icebound.ts`
- `src/features/missions/engine/icebound/iceboundEngine.ts`, `objectives.ts`, `planning.ts`, `science.ts`
- New `src/features/missions/engine/icebound/siteProgress.ts`, `expeditionEquipment.ts`
- `src/shared/types/game.ts`
- `src/shared/store/gameReducer.ts`, `iceboundIntegration.ts`, `iceboundSelectors.ts`, `saveGame.ts`
- `src/features/story/components/AdventureExperience.tsx`, `AdventureMission.tsx`
- New `src/features/story/components/ExpeditionEquipment.tsx`, `FacilityProduction.tsx`, `gameplayHud.css`
- `src/features/story/data/adventureDirector.ts`: current-site sample/analysis selection and actionable supply-recovery text; storyline unchanged

Tests/documentation:

- New `src/shared/store/gameplayFixes.test.mjs`, `gameplayTestSupport.mjs`
- Updated store `gameReducer.test.mjs`, `iceboundIntegration.test.mjs`, `missionIntegration.test.mjs`, `resourceBalance.test.mjs`, `adventure.test.mjs`, `suppliesGuidance.test.mjs`
- Updated mission `iceboundIntegration.test.mjs`, `iceboundTestSupport.mjs` and story `components.test.mjs`
- New `scripts/gameplay-fixes-qa.mjs`; current `scripts/browser-qa.mjs` points to it
- `README.md`, `docs/architecture.md`, `docs/game-design.md`, `docs/integration-contract.md`, this report and `docs/qa/gameplay-fixes/` evidence

## Validation

- `npm run build`: passed.
- `npm run lint`: passed.
- `npm test`: **249 passed, 0 failed**.
- `git diff --check`: passed; Git's line-ending normalization notices are informational.
- `npm run test:browser`: passed using the actual Vite app and installed Chrome via external Playwright. No dependency was added; no page or console errors.
- Browser interactions: optional checkbox deselect/reselect and plan persistence; actual facility click and success feedback; all four production operations; once-per-sol lock and one-job costs; immediate HUD meter fractions; two site reports with retained first results; completed-site locks; save/reload; ten-sol debrief; restart; ignored-upkeep natural failure and failure debrief.
- Actual layout checks and screenshot inspection at **1366×768, 1920×1080, 1024×768, 390×844**, expanded and minimized. Resource labels/numbers/bars remain visible; dialogs preserve HUD mode; facility target centers remain clickable. A tablet header/objective overlap found during testing was fixed.

Evidence: [browser results](qa/gameplay-fixes/browser-results.json), [expanded laptop](qa/gameplay-fixes/expanded-1366.png), [minimized laptop](qa/gameplay-fixes/minimized-1366.png), [tablet](qa/gameplay-fixes/expanded-1024.png), [minimized mobile](qa/gameplay-fixes/minimized-390.png), [equipment](qa/gameplay-fixes/equipment-Lumen-Shelf.png), [production](qa/gameplay-fixes/facility-success.png), [second report](qa/gameplay-fixes/second-report.png), [site progress](qa/gameplay-fixes/site-progress.png), [failure](qa/gameplay-fixes/supply-failure.png).

## Compatibility and remaining limitations

Save schema **4** is required. Old v1–v3 histories were balanced without these daily rules and are rejected rather than silently reinterpreted. The existing saved-game UI requests a new adventure; old data remains until a new mission starts. New saves replay real production, consumption and science commands.

Each site supports one completed investigation per campaign, with a selected surface or subsurface method. Reinvestigating a completed site with another method is outside this change. All three existing locations remain; completing all three within ten sols is not guaranteed. A completed first report satisfies overall ICEBOUND while the current site's progress remains separate. Basic equipment still gives honest inconclusive findings; existing optional handling/instrument bonuses remain useful.

There is no automatic production, repair workflow, new damage-event engine or power-allocation puzzle. Existing readiness/damage states are enforced, not silently repaired. HUD mode is retained during normal interaction, but is not a saved gameplay field and resets on page reload. Browser checks used reduced motion for deterministic timing; character animation implementation was untouched.

## Run

From `C:\Development\astrobai-red-frontier`, run `npm run dev -- --host 127.0.0.1` and open Vite's printed URL. Select New Mission. For browser QA, run `npm run test:browser` with Playwright available; this environment sets `PLAYWRIGHT_MODULE` to `file:///C:/Users/Stephen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs` and uses installed Chrome.

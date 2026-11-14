# Resource-balancing follow-up — 2026-11-15

Implemented the five requested resource/mission changes on `feat/gameplay-story-ux-overhaul`, preserving the existing uncommitted overhaul. No commit, push or merge was performed. All values below are illustrative game values, not NASA engineering quantities.

## Rules and behavior

- All four authoritative resources are bounded by 0 and 10. Energy is stored as `power`. A shared resource transaction rejects invalid starting balances, nonfinite changes and unaffordable deductions before committing anything; positive rewards cap at 10.
- Initial selection storage and active reserves are zero. `START_GAME` enters preparation with 5 selected for each category. Draft changes affect selection only. Valid confirmation copies the exact four quantities into GameState once and locks selection. There is no additional reserve or six-to-one conversion.
- Capacity is 35. Every supply unit costs one cargo unit; the default is 20/35. Counter and equipment edits immediately reject overflow; review and confirmation use the same combined supply/equipment capacity. Zero energy can be selected, but review requires at least one for a payable landing. Empty other supplies receive advice rather than hidden resource grants.
- The optional science kit explicitly costs its existing catalog weight of 14. It is unchecked by default. Default supplies plus this kit occupy 34/35. Chosen optional items retain catalog IDs and dependencies; no hidden optional item consumes space or appears in the manifest.
- The existing overlay HUD now displays Energy, Oxygen, Water and Food as actual `value/10` numbers and native progress bars. It has no independent resource state. Labels/numbers communicate values without relying on color. Safety remains accessible. The mobile objective is offset below the expanded HUD.

## Landing choices and operating costs

| Existing landing identity | Energy | Oxygen | Water | Food |
| --- | ---: | ---: | ---: | ---: |
| Choose a Safe Landing Spot | −1 | +1 | 0 | 0 |
| Choose a Science Spot | −2 | 0 | +2 | 0 |

Both the displayed landing effects and reducer proposals use `landingSites.ts`. Existing transition and decision markers prevent repeat effects. An unpaid cost rejects the whole landing, including its reward. Neither site adds a new protection flag; existing narrative identities are preserved.

ICEBOUND costs: reconnaissance 1 energy; rover trip 1 energy; crew trip 1 oxygen, 1 water and 1 food; combined trip 1 energy plus those crew supplies; either sampling method 1 energy; analysis 1 energy. Each operation uses one major action. Site selection, plan review/confirmation and report remain free under existing rules. The per-distance energy surcharge is zero on this compact scale; site/method access and hazards remain enforced.

The safe landing plus rover investigation costs exactly 5 energy including landing. Research landing plus rover costs 6; research landing plus crew costs 5, plus crew supplies. Mission Control exposes these trade-offs. Default 5/5/5/5 can complete either landing by choosing a suitable method.

## Equipment and scientific results

The standard capability baseline includes reconnaissance, rover, EVA, surface sampling, drilling, sample handling and laboratory analysis. Landing commissions their existing readiness fields. It does **not** add optional catalog IDs. The exploration UI reads authoritative rover readiness so a valid no-cargo operation can actually reach its arrival callback.

Actual rover faults, crew readiness, laboratory/habitat faults, weather, radiation, resources, action slots, mission window and objective prerequisites still block operations. The reconnaissance check now also respects a standard rover's actual operational/energy readiness. Explicitly selected optional tools still must be confirmed and operational.

The science classifier and sampling-quality algorithm are unchanged. No optional gear allows a complete, honest **inconclusive** investigation. Existing sealed-container and field-instrument benefits still enable stronger evidence when suitable equipment is selected. Existing positive, negative and inconclusive deterministic result tests pass.

## Files changed in this follow-up

Production:

- `src/features/missions/data/supplyBalance.ts`, `iceboundMission.ts`, `landingSites.ts`
- `src/features/missions/engine/preparation/reviewMissionPlan.ts`
- `src/features/missions/engine/icebound/readiness.ts`, `objectives.ts`
- `src/shared/store/gameReducer.ts`, `resourceEffects.ts`, `iceboundIntegration.ts`, `saveGame.ts`
- `src/features/story/components/AdventurePreparation.tsx`, `AdventureExperience.tsx`
- New `src/features/story/components/ResourceHud.tsx`, `resourceHud.css`

Validation/documentation:

- New `src/shared/store/resourceBalance.test.mjs`
- Updated shared-store `gameReducer.test.mjs`, `missionIntegration.test.mjs`, `iceboundIntegration.test.mjs`, `adventure.test.mjs`, `suppliesGuidance.test.mjs`
- Updated mission `iceboundIntegration.test.mjs`, `iceboundPlanning.test.mjs`, `iceboundTestSupport.mjs`, `missionProgression.test.ts`, `resolveStoryDecision.test.mjs`
- Updated `src/features/story/tests/components.test.mjs`
- New `scripts/resource-balancing-qa.mjs`; `scripts/browser-qa.mjs` now runs this current-scale suite
- `README.md`, `docs/architecture.md`, `docs/integration-contract.md`, this report and `docs/qa/resource-balancing/` evidence

Other modifications already present in the working tree belong to the preceding overhaul. This follow-up does not edit character animation, map geometry, spoken dialogue, story guidance, menu, travel/launch, NASA integration or ending components. The crew information panel's rover equipment label now describes standard readiness accurately.

## Validation

- `npm run build`: passed.
- `npm run lint`: passed.
- `npm test`: **239 passed, 0 failed**.
- `git diff --check`: passed; Git emits existing line-ending normalization notices only.
- Browser: headless installed Chrome through Playwright, using the actual Vite application and normal controls. Verified preparation defaults, range/capacity limits, exact confirmation, landing effect text versus committed values, HUD values/bar fractions after actions, no optional tools, every investigation step, save/reload and the real ten-sol debrief. No browser console or page errors.
- Layout checks and screenshot inspection: **1366×768, 1920×1080, 1024×768 and 390×844**. No page overflow; HUD overlays the full scene and clears the objective. The mobile overlap discovered during QA was corrected. Preparation uses its existing internal scroll area where needed.
- Evidence: [browser results](qa/resource-balancing/browser-results.json), [laptop HUD](qa/resource-balancing/hud-1366.png), [desktop](qa/resource-balancing/hud-1920.png), [tablet](qa/resource-balancing/hud-1024.png), [mobile](qa/resource-balancing/hud-390.png), [preparation](qa/resource-balancing/preparation-1366.png), [no-gear science report](qa/resource-balancing/no-optional-tools-report.png).

## Compatibility and remaining balance concerns

Save schema is now **3**. Previous v1/v2 histories used different reserves, cargo limits and operation costs; they are rejected explicitly rather than silently reinterpreted. The existing UI asks for a new adventure. An old save remains untouched until the player starts a new one. New-scale saves round-trip through authoritative action replay.

The existing MVP has no recurring daily consumption, resource-production, power-allocation or repair simulation. Sol advancement remains unchanged; energy can legitimately reach zero after completed science without causing an invented failure. Adding those systems later requires a fresh balance pass. Basic equipment produces uncertain science by design; optional evidence-quality tools remain useful. Very low energy loadouts can prevent science, with Mission Control warnings; there is no new recovery/refill system.

## Launch and reproduce

From `C:\Development\astrobai-red-frontier`, run `npm install` if dependencies are absent, then `npm run dev -- --host 127.0.0.1`. Open the localhost URL printed by Vite (normally `http://127.0.0.1:5173`) and choose **New Mission**.

For browser QA, use `npm run test:browser` with an available Playwright package and installed Chrome. In this environment Playwright is external to the repository; set `PLAYWRIGHT_MODULE` to `file:///C:/Users/Stephen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs` first. No dependency was added.

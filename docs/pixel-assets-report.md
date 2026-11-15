# Pixel assets, navigation and UI polish — 2026-11-15

Implemented on `feat/pixel-assets-ui-polish`. The initial working tree contained only the nine newly supplied PNGs. Their bytes and transparency were preserved. No dependencies, resource calculations, production/consumption rates, cargo/default supplies, scientific rules, prerequisites, landing balance, sol progression, save schema, NASA integration or storyline structure changed. No commit, push or merge was performed.

## Asset registries and integration

Character paths remain centralized in `src/features/story/data/characters.ts`, now with a matching fallback for every speaker:

| Speaker | Integrated public URL | Fallback |
| --- | --- | --- |
| BAI | `/assets/characters/bai/portrait.png` | `/assets/portraits/bai.svg` |
| Captain Kiki | `/assets/characters/captain-kiki/portrait.png` | `/assets/portraits/kiki.svg` |
| Dr. Kofi | `/assets/characters/dr-kofi/portrait.png` | `/assets/portraits/kofi.svg` |
| Menemo | `/assets/characters/menemo/portrait.png` | `/assets/portraits/menemo.svg` |
| Dr. Olef | `/assets/characters/dr-olef/portrait.png` | `/assets/portraits/olef.svg` |

`CharacterPortrait` supplies consistent dimensions and `object-fit: contain`, transparent backing and pixelated rendering. Dialogue, crew information and the ending use this component. Click/keyboard continuation and completion metadata remain intact. A related presentation defect was fixed: a completed multi-speaker sequence now keeps the last speaker's matching line instead of showing BAI's original line beneath Captain Kiki's portrait.

`src/shared/assets/gameAssets.ts` maps the four existing resource IDs to artwork:

| Stored resource | Image | Fallback |
| --- | --- | --- |
| `power` / Energy | `/assets/resources/energy.png` | `/assets/supplies/energy.svg` |
| `oxygen` | `/assets/resources/oxygen.png` | `/assets/supplies/oxygen.svg` |
| `water` | `/assets/resources/water.png` | `/assets/supplies/water.svg` |
| `food` | `/assets/resources/food.png` | `/assets/supplies/food.svg` |

`ResourceIcon` and `ResourceSummary` apply these images in preparation, the exploration HUD, reserve popups, facility production buttons/results, and ending/report resource summaries. Actual values still come from GameState; the HUD retains native `value/10` progress bars. Adjacent labels provide accessible names, so decorative icon text does not change button commands.

`PixelImage` tries the primary image, then its matching placeholder. If both fail, it shows an accessible labeled symbol without broken-image loops or a crash. Images remain contained, proportionate and transparent. Browser canvas inspection verified transparent corner pixels on all nine supplied PNGs: five 1000×1000 portraits and four 1254×1254 resource images.

## Missing artwork

- No custom Scout or Earth Mission Control portrait was supplied. Their existing matching labeled SVG portraits remain.
- `public/assets/equipment/` is absent; there are no equipment illustrations to match. The typed `EQUIPMENT_ART` registry is intentionally empty. `EquipmentIllustration` shows a readable placeholder beside the real equipment name in the preparation kit, legacy equipment preparation and expedition selection. Future verified artwork can be mapped by an existing equipment ID in one registry; no filename or equipment item was invented.
- Source artwork's transparent padding was retained. No image was cropped, regenerated or retouched.

## Navigation root cause and correction

The old navigation rectangles were larger than the drawn facility ground pads: each building used `x ±10`, `y −15 … y +11`. The two upper boxes reached Y43 and the lower boxes began at Y52; their inner edges left only X48–52 for the center lane. The solid flag platform at X46–54/Y44–55 closed that lane. On the two-unit pathfinding grid there was no local turning space around the platform, forcing routes around the outside of the buildings.

The drawn pads are approximately 15.6% wide and 13.4% tall. Conservative ground footprints now use `x ±8.5`, `y −9 … y +7.5`, leaving the actual intersections open with wall clearance. The flag platform, outer obstacles, map bounds and interior furniture/walls remain solid. Facility depth ordering places characters behind roofs when their feet are behind a building, rather than drawing them over the facade.

Shared approach points are Habitat/Solar Y42 and Greenhouse/Lab Y78 at the existing facility X coordinates. Both direct building clicks and guided approaches use these points. Clear open segments go directly to the clicked point; longer paths still use A* and smoothing. Segment/rectangle collision testing is exact, including thin walls and corners. A blocked start returns no path instead of snapping across an obstacle. Client coordinates continue to map into the proportional 10:7 scene plane, including live resize.

Actual normal-motion browser traces crossed the central road, stayed outside all collision footprints and retained correct paths after resizing. An inside-platform click walked to safe nearby ground rather than teleporting onto the flag. Free navigation/inspection changed no resources or action slots.

## Speed, gait and companions

`movementConfig.ts` centralizes a **1.25×** travel multiplier:

| Movement | Previous | Current scene units/second |
| --- | ---: | ---: |
| Outdoor astronaut | 14 | 17.5 |
| Indoor astronaut | 20 | 25 |
| Rover | 22 | 27.5 |

Animation periods scale inversely: outdoor EVA 0.576 seconds, indoor 0.336, feet 0.32 and wheels 0.24. The existing gentle outdoor hop and smaller indoor step remain distinct. Motion still uses elapsed frame time, exact destinations, pausing/cancellation and reduced-motion support. Tests cover 30/60/120 FPS. Browser measurements were approximately **17.5 units/second** on the open crossing; computed gait timing matched configuration.

Browser testing exposed a one-frame position/identity mismatch when switching from Scout to the astronaut. The controller now hands off before painting and retains positions by actor kind. A rover companion starts at Scout's stored position, follows a safe offset approach and keeps that position for later assignments. Arrival callbacks wait for valid leader/companion arrival; only the existing reducer can perform mission work. No mission reward or cost moved into animation code.

## HUD

- Narrower resource cards use the supplied images, readable names/values and bars. Backgrounds are approximately 84% opaque with restrained borders/shadows.
- The objective uses a compact corner panel during early outpost exploration. From the science phase it moves between the outer research markers to keep Scout/site targets accessible. The center crossing remains exposed.
- Dialogue and toolbar footprints are reduced without changing spoken content or continuation behavior.
- Minimized mode retains sol, compact numerical resource meters/bars, Safety, a visible objective-access button, current action, End Sol and Expand HUD.
- Low-resource warnings remain visible and clickable in both modes, using the existing warning bands and authoritative values. The warning opens existing production/reserve controls.
- Mode survives ordinary actions/dialogs; it remains a presentation preference and resets on page reload/new mission.
- Browser checks compare expanded/minimized overlay area, preserve touch targets, check all four values/bar fractions, and check facility, Scout and research marker centers for obstruction. Mobile resource labels were rearranged after visual QA found cramped text.

## Ending and detailed report

`MissionEnding` reads the existing outcome: **Mission Complete!** for success, **Let's Try Again!** for failure, and a neutral summary for a null outcome. It does not evaluate or award success.

The summary presents BAI's supplied portrait and a short supportive explanation, actual completed sols, habitat/supply readiness, reported science sites, all four remaining resource values, and at most two lessons derived from recorded jobs/findings. It does not invent crew health, food production, discoveries or other accomplishments. Negative and inconclusive science are displayed as their actual findings, not automatic investigation failures.

Play Again, View Mission Report and Main Menu remain visible in a separate action row. The report button opens the existing resource details, science reports and mission choices in an optional dialog. Replay uses the existing reset confirmation/handler. At laptop resolution the summary fits without internal scrolling; small screens may scroll the summary body while actions remain accessible.

## Files created or modified

Created:

- `src/shared/assets/gameAssets.ts`
- `src/shared/components/PixelImage.tsx`, `ResourceIcon.tsx`, `EquipmentIllustration.tsx`, `pixelAssets.css`
- `src/features/story/components/CharacterPortrait.tsx`, `HudObjective.tsx`, `MissionEnding.tsx`, `ResourceSummary.tsx`, `missionEnding.css`, `pixelPolish.css`
- `src/features/story/data/endingSummary.ts`
- `src/features/mars-map/navigation/movementConfig.ts`
- `src/features/story/tests/pixelAssets.test.mjs`
- `scripts/pixel-assets-qa.mjs`, this report and `docs/qa/pixel-assets/` evidence

Modified:

- Story components: `AdventureExperience.tsx`, `AdventurePreparation.tsx`, `LegacyPreparation.tsx`, `CharacterDialogue.tsx`, `ResourceHud.tsx`, `ExpeditionEquipment.tsx`, `FacilityProduction.tsx`
- `src/features/story/data/characters.ts`
- Map components: `Facility.tsx`, `MarsMap.tsx`, `NavigatingActor.tsx`, `navigation.css`; navigation rules in `navigation/navigation.ts`
- Tests: `src/features/mars-map/tests/navigation.test.mjs`, `src/features/story/tests/components.test.mjs`, `src/shared/store/suppliesGuidance.test.mjs`
- `scripts/browser-qa.mjs`, `scripts/gameplay-fixes-qa.mjs`
- `README.md`, `docs/architecture.md`, `docs/integration-contract.md`

The nine supplied, initially untracked PNGs are integrated as-is. Prior QA screenshots are preserved; current browser output uses the new evidence directory.

## Validation and evidence

- `npm run build`: passed.
- `npm run lint`: passed.
- `npm test`: **259 passed, 0 failed**.
- `git diff --check`: passed; informational Git line-ending notices only.
- Actual Chrome/Playwright testing at **1366×768, 1920×1080, 1024×768, 390×844**, including expanded/minimized HUD and ending controls.
- Real two-site, ten-sol playthrough: selected equipment, facility operations, all resource transactions, positive and negative science, save/reload, success ending, optional report, replay, natural depletion and failure ending.
- Separate normal-motion run: central crossing with frame traces, exact facility approach/arrival, indoor motion, live resize, solid platform approach, actual combined expedition and companions, critical warnings and objective access. All nine PNGs loaded with alpha preserved. Intentionally missing PNGs used matching SVGs; missing primary and fallback rendered readable symbols and working controls. There were no unexpected runtime/console errors; deliberate HTTP failures were confined to fallback tests.

Evidence: [full gameplay results](qa/pixel-assets/gameplay/browser-results.json), [pixel/navigation results](qa/pixel-assets/pixel-results.json), [frame traces](qa/pixel-assets/movement-traces.json), [center-road crossing](qa/pixel-assets/central-road-crossing.png), [resized map](qa/pixel-assets/resized-road.png), [portraits](qa/pixel-assets/crew-portraits.png), [missing-image fallback](qa/pixel-assets/missing-asset-fallbacks.png), [minimized warning](qa/pixel-assets/minimized-warning.png), [laptop ending](qa/pixel-assets/gameplay/ending-1366.png), [mobile ending](qa/pixel-assets/gameplay/ending-390.png), [optional report](qa/pixel-assets/gameplay/optional-mission-report.png), [failure ending](qa/pixel-assets/gameplay/supply-failure.png).

## Known limitations and remaining issues

Custom Scout/Earth portraits and equipment art are still missing and use documented placeholders. HUD mode is not persisted across reload. Very small screens use accessible internal scrolling for summary/report content. Browser checks used installed Chrome; physical tablet/mobile and child usability sessions were not performed. Existing nonrectangular art is navigated using conservative ground rectangles and the current grid, not a new physics engine. No known blocking integration issue remains from this scope.

## Run

From `C:\Development\astrobai-red-frontier`, run `npm run dev -- --host 127.0.0.1` and open Vite's printed URL. Run `npm run test:browser` with Playwright available and installed Chrome. This environment sets `PLAYWRIGHT_MODULE` to `file:///C:/Users/Stephen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`; no package was added.

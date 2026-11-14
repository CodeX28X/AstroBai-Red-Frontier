# HUD, supplies, dialogue and guidance implementation

Date: 2026-11-15. Branch: `feat/gameplay-story-ux-overhaul`. This pass builds on the existing uncommitted adventure integration. No commit, push or merge was performed.

## Implemented result

Exploration now uses the complete viewport as its scene container. The sol/status bar, objective, portrait dialogue, primary action and tools float above the map. The original map coordinate plane retains its 10:7 aspect ratio; decorative scenery extends behind the overlays. Buildings, actors and research markers retain working scene coordinates and collision-aware travel. No gameplay document rows reduce the scene's viewport bounds.

HUD backing uses roughly 82–85% opacity, opaque high-contrast text, subtle borders and shadows. Main-scene blur is removed. A fitted camera preserves the original illustration's proportions instead of stretching it. Research markers use safe relative presentation positions; no mission site, NASA coordinate or outcome was changed. Browser hit tests check that permanent HUD overlays do not cover facility or research-marker centers. Temporary context panels remain dismissible.

Preparation presents four supply cards: Energy Pack, Oxygen Tank, Water Container and Food Pack. Every counter starts at zero in a new mission, changes by one, accepts only integers 0–10, and locks on confirmation. Native plus/minus controls also enforce cargo space. Mission Control displays one important issue first under Ready, Needs Fixing or Helpful Tip. Missing supplies are highlighted; the primary correction button adds the needed pack or focuses a removal control when cargo is full.

## Authoritative supply and cargo rules

All current-campaign values are in `src/features/missions/data/supplyBalance.ts`. They are illustrative game values, not real physical quantities or NASA engineering limits.

| Rule | Value |
| --- | --- |
| Each selection counter | Integer 0–10, initially 0 |
| Shared cargo capacity | 24 spaces |
| Cost per supply pack | 1 space |
| Starter reserves | 24 power, 24 oxygen, 24 water, 24 food |
| Conversion per selected pack | +6 internal units of that resource |
| Minimum selection | 1 pack per category |
| Suggested selection | 4 energy, 2 oxygen, 2 water, 2 food |
| Suggested confirmed reserves | 48 power, 36 oxygen, 36 water, 36 food, before landing costs |
| New-campaign status bands | Needs Help below 12; Watch below 24; otherwise Good |
| Optional ICEBOUND science kit | Existing five equipment IDs; 14 spaces derived from their catalog weights |

Draft supply edits never change resources. The preparation engine validates supply range, total equipment-plus-supply capacity, equipment dependencies and current review revision. The reducer initializes reserves once, atomically, after valid confirmation. A second confirmation cannot refill reserves or grant equipment.

The science kit is an explicit checkbox, initially off. It contains `repair-toolkit`, `field-rover`, `soil-analysis-kit`, `sample-container-set`, and `portable-oxygen-kit`. It costs its original catalog mass and does not add reserve units. The existing trusted campaign setup still declares the fictional installed lab and drilling capabilities. Optional tools are not silently granted, catalog IDs/dependencies remain unchanged, and an omitted kit produces an actionable ICEBOUND readiness hint.

The suggested packs consume 10 spaces; choosing the kit uses the remaining 14. Lower pack counts leave spare space, while additional supply priorities compete with science cargo. Minimum packs plus the kit fit in 18 spaces. Tests prove that the minimum 1/1/1/1 selection and other reasonable 10-pack distributions can complete the real combined, subsurface ICEBOUND route, including research-landing costs, and reach debrief with non-negative resources.

## Compatibility discovered during inspection

This checkout has ICEBOUND operation costs and a ten-sol clock, but **no recurring daily consumption, power-allocation, repair-action or life-support fault engine**. The existing operation costs remain authoritative. No daily depletion, fake repair, power allocation confirmation, automatic equipment reward or fabricated survival result was introduced.

Accordingly, Sol 1's power step opens the real energy/reserve inspection. Sol 2 reads actual array/deployed-equipment condition and offers supported inspection/reserve actions; it never marks damage repaired. Sol 4 checks actual habitat/life-support readiness and supplies. Adding a power puzzle or recurring emergencies requires the separate missing engine contracts. These limits are visible here rather than hidden behind a pretend control.

## Portraits, speech and narration

`characters.ts` centralizes names, roles and replaceable portrait paths. Local, labeled 120×120 SVG placeholders are supplied for Captain Kiki, Dr. Kofi, Menemo, Dr. Olef, BAI, Earth Mission Control and Scout. No generated/random character photograph is used. BAI has its own teal assistant frame and portrait slot. Four labeled supply illustration placeholders use consistent 120×100 vector slots.

`CharacterDialogue` renders the portrait, canonical name, short spoken line and continue indicator. It is used for exploration, preparation and current launch/travel/landing speech. Clicking/tapping the speech area or pressing Enter/Space advances one beat. A 350ms guard and held-key handling prevent accidental multiple-beat skipping. Informational chat can be skipped without choosing a gameplay decision. Completion restores focus to the relevant action. Rerenders do not reset the local beat cursor, and completed dialogue IDs persist in the centralized store.

General narration uses a small neutral scene overlay with no portrait. Rejected operations use a separate concise alert with a caution symbol. Choices remain separate native buttons, with engine validation before any effect.

## BAI guidance and mission integration

- **Sol 1:** Habitat inspection → solar-array inspection → actual energy inspection → optional next sol. Each inspection is free. The player can still end a sol without completing an introductory tour.
- **Sol 2:** Healthy and damaged array dialogue branches use current facility/deployed-equipment status. Energy inspection follows. Unsupported repair choices are not invented.
- **Sol 3:** BAI introduces Dr. Kofi's clue; Dr. Kofi suggests Scout. A highlighted Scout target appears only when an actual packed rover is available. Recon success guides real site comparison.
- **Sol 4:** Supplies are highlighted for a short awareness check. Actual habitat attention changes the message. The director then resumes the next eligible science step.
- **Sol 5:** Unfinished research directs site selection and expedition planning. The planner shows one step at a time: team, sampling method, tools, then actual Mission Control review/confirmation. Completed earlier science is not recommended again.
- **Later sols:** Actual resource warnings take priority once per sol, with a practical readiness/cost hint. Then the director resumes current objectives. Completed ICEBOUND shifts to outpost checks and the existing final debrief.

`GameState.guidance` stores only free inspection observations and dialogue acknowledgments. It is not another mission/objective engine and never grants jobs, science, resources or equipment. All mission actions, review revisions, deterministic classifications and major-action costs still come from the existing engines/reducer.

Save schema v2 replays validated actions with a fixed campaign discriminator. Existing v1 histories migrate under the old equipment-only campaign, preserving their original reserve rules; they are not reinterpreted as free new supply packs. An old preparation save retains its legacy preparation screen for compatibility. Starting a new mission always selects the new supply campaign. Reset also clears dialogue/inspection observations. No raw resources are trusted from a save.

## Validation and evidence

- **227 automated tests passed.** Coverage includes original mission/store checks; supply counters/range/capacity; exact conversion across every quantity; one-time initialization/locking; real 10-sol loadout playthroughs; all three scientific findings; guidance state/conditions; free duplicate-safe observations; portrait assets; dialogue debounce; and v1/v2 save compatibility.
- **Build passed:** TypeScript and Vite production bundle.
- **Lint passed:** no warnings.
- **`git diff --check` passed.**
- **Actual Chrome browser QA:** zero page/console errors. Tested preparation, reviews, confirmation, launch/travel/landing, guided early sols, portrait sequence and debounce, Space/focus return, stepped expedition planning, all three ICEBOUND findings, touch input, save/resume, and the full ten-sol ending.
- **Viewport checks:** 1366×768, 1920×1080, tablet 1024×768, mobile 390×844. The map scene matches viewport bounds, HUD positioning is absolute, art maintains its aspect ratio, target centers pass hit tests, and the document has no page overflow. Preparation uses internal scrolling when needed.

Evidence: [browser results](qa/hud-supplies/browser-results.json), [preparation](qa/hud-supplies/preparation-1366.png), [desktop map](qa/hud-supplies/outpost-1366.png), [1920 map](qa/hud-supplies/outpost-desktop-1920.png), [tablet map](qa/hud-supplies/outpost-tablet.png), [mobile map](qa/hud-supplies/outpost-mobile.png), [positive finding](qa/hud-supplies/positive-result.png), [negative mobile finding](qa/hud-supplies/negative-mobile.png), [inconclusive tablet finding](qa/hud-supplies/inconclusive-tablet.png), [debrief](qa/hud-supplies/debrief.png).

## Files in this pass

Created:

- `src/features/missions/data/supplyBalance.ts`
- `src/features/story/components/CharacterDialogue.tsx`, `LegacyPreparation.tsx`, `exploration.css`
- `src/features/story/data/characters.ts`, `guideDialogue.ts`
- `src/shared/store/suppliesGuidance.test.mjs`
- Four vectors under `public/assets/supplies`; seven portraits under `public/assets/portraits`
- `scripts/hud-supplies-qa.mjs`, this report and new `docs/qa/hud-supplies` evidence

Modified:

- Story `AdventurePreparation`, `AdventureExperience`, `AdventureMission`, `adventureDirector`, `adventureLocations` and component tests
- Map `MarsMap.tsx`, `MarsMap.css` and public map props
- Preparation types/engine/review, progression validation and ICEBOUND readiness validation
- Shared game/initialization contracts, reducer, campaign setup, GameProvider, save codec and adventure tests
- `scripts/browser-qa.mjs` entry and README/design/architecture/integration documentation

Existing story illustrations, terrain, characters, animation controller, ICEBOUND science rules, catalog IDs, dependency definitions, Vite setup and package dependencies remain in use.

## Known limits and launch

Recurring consumption, power allocation and repair operations remain unavailable for the reasons above. Real-device touch, screen-reader and child playtesting remain future review work. Portraits/pack art are explicitly placeholders. Legacy saves retain legacy balances; new missions use the supply model. The calibrated values need normal C/D/E review before merge. No automatic Git publication was performed.

From `C:\Development\astrobai-red-frontier`:

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 4177 --strictPort
```

Open [the game](http://127.0.0.1:4177/).

Re-run browser QA with an external Playwright installation and installed Chrome:

```powershell
$env:PLAYWRIGHT_MODULE = 'file:///absolute/path/to/playwright/index.mjs'
npm.cmd run test:browser
```

The browser script starts/closes its own localhost server at port 4188 and uses isolated browser contexts.

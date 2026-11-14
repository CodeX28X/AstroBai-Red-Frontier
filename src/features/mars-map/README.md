# Developer B — Mars map

The root player application now uses this map, its ICEBOUND adapter and working room job panels.
FacilityInterior accepts optional activityPanel content; decorative hotspots still inspect for free. Unbuilt status is
an explicit display value, and the lab marker derives from installed lab readiness. See
[the current integration guide](../../../docs/MVP_GAMEPLAY_INTEGRATION.md). Earlier preview
notes below describe their original transfer scope.

Developer B's visual components live in the owning Mars map feature. The research-site
preview is connected to the existing centralized ICEBOUND state; integration details follow.

PR #8's existing map, site graphics, interiors, animations and preview layout are retained.
The full preview now uses the existing GameProvider. Its research-site data comes from
selectIceboundView and validateObjective; names and observations come from D's engine.
The standalone props.html fixture remains an isolated visual contract test.

Open the full preview with ?debug=1 and use Settings → Load confirmed Sol 3 preview to
exercise the connection. This opt-in setup dispatches supported preparation, launch,
landing and sol actions; it does not grant resources or an installed lab/drill. Then
choose Recon (Record reconnaissance), inspect a site, and select it with Select research site.
The ordinary preview starts with the real initial state and explains its locked status.

Inspection only opens the existing card. The selected marker and mobile aria-pressed state
always reflect GameState. Selected sites use B's active style; only an executed expedition
adds an assignment sprite, and a recorded report adds the completed style/notice. Negative
and inconclusive results remain valid. Details expose recorded recon, terrain, accessible
methods, operational hazards, fictional labeling, and the existing source registry links.
No scenario ground truth is revealed before analysis. Blockers come from the engine.

For A's future host integration, import useIceboundExploration and IceboundSiteDetails
from this feature index inside the existing GameProvider. Pass sites, selectedSiteId and
completionNotice from the hook to MarsMap; onSelectSite may open local inspection, and
IceboundSiteDetails onSelect uses the hook's selectSite. reconnoitre dispatches RECON.
No hook stores mission state. No provider is mounted inside the map or hook.

Remaining limits: facility statuses/interiors and environment controls in this preview are
labeled visual fixtures. The research-lab versus water-extractor and unbuilt status contract
still needs owner agreement. Those controls never change ICEBOUND readiness. The old team
request preview is removed from this connected view: planning review/confirmation, execution,
sampling and analysis still need compatible UI. A's root app and storyline are unchanged;
this preview entry is not included in the root production bundle.

npm test now includes the B component, route and ICEBOUND UI tests. Tests use the established
Vite bundle + React server-rendering approach and real callback/reducer transactions; no
DOM test dependency was added. Run node src/features/mars-map/tests/buildPreview.mjs to
check both HTML preview bundles. Browser layout and device checks remain separate.

## Original visual transfer notes (historical)

## Preview

From the **team repository root**, run:

```powershell
npm.cmd ci
npm.cmd run dev -- --host 127.0.0.1 --port 4174
```

Open `http://127.0.0.1:4174/src/features/mars-map/preview/index.html` for the interactive map, four inspection rooms and ICEBOUND display fixtures. The ordinary `/` URL still shows the team's existing opening-story application.

Open `http://127.0.0.1:4174/src/features/mars-map/preview/props.html` to test MarsMap without preview-shell styles. Inspect a building/site and use the controls to change the supplied status, assignment, environment and motion props. Only selection should increase the callback counter.

Click/tap to inspect; Tab then Enter/Space works on native buttons. The full preview also supports 1–4 to select, E to enter and Escape to leave/clear. Settings → Ambient animation pauses decorative movement. The astronaut walks to a selected building and stays at its entrance when returning from a room. Inspection has no resource/action-slot handler. Rooms have three inspection spots each; they do not operate equipment.

Preview entries are development-only HTML entries, not part of the team's normal single-entry production build. `buildPreview.mjs` verifies them separately without editing the shared Vite setup or main output.

## Public display API

Import `MarsMap` and `MarsMapProps` from this feature's `index.ts`. `FacilityInterior` is also exported for A's optional inspection-room flow. Feature CSS is imported by the components. Do not import the preview's global stylesheets into A's dashboard.

| Prop | Purpose |
|---|---|
| `facilityStatuses` | Required presentation status for each of the four map facilities |
| `selectedFacilityId`, `onSelectFacility` | Controlled free inspection selection |
| `sites`, `selectedSiteId`, `onSelectSite` | Controlled site display/inspection; site status supplied by parent |
| `environment` | Optional dust, solar-warning and shelter visual flags |
| `animationsEnabled`, `isActive` | Optional presentation pause/visibility controls; default true |
| `completionNotice` | Optional message supplied after an approved external outcome; creates no reward |

Feature-local types in `types/marsMap.ts` are a **presentation contract**, not a replacement GameState. `demo/` contains isolated disposable fixtures. They are not shared state. The root feature index does not import the demo app or its stylesheet. No new dependency, resource calculation, mission eligibility, power puzzle, operation or event trigger is introduced.

## Integration issue requiring C/D/A review

The current shared `BuildingId` includes `water-extractor` and lacks `research-lab`; the approved design and this map use **Research Laboratory** as the fourth facility. The shared `BuildingStatus` also includes `unbuilt`, which the current visual contract does not represent. These cannot be mapped silently: a water extractor is not a laboratory, and unbuilt is not offline.

The existing shared GameState/action contract therefore remains untouched. Before mounting a state adapter, C/A/B must agree on facility IDs, unbuilt presentation and status ownership. D must supply actual site IDs/statuses/assignments and approved expedition validation. The parent should adapt approved data to the display props and wire inspection only to a free selection callback. No animation or inspection callback may spend a slot or dispatch a resource update. Do not mark this feature as fully integrated until that agreement is recorded through the team's integration-contract process.

The preview's **Preview request** only displays an explicit non-dispatched request message. It does not validate or start an expedition. Available/locked/active/completed and rover/astronaut/combined are supplied visuals. Inspecting completed sites grants no rewards. Site labels and inspection copy remain drafts for E review.

## Assets and motion

Terrain, facility/room art and expedition sprites are original inline SVG and CSS with a common chunky pixel style; no external raster assets or fonts are required. Artwork uses crispEdges. Terrain, scenery, facility/site buttons, actors/effects and UI are separate layers. Building offline/damage states and crew sheltering are visual inputs only. Reduced-motion CSS, the walker preference listener and page-visibility cleanup are retained.

The desktop shell uses a scaled 1280×720 canvas; mobile reflows controls beneath the map. The earlier audit passed core layout checks at1920×1080,1366×768,1280×720 and390×844. Intermediate narrow-desktop target scaling, direct OS reduced-motion/hidden-tab transitions, actual touch hardware, screen-reader speech, low-end profiling and child usability still need verification. This port received a new browser smoke test, not a repeat of the entire audit matrix.

## Verification

Run these from the repository root:

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd test
node --test src/features/mars-map/tests/*.test.mjs
node src/features/mars-map/tests/buildPreview.mjs
```

The existing npm test script is preserved and runs the team's65 tests. The explicit B test command runs11 tests:5 walking-route tests and6 grouped component contract tests, including24 facility/status/selection combinations. Components are bundled with the installed Vite compiler for React server rendering; no extra compiler or DOM-test dependency is installed. Native mounted interactions and prop updates use the separate browser fixture. B tests are not automatically added to the shared npm script; team CI should invoke the command above or approve a script update.

The walker effect synchronizes React walking indicators with an imperative rAF/DOM animation; its local `set-state-in-effect` lint exception is documented in place. Other feature lint warnings were fixed by separating fixture hooks and component entry points.

Verified during transfer: normal TypeScript/production build, clean lint,65 team tests,11 B tests, and both preview production bundles. Browser smoke checks passed all four selections, laboratory enter/back with stationary return, isolated facility/site prop updates and unchanged root app. No full team-store integration is claimed.

## Suggested draft PR

Title: **Add Developer B Mars map and isolated visual preview**

The map provides four selectable facilities, status artwork, inspection rooms, ICEBOUND site markers, expedition sprites and prop-controlled environmental effects under the owning feature folder. Existing team gameplay and app shell are preserved. Shared facility IDs/unbuilt presentation need C/A/B agreement before store integration; the map remains a display module with isolated mocks.

Validation: build and lint pass;65 team tests and11 B tests pass; standalone preview bundles build; browser smoke checks pass. Review the feature's integration notes and remaining accessibility/device checks before merge.

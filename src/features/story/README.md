# Developer A story and dashboard UI

The player application now reuses these visual primitives at the root URL. See
[the current integration guide](../../../docs/MVP_GAMEPLAY_INTEGRATION.md). The following
sections describe the original visual handoff; its preview/story fixtures remain isolated.

Draft UI handoff based on the supplied GDD v2.0 Child-Centered. The live team app entry point, shared state/reducer, mission implementation, package files and Vite configuration are unchanged. Game rules and actual state integration remain C/D-owned.

## Preview from the team repository root

```powershell
npm.cmd ci
npm.cmd run dev -- --host 127.0.0.1 --port 4177
```

Open http://127.0.0.1:4177/src/features/story/preview/index.html. The ordinary `/` page remains the team's existing opening-story app. The artwork gallery is at the same feature preview URL with `?gallery=1`.

Start with New Mission, select two cargo crates, then continue through cruise and landing. The dashboard composes B's public MarsMap component. Review tools at the top select fixed scenes, outcomes, save notices, blocked cards and other UI snapshots; they are not player controls or a game engine. Preview requests never apply resource changes or mission rewards.

## Included A scope

Menu/save/restart messages;13 primary short-chat scenes; chapter/Sol cards; indicators and dashboard; power-plan controls with parent validation; hero/event dialogs;45 feedback records and70 system strings; Home Check; discovery/evidence/messages; chapter recaps and Quick Checks; outcome/patch and Kid/full debrief; text/motion/read-aloud/sound preferences. All16 supplied PNGs are under `public/assets/story`, with flattened reference dashboards excluded from playable controls.

Import `DeveloperAExperience`, `ExperienceView` and `ExperiencePorts` from this feature's `index.ts`. The view model is isolated presentation data, not a replacement GameState. C/D's approved adapter supplies current choices, costs, validation, variants, feedback, saves and outcomes and maps ports to real typed actions. See `GDD-V2-UI-HANDOFF.md` for coverage/limits and `INTEGRATION-CHECKLIST.md` for shared-state verification. Their standalone-package references describe the source handoff; this team version keeps its preview and tests inside this feature.

Power drafts are controlled by the parent. C must return matching draft/validation and revalidate a final commit. Custom preview plans are intentionally blocked without that validator. Lab Boost uses the same proposal path; any greenhouse swap must come from the approved validator. No simulation formulas or resource setters were added.

UI preferences alone use a separate localStorage key. Mission saves/checkpoints require C/D's validated save module. Science remains an archived bracketed placeholder until E/D supply a verified NASA record. Conditional narrative variants, final content/science review, real-device sound/voice/accessibility checks and child playtesting remain pending.

## Dependency and branch review

This A branch starts at B's commit `4b976db` because it imports `src/features/mars-map` through its public API. **A adds no changes to B's files.** If B is not yet merged, review A against `feat/b-exploration-UI`; after B merges, retarget A to `main`. Do not treat inherited B files as new A changes. A's actual additions are limited to `src/features/story` and `public/assets/story`.

The current shared contract lists water-extractor rather than research-lab and includes unbuilt. Resolve the facility/state contract with C/A/B and v2.0 action/mission contracts with C/D before integrating. No contract was silently modified to make the preview run.

## Verification commands

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd test
node --test src/features/story/tests/*.test.mjs
node --test src/features/mars-map/tests/*.test.mjs
node src/features/story/tests/buildPreview.mjs
```

The existing shared npm test script remains unchanged. Invoke the A tests explicitly in CI until the team approves updating the root script. The separate preview build goes to ignored `node_modules/.cache`; the normal production app entry is preserved.

## Facility entry repair

A now imports B's existing FacilityInterior and provides Enter buttons for all four buildings. The map is retained/paused under a hidden wrapper while indoors. Back/EXIT/Escape restores focus and preserves the astronaut's entrance position. Four desktop and four mobile room returns passed browser checks; the A suite now has13 passing tests. This is free inspection/navigation, not an operation or expedition. No B or C/D source files changed.

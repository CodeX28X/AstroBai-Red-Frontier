# Development playtest UI

Run from the repository root:

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Default run: http://127.0.0.1:5173/src/features/dev-playtest/index.html

Explicit installed-lab/drill TEST PRESET:
http://127.0.0.1:5173/src/features/dev-playtest/index.html?preset=installed-lab

This independent HTML entry renders only with import.meta.env.DEV. The root application
and B's existing previews remain available. No second game store is created. One existing
GameProvider owns the entire run and stays mounted while stage components change. Reloading
or following a new-run link starts a new run; Reset uses RESET_GAME and retains the chosen
initialization capabilities, as the existing reducer specifies.

## Manual playthrough

1. Start game. In preparation set one each of Field Rover, Repair Toolkit, Soil Analysis Kit,
   Sample Container Set and Portable Oxygen Kit (14/30 cargo units). All other quantities can
   remain zero. Inspect dependencies, request review, then confirm and begin launch.
2. Complete launch. Inspect the landing modifiers and land at the safe zone.
3. Advance from Sol 0 to Sol 3 using three presses. Record reconnaissance. Inspect Lumen Shelf
   on B's map and explicitly select it in the details card.
4. Create an expedition draft. Use rover-only and surface-sampling. Select all five deployed
   tools. Declare power 30, oxygen 15, water 8 and food 8. These are planned supplies, not grants.
5. Review expedition. Inspect costs, blockers, warnings and recommendations. Confirm, then
   execute. Recon and execution consume both major slots on Sol 3.
6. Advance to Sol 4. Collect the sample. Under the DEFAULT baseline, analysis is blocked:
   no lab capability is installed and no installation action exists. This is a real contract gap.
7. Under the explicitly labeled LAB/DRILL TEST PRESET, analysis is available. Analyze, then
   record the scientific report. Surface sampling of Lumen Shelf yields the engine's negative
   finding; subsurface drilling with the installed drill yields its supported-ice finding.
   Echo Ridge with an astronaut-team plan can produce the engine's inconclusive finding.
8. Advance to Sol 10, then enter debrief. Verify survival outcome separately from the science
   outcome. Incomplete science is never described as evidence of absent ice. No Sol 11 exists.
9. Expand diagnostics to inspect state, IDs, slots, objectives and the latest 50 dispatched
   intents. Close/reopen inspection/details to check state retention. Reset and verify all
   mission progress and resource balances return to the reducer's initialized state.
10. Watch the browser console for runtime errors. Browser automation could not initialize in
    this environment, so these browser steps remain manual.

Before confirmation, try an overweight manifest or a battery without its solar-array
dependency and request review: confirmation must be blocked. Change a reviewed draft:
its review must invalidate. Confirmed cargo and plans cannot be edited. Use the explicitly
labeled slot-tracking button to exhaust slots without inventing facility effects; the next
eligible mission operation should be blocked until a sol advance. Rejected requests must
leave resources, objective progress and applied IDs unchanged.

## Implemented controls and boundaries

Menu, manifest edits/review/confirmation, launch, landing, sol advance, slot tracking,
recon, site selection, shared expedition draft/review/confirmation, execution, collection,
analysis, report, debrief and reset dispatch existing GameAction variants only. Read-only
mission selectors produce costs, objectives, eligibility and explanation text. Only the
central reducer commits effects. A provider option catches its explicit rejection exception
and displays feedback; unexpected programming exceptions are not swallowed.

No recurring resource simulation, power allocation, numeric crew health, facility construction,
repair or operation actions exist. The interface shows authoritative readiness booleans and
facility statuses and identifies these missing mechanics. B's facility IDs/statuses do not
match the store: the map renders science sites with facility buttons hidden, and actual
facility statuses are listed separately. No alternative facility mapping is fabricated.

The default baseline cannot complete laboratory analysis or drilling. The preset uses the
already supported trusted GameInitializationOptions at initialization, never runtime state
overrides. It grants no resources, cargo, completed objectives or scientific results.

## Verification

npm run build; npm run lint; npm test; git diff --check

Tests use the established Vite bundle/React server-rendering approach plus real reducer
transactions. Default menu-to-debrief needs no fixture state changes. Separate preset tests
complete science using legal actions, and cover negative and supported findings, validation,
confirmation locks, slots, replay, error feedback, stage remounts, debrief and reset. Existing
ICEBOUND tests retain inconclusive/incomplete findings coverage. The standalone entry's
production bundle is checked to expose only the development-server notice.


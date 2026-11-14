# AstroBai player gameplay and survival integration

Updated 2026-11-15. This describes the normal player game at the root URL. Older visual
previews and engine fixtures are separate and may deliberately disable survival.

## Start the game

From the repository root:

```powershell
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open http://127.0.0.1:5173/. Refresh after updating the code and choose New Mission.
No debug flag or test preset is needed. Survival changes the game rules, so older saves
show an incompatibility notice rather than silently replaying with new costs.

## Player experience

The root application reuses A's original menu, artwork, dialogs, panel colors and typography,
and B's original map, building art and interiors. The flow is:

menu → packing → launch → optional travel illustration → landing → outpost / ICEBOUND → results.

One GameProvider owns the authoritative GameState. Inspection, menu panels, animation settings,
confirmation dialogs and the travel illustration are local presentation only. Returning to
the menu does not reset the run. Continue resumes it. Play Again uses the real reset action.

The UI is aimed at ages 8–12: compact supply bars, visible numbers and refill words, two
daily job dots, short buttons, plus/minus packing controls, contextual help and optional
details for longer information. Warnings use words as well as color. Main controls retain
large touch targets and visible keyboard focus. Native dialogs confirm irreversible choices.

The supply strip calls stored power Energy and oxygen Air; these are the same existing
resources, not extra systems. All numbers are fictional game units, not physical measurements.

## Packing, arrival and facilities

Equipment and dependencies come from the real catalog. The five supported field-tool items
appear first; other cargo is collapsed and its current gameplay limits are explained.
Packing changes, review, confirmation, launch and landing all use existing reducer actions.
Hard blockers prevent confirmation; noncritical warnings remain advice. A blocked packing
check is shown as help needed even though the underlying review operation completed.

The normal scenario commissions the habitat, solar panels, greenhouse, water recycler,
laboratory and drill at landing. This baseline is disclosed before packing. Installed lab/
drill capabilities use the existing trusted initialization contract; optional cargo still
controls rover, EVA, sampling tools, sample handling and field context.

Launch/travel use A's supplied artwork. Travel is only a visual flag within launch.
COMPLETE_LAUNCH enters landing without an interactive cruise phase or extra travel costs.
LANDING_SITES and the central reducer own the one-time landing effects. Landing costs and
ICEBOUND science costs are unchanged.

The B map keeps its four visual locations. Its lab marker represents installed laboratory
readiness, never a renamed water extractor. Recycling at home requires both the real habitat
and water-extractor statuses. Each displayed status comes from the actual shared state.

## Survival rules

The normal player scenario enables SurvivalState. Legacy createInitialGameState fixtures
leave it off to preserve their original, isolated engine contracts.

Every accepted End day spends:
- 10 energy
- 8 air
- 8 water
- 10 food

Supplies remain between 0 and 100. If a supply reaches zero after overnight use, the existing
failure outcome is recorded. The crew stays in shelter, further operations are blocked, and
the existing debrief action ends the mission. Negative balances are never displayed.

These are gentle fictional balance values, not NASA data or real human survival limits.
There is no numeric crew-health model. Crew/EVA readiness is disabled on a terminal shortage.

Each room job costs ONE of the TWO daily major actions, shared with ICEBOUND:

| Room / job | Refill | Energy used |
| --- | --- | --- |
| Solar panels / Charge the base | Up to 30 energy | 0 |
| Greenhouse / Pick food | Up to 30 food | 4 |
| Home / Refresh air and water | Up to 25 air and 25 water | 3 |

Each job can run once per day. It is available again after a valid day advance. Actual gains
stop at capacity. If the relevant stores are already full, the operation is rejected without
spending energy or an action. The food action gathers an available greenhouse supply; it is
not a model of growing a crop instantly.

Missing facilities, insufficient energy/jobs, stale day requests, unknown operation IDs,
duplicates and terminal missions reject atomically. Deterministic operation IDs are recorded
in the existing applied/spent guards and the survival care history. UI rerenders and room
visits do not refill anything.

End-day buttons include expectedSol, so a repeated old confirmation cannot consume a second
night of supplies. Daily upkeep has its own lastUpkeepSol consistency check. Forecasts are
read-only and predict the actual next-night shortage. The existing ten-sol limit remains.
Under the current completedSol contract, the advance from 9 to 10 completes the final day.

## Rooms that work

Opening a room or tapping an inspection hotspot is always free. Explicit job buttons in the
room operate equipment:
- Solar room: charge energy.
- Greenhouse: pick food.
- Home: run air/water recycling.
- Lab: study a collected sample, read the actual finding, and share the science report.

B's FacilityInterior accepts an optional activityPanel. Its art, room hotspots and animations
remain intact. Gameplay buttons are supplied by the parent and dispatch actual typed actions.
Returning to the map preserves game progress and restores focus after the room unmounts.

## Complete ICEBOUND workflow

D's deterministic engine and C's integration remain authoritative. Recon starts at Sol 3.
Inspect a real site on the B map, compare its ground, access and hazards, then confirm a site.
The selected marker always reads GameState, never local inspection state.

Trip drafts, review and confirmation use the existing shared planning actions. Packed tools
are selected explicitly. Pack enough for this trip fills declared amounts from the engine's
requirements; it does not grant or reserve supplies. Editing invalidates the previous review.
The locked plan collapses, and completed trips do not keep showing obsolete departure blockers.

Recon, execution, sample collection and analysis each cost one big job. Site selection,
planning, review, confirmation and report recording cost none. Both science and base-care
costs are committed by the same central reducer.

After collecting a sample, Go to the lab opens the actual lab room. Study this sample calls
ANALYZE_SAMPLE. Share my science report calls GENERATE_REPORT. Repeated clicks cannot charge
again. Positive, negative and inconclusive findings are all valid completed investigations.
Incomplete diagnostics remain incomplete. No UI code manufactures samples or scientific results.

All locations and game conditions remain explicitly fictional. Existing science-source links
are preserved. No live NASA data, fabricated sensor measurements or new network dependency
was introduced.

## Ending and replay

Sol 10 completion or a real terminal shortage makes the existing progression engine eligible
for ENTER_DEBRIEF. Science completed on Sol 4 does not end the campaign early.

Results separate outpost success/failure from scientific completion and classification.
A failed base can still have a valid completed science report. A successful base can have
unfinished science. The result screen shows actual supplies, choices, objectives, samples,
findings and limits. On shortage it names the supplies that ran out.

Play Again clears costs, care history, samples, reports, IDs and resources using the current
player baseline. Main Menu preserves the current run for Continue. Existing event/objective/
feedback IDs and the pure ending adapter remain hooks for later narrative integration.

## Save/resume

Player saves now use:
- key: astrobai.player-mvp.actions.v2
- version: 2
- rules: icebound-survival-2

The save stores accepted typed commands, not another authoritative GameState snapshot.
Loading replays the same reducer from the fixed player baseline. Blocked reviews and invalid
numeric drafts are retained when they change a real review/draft record. Rejections that
only change feedback are omitted. Care jobs, daily upkeep and terminal outcomes replay exactly.

Old v1 saves are detected and left untouched until a new mission replaces them. New writes
remove the legacy record. Corrupt, incompatible, forged and oversized saves show notices.
A permanently unrecordable stream stays blocked until reset; partial logs are not silently
resumed. Storage denial keeps the in-memory game usable and warns about refresh loss.

Saves are limited to 512 commands and 300,000 characters. Multiple tabs are not synchronized;
the last writer wins. Browser storage clearing removes the saved run. UI settings and
developer presets remain separate. No accounts, cloud backend or child-data collection exist.

## Manual playtest

1. Refresh the root URL and start a new mission. Pack one of each visible field tool.
2. Check packing, lock the bag, launch, continue/skip the journey and choose a landing site.
3. Open each room. Confirm inspection changes no supplies or job count.
4. End days until day 3. Read the supply bars: every end-day must consume the documented
   amounts once and restore two jobs.
5. Charge energy at the solar panels; pick food in the greenhouse. Each successful job
   changes real supplies and uses one job. The same job is disabled for the rest of that day.
6. For the science path, survey sites, choose Lumen Shelf, plan Rover only with drilling,
   select the packed tools, pack the required amounts, check and lock the trip, then go.
   Recon and execution can use both jobs on day 3.
7. On day 4 collect the sample, enter the lab, study it and share the report. The finding is
   the engine's supporting-ice classification. Read its limitations.
8. Keep the base supplied through the mission ending. Recharge before energy runs low;
   harvest before food runs out. Air/water recycling is available at home.
9. Refresh and Continue. Check that all science, supplies, care jobs and action counts persist.
10. Try Cinder Flats with rover/surface sampling for a negative result; Echo Ridge with an
    astronaut team and surface sampling for an inconclusive result.
11. Start another run and deliberately ignore supply warnings. The mission must end when
    supplies run out, and the results must explain why without granting recovery after failure.
12. Use keyboard navigation and test mobile widths. Watch the browser console for errors.

## Implementation and verification

Core additions: shared/types/survival.ts and features/simulation/outpostSimulation.ts.
The existing reducer commits operations/upkeep; playerMission enables the normal scenario.
playerSave/providerSession handle v2, replay and fixed-baseline reset.

Player presentation adds BaseCarePanel, LaboratoryPanel, SupplyStrip and friendlyFeedback;
OutpostScreen composes these with B's rooms. Other gameplay components simplify labels,
packing, progress, trip details and feedback. B's site/facility labels are presentation-only.

Validation commands:
```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd test
npm.cmd run test:icebound
npm.cmd run typecheck:icebound
git diff --check
```

Tests cover upkeep and forecasts, exact costs/gains, caps, duplicate/stale requests, unknown
jobs, full stores, facility readiness, shared action limits, genuine shortage failure, reset,
v1 migration, v2 replay, room-button dispatch and free navigation. Full successful science
runs cover positive/negative/inconclusive results with regular base care. Browser automation
still fails to initialize because kernel assets cannot be written; no visual or console QA
is claimed. Manual browser and child usability testing remain required.

No separate power-allocation puzzle, weather/emergency generator, repair system or numeric
health model was added. These are separate future mechanics, not fake buttons in this game.
The implemented survival jobs, lab workflow and shortage ending are functional today.


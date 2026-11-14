# Developer C integration guide: Mission Preparation Engine

## Current boundary

The preparation engine is mission-owned and pure. Its `PreparationState` is separate from shared `GameState`; it does not create another React provider, write resources, or edit shared store files. It accepts a typed `PreparationIntent` and returns a `PreparationResolution` containing the next preparation state, action issues, and the latest `MissionReview` when available.

## Recommended integration

- Keep one centralized `GameState`, reducer, and provider.
- Coordinate with Developer D before adding a preparation slice or action to shared state. If preparation state is hosted in `GameState`, store the returned `PreparationResolution.state` as one reducer transition; do not duplicate the manifest in local UI state.
- Route `SET_EQUIPMENT_QUANTITY`, `REVIEW_MANIFEST`, and `CONFIRM_MANIFEST` through an agreed shared action boundary. React views should render the result and dispatch intents, not implement validation.
- Confirmation is permitted only after the current revision has a successful review. The reducer or caller should treat `confirmedAtRevision` as immutable and reject further edits or confirmations.
- Resource effects and launch execution are outside this engine. Do not apply cargo effects to resources from this module.

## MVP phase dependency

The current shared `GamePhase` does not include `preparation`, and `GameAction` has no preparation intent action. The requested MVP sequence (`menu -> preparation -> launch -> landing -> outpost -> debrief`) therefore needs a separately coordinated shared-type/reducer change before the application can connect this engine to the centralized flow. This guide and engine leave Developer C's files unchanged.

## Phase 3B.2 progression contract

Use `validateMissionTransition(context, intent)` from the mission barrel for the MVP sequence:
`menu -> preparation -> launch -> landing -> outpost -> debrief`.

The context adapts existing shared outcome/objective types and includes the preparation state and `completedSol` (the last fully completed sol). `MissionProgressionPhase` derives from shared `GamePhase`, excluding `travel` and `return` and temporarily adding `preparation`. It is not a second centralized state.

Intents and required source phases:

| Intent | Source | Proposed destination | Gate |
| --- | --- | --- | --- |
| START_GAME | menu | preparation | Mission has no terminal outcome |
| BEGIN_LAUNCH | preparation | launch | Confirmed current manifest, current successful review, fresh manifest validation |
| COMPLETE_LAUNCH | launch | landing | Mission has no terminal outcome |
| SELECT_LANDING_SITE | landing | outpost | Known site and no prior landing completion |
| ENTER_DEBRIEF | outpost | debrief | Terminal outcome or fully completed Sol 10 |

Rejected results include a stable code and message, no next phase, and no effects. Accepted results contain a destination, completion marker, feedback, resource requirements, and proposed `MissionEffect` values. The new `LANDING_SITES` export reuses existing landing IDs, narrative descriptions, educational feedback IDs, and abstract balancing proposals, without the old travel prerequisite.

C must resolve against current state inside the reducer, validate resource requirements and final balances, and commit phase, all objective markers, and deltas together exactly once. Never cache and replay a proposal. Every transition proposes `mission-transition:<source>:<destination>` as a completed objective; landing additionally uses the existing `story-decision:<site-id>` marker. Any completed landing-site marker blocks both repeating the same site and changing sites for more rewards. Calling the pure function twice on an unchanged snapshot intentionally gives identical proposals; only the centralized commit records completion.

`evaluateDebrief` gives an existing terminal success/failure outcome priority. With no terminal outcome, fully completing Sol 10 yields MVP survival success. This is not a separate objective score or a return-flight condition. C must supply completed-sol bookkeeping after resource simulation, not pass a sol that has only just started.

### Required Developer C migration (not implemented here)

1. In `src/shared/types/game.ts`, add `preparation` to `GamePhase` and remove `travel` and `return` after retiring their compatibility callers. Keep one GameState and provider. Add an agreed preparation slice and completed-sol bookkeeping.
2. Extend `GameAction` with the progression intent boundary (BEGIN_LAUNCH, COMPLETE_LAUNCH, SELECT_LANDING_SITE, ENTER_DEBRIEF); route START_GAME through this validator instead of directly proposing launch. Route preparation intents through the existing preparation engine.
3. In `src/shared/store/gameReducer.ts`, replace the opening-story routing with current-state transition resolution and an atomic validated effect application. Store completion markers and debrief outcomes. Keep invalid transitions from changing mission data.
4. Update `src/app/App.tsx` with A to use the preparation/launch/landing flow and typed landing sites. Do not dispatch the legacy launch cargo decisions or travel choices.
5. Replace the legacy expectations in `src/shared/store/gameReducer.test.mjs` and `storyDecision.integration.test.mjs` with the revised sequence, and coordinate retirement of mission story tests that assert travel transitions.

### Remaining compatibility dependencies

`storyDecisions.ts`, `validateStoryDecision.ts`, and `resolveStoryDecision.ts` remain available to the current shared reducer and app. They still describe the old launch/travel choices and travel prerequisites, and their existing tests exercise that old interface. They are deprecated for new MVP callers; keeping them executable until C changes the reducer prevents a partial shared-store migration. Shared `GamePhase` still contains travel/return. There is no implemented Earth-return gameplay, and the new validator has no transition to either obsolete phase.

When removing those shared phase literals, retire or adapt `StoryDecisionChapter`, the legacy definitions/prerequisites, and their resolver tests in the same coordinated change; otherwise those older definitions will fail type checking. Preserve their useful educational descriptions as narrative content. Retain landing content consumed by `LANDING_SITES` or relocate it once while retiring the old module. No C-owned files were changed in Phase 3B.2.

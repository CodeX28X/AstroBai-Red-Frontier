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

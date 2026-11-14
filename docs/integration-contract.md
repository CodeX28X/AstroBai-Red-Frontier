# Integration contract

## Current ownership agreement

- **Developer C** owns the shared reducer, centralized state, and resource calculations.
- **Developer D** owns mission eligibility, progression, event validation, and proposed mission effects.
- **Frontends (A and B)** dispatch typed actions and render shared state; they never directly change resources.
- **Member E** reviews scientific content, references, and QA implications.

The shared state/action contract is in `src/shared/types/game.ts`; the reducer is in `src/shared/store/gameReducer.ts`; mission proposal contracts are in `src/features/missions/contracts.ts`.

## Agreement process

Before implementation begins, the owners of every producer and consumer must review and agree on the contract. Include E when scientific content, learning outcomes, or review workflow is affected. Record the decision here before dependent feature work starts. Changes to shared types must be proposed to C and every affected feature owner; update this record and coordinate consumers in the same change before merging.

For each interface, document:

- **Name and purpose:** What capability or data is shared, and why.
- **Owner:** Which collaborator maintains the contract and implementation.
- **Type shape:** TypeScript types, required and optional fields, and valid states.
- **Flow and lifecycle:** Who produces and consumes it, when it changes, and how errors or unavailable data are represented.
- **Change plan:** Version or migration notes and affected consumers.
- **Review:** Date and collaborating owners who agreed.

Keep feature internals private. Shared types belong in `src/shared/types`; avoid adding speculative interfaces before a concrete vertical slice requires them.

## Mission effect lifecycle

1. D evaluates eligibility and progression with pure mission functions. They return a `MissionResolution` containing whether resolution is allowed, the result, a reason, and proposed `MissionEffect` values. Mission code must not mutate React state, browser state, or resources.
2. The application submits the proposal through a typed action to C's reducer. The reducer validates the mission and proposal against the current state and rejects invalid or stale effects.
3. Only the reducer applies accepted resource deltas and objective changes, as one state transition. A proposal is applied exactly once; frontends never replay effects or update resource fields directly.

The current Phase 2 reducer deliberately rejects all actions other than start, reset, and sol advancement. Validation and effect application will be added only when the mission resolution action is agreed and implemented.

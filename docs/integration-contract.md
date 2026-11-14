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

## Opening story integration

The opening story uses `CHOOSE_STORY_OPTION`. The reducer calls D's pure resolver, validates returned resource requirements and deltas, then atomically applies resource changes, completion markers, phase transition, and feedback. Completed choices are recorded as objective IDs prefixed with `story-decision:`; the marker prevents a later duplicate effect.

Changes to `GameState`, `GameAction`, and the shared reducer require Developer C review before merge. Other unimplemented gameplay actions remain rejected.

## Draft P0/P1 contract proposal — pending owner review

This section is a proposal for review by C, D, A, and B; it does not change the current TypeScript contract or authorize implementation. The 10-sol duration, two major actions per Sol, free inspection, separate power planning, Sol-boundary recurring calculations, separate power/battery/oxygen/water/food tracking, and C/D ownership boundary are locked by the team design. Unspecified resource balances and survival thresholds remain undecided.

### Candidate state additions

- `actionsRemaining: number`, constrained by the agreed limit of two major actions per Sol. The exact action types that spend a slot and the reset point in the Sol transition need owner review.
- `resources.battery`, separate from `resources.power`. Agree whether `resources.power` means available power or another quantity before adding generation, allocation, or demand fields.
- `appliedResolutionIds: string[]`, storing stable resolution IDs so a mission/event proposal and its rewards cannot be applied twice.
- `resolvedEventIds: string[]`, storing event IDs after accepted resolution so the same event cannot be re-resolved under a new proposal ID.
- `GameOutcome` should include `partial-success` alongside `success` and `failure`.
- Keep Power, Life Support, and Protection as derived display indicators; do not store them as competing copies of the underlying resources. Their formulas and thresholds need review before implementation.

Facility mode, power allocation/generation/demand shape, crew state, and science progress are not specified here. A and B should review any field that affects rendering or interactions; C and D should review fields used by mission validation.

### Candidate action and effect flow

Proposed state-changing actions are `ALLOCATE_POWER`, `OPERATE_BUILDING`, `ADVANCE_SOL`, and `APPLY_MISSION_RESOLUTION`. Inspection has no action-slot cost. Power allocation is a separate planning action and does not consume a major-action slot. The exact facility-mode payload and which operation/event actions consume slots require review before these variants are finalized.

For mission/event resolution, D continues to return a proposal; C alone validates and applies it:

```ts
interface MissionResolution {
  resolutionId: string
  allowed: boolean
  success: boolean
  reason?: string
  eventId?: string
  feedbackId?: string
  proposedEffects: MissionEffect[]
}

interface MissionEffect {
  resourceDeltas?: Partial<Resources>
  objectiveChanges?: MissionObjectiveChange[]
  facilityChanges?: Partial<Record<BuildingId, BuildingStatus>>
  actionCost?: number
  feedbackId?: string
}

type ApplyMissionResolutionAction = {
  type: 'APPLY_MISSION_RESOLUTION'
  resolution: MissionResolution
}
```

The reducer should reject a disallowed or already-applied `resolutionId` without changing state; validate all proposed resource costs and action-slot use before any mutation; then apply the accepted effects as one immutable transition and record the ID. D owns eligibility, prerequisites, and proposed mission outcomes. C owns affordability, action-slot validation, and all state/resource writes. A/B dispatch actions and render the resulting shared state; they do not calculate or apply resource changes.

### Decisions required before implementation

1. D and C: approve the stable resolution-ID lifecycle, allowed effect fields, rejection feedback, and which state facts are checked by D versus C.
2. A/B/C/D: approve exact action variants, facility IDs/modes, and which actions consume a major-action slot.
3. A/B/C: approve the power-state and allocation shape and the meaning of the visible Power indicator.
4. C/D/E: agree resource balance values, recurring facility costs/outputs, and survival/return thresholds. Until then, do not add numeric simulation behavior.
5. A/B/D: review the `actionsRemaining`, battery, and `partial-success` additions and confirm consumers before updating shared TypeScript types.

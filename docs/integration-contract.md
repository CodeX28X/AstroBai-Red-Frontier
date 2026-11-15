# Integration contract

## Child-friendly interactions — 2026-11-15

The supplied request authorizes three Actions per Mars Day, randomized preparation, and presentation/accessibility improvements. C remains the sole gameplay writer; D's existing readiness, mission and science engines remain authoritative. A/B render those validations and navigate without completing objectives. No new simulator, repair system, mission store, or scientific classification is introduced. This records the user-authorized contract before implementation; independent owner review remains required before merge.

- `SET_RANDOMIZED_SUPPLIES { supplies: SupplySelection }` is an atomic preparation edit. A pure D-owned generator accepts PreparationState and injectable randomness, respects packed cargo and existing balancing configuration. The engine validates the selection, invalidates review, and never confirms it. Saves journal quantities rather than randomness.
- Existing MAX_ACTIONS_PER_SOL becomes 3. Costs and daily consumption do not change. Version 4 journals remain replayable: paid work and resources are retained, with one additional unused Action per active day. Scene transitions never refill Actions.
- A owns reusable accessible blocked-action feedback, state-derived warnings, optional local Web Speech playback, guidance overlays and outcome explanations. UI-only guide completion uses existing persisted dialogue acknowledgments and awards no progress. Speech is opt-in and cancelled on line/scene/dialog changes.
- B exposes a presentation-only facility-card render slot and highlighted research site. Cards consume A callbacks with real production validated again by C. Mission-log navigation requests never carry mission commands; collision/pathfinding stays authoritative. Gait changes only sprite offsets, not ground coordinates or speed.
- Shared asset references use documented supplied slots and PixelImage fallbacks. NASA/scientific engines are unchanged. E-owned QA covers engine invariants, save replay, layout, input, missing images, speech lifecycle and honest endings/science states.

## Pixel assets and presentation — 2026-11-15

This request changes presentation/navigation only. Shared asset definitions and a reusable image fallback component feed A/B surfaces; resource and equipment identifiers remain existing domain IDs. Five supplied PNG portraits replace their labeled SVG placeholders; Scout/Earth keep matching placeholders. Four supplied resource PNGs are used throughout presentation with existing supply SVG fallbacks. No equipment art is present, so no filenames/items are invented. B aligns building ground collision footprints with the drawn pads, retains the solid flag platform and other obstacles, shares facility approach points, rejects disconnected starts, and raises configured travel speed/cadence by 25%. A adds compact objective/warning access in both HUD modes and a summary-first ending derived from actual outcome/completed sols/resources/science, with existing reports optional. C/D simulation, save schema, progression, scientific findings and all balancing remain unchanged. QA covers actual normal-motion road crossings and resized layouts. This records interfaces and scope; it does not claim independent owner review.

## Gameplay fixes — 2026-11-15

The five-fix request authorizes production and daily consumption. C owns pure `features/simulation` rules and atomic reducer commits: daily consumption is 1 of each resource, no passive generation; manual solar collection yields 5 Energy, habitat life support yields 4 Oxygen or 4 Water for 1 Energy, and the existing greenhouse yields 4 Food for 1 Energy. Each operation uses one job, once per sol. Standard solar/greenhouse systems are commissioned explicitly; no optional cargo is granted. Zero after daily consumption ends the mission in failure; unaffordable advances end it without deductions. Expected sol/resource revision reject stale clicks; consumed-sol records prevent replay. Existing terminal guards remain.

D extends ICEBOUND with per-site investigation records and site-scoped operation/objective markers. Global recon, completed objectives, samples, analyses, costs and events remain cumulative. Each site retains its plan, expedition, progress and report. Switching is allowed after reporting the active site; completed sites cannot award repeat results. One report satisfies overall ICEBOUND; further sites are optional. Scenario science is unchanged. Standard capabilities are listed separately from selectable confirmed optional tools; only catalog IDs enter equipmentIds.

A/B consume authoritative facts for production controls, site eligibility, equipment controls and compact/minimized HUD. HUD preference is presentation state. Save schema 4 rejects histories balanced without daily consumption. Preparation, storyline, NASA content and character animation remain outside scope. This records interfaces before implementation, not independent owner sign-off.

## Resource-scale fix — 2026-11-15

The resource-balancing follow-up supersedes earlier scale values: all authoritative resources are 0–10, preparation storage starts empty before START_GAME selects 5 each, cargo is 35 shared units, and confirmation copies the selected quantities exactly (no baseline or conversion). Explicit optional cargo still uses its catalog weight; standard science equipment is a capability baseline, not a hidden cargo item. Landing uses shared small integer deltas; positive rewards clamp at 10 while unaffordable costs reject atomically. Basic ICEBOUND capabilities are included, preserving existing optional field-instrument/sealed-container quality bonuses and all phase, safety, objective and action checks. Operation costs are recalibrated for this scale. Science classification is unchanged. Save schema 3 rejects old-scale histories rather than silently changing their results. This scope changes resource/mission rules and their display only; story guidance, dialogue, animations, map geometry, presentations and NASA content remain unchanged.

## Overlay HUD and supply preparation — 2026-11-15

The follow-up request authorizes a four-supply loadout and configurable conversion. The new playable campaign uses `PreparationState.supplies` (power/oxygen/water/food integer counters 0–10), with null retaining the legacy equipment-only contract. Each selected pack costs one cargo space and adds six resource units to a documented baseline of 24 per resource. Capacity is 24 shared spaces. Each category needs at least one pack; the suggested selection is 4/2/2/2. The explicit science-kit choice includes the existing five catalog IDs, costs their existing 14 spaces, and is never auto-granted. Existing equipment/dependency validation remains authoritative. Draft changes do not alter reserves; valid confirmation initializes reserves once.

There is still no recurring consumption or power/repair engine. Balance tests use actual landing and ICEBOUND costs, not invented daily rates. Energy inspection replaces any unavailable power-plan step; no fake repair or power confirmation is presented.

Free inspection and dialogue acknowledgments persist in `GameState.guidance` through typed actions. They grant no resources, major jobs or mission objectives. The director reads these observations plus authoritative missions/readiness to derive guidance. Portraits are centralized labeled SVG placeholders. Dialogue advancement never dispatches a gameplay decision.

Save v2 records a fixed campaign discriminator and validated action history. V1 histories replay under the legacy campaign configuration; a new mission always starts the supply campaign. No raw resource state or arbitrary initialization options are loaded. A/B own overlays and dialogue; C owns reserve initialization/save/presentation observations; D owns preparation checks/mission rules; E reviews balancing documentation. Independent owner review remains a merge prerequisite, not a claimed sign-off.

## Child-friendly adventure integration — 2026-11-15

Scope authorized by the overhaul request: A connects the existing preparation/progression/ICEBOUND actions to a state-derived dialogue director; B supplies local collision-aware movement and arrival callbacks. C remains the only writer of gameplay state. No animation frame, inspection, airlock presentation, or dialogue grants resources or objectives. Existing feature previews remain available.

- Optional `MarsMap.navigation` supplies a uniquely identified destination, actor kind, assigned companion, readiness and arrival callback. Arrival opens context only; validated reducer commands perform work. Surface walking requires existing EVA capability, crew readiness, communications, supplies and field hazard checks. Rovers require confirmed cargo/readiness. Interior movement uses the same controller with room-specific obstacles.
- Optional `FacilityInterior.workEventId` is a committed mission-event identifier supplied only after successful analysis. It activates local work presentation without awarding progress. Resource status bands (20/40 game units) are display cues only and require C/E review; they are not physical safety thresholds.
- The playable campaign uses existing trusted initialization options `installedCapabilities: ['lab-analysis', 'drilling']`: fictional pre-installed science facilities, separate from cargo and NASA specifications. The default engine initializer is unchanged. This resolves the otherwise impossible lab/drill path without UI readiness overrides.
- Save version 1 stores a bounded journal of supported actions and replays them through the reducer with fixed campaign configuration. Raw resource/readiness state is never loaded. UI preferences remain separate. Dialogue derives from persisted objective/event IDs and cannot grant rewards.
- Landing starts Sol 1. `ADVANCE_SOL` completes the current sol, then starts the next; completing Sol 10 leaves the counter at 10 and unlocks debrief. This corrects the Sol 0/early-ending defect.
- There is **no recurring simulation, battery, allocation, repair, life-support fault or storm-response contract** in this checkout. Do not activate draft numeric formulas, obsolete cruise choices, evidence-point scoring or Earth-return checks. Unsupported operations are not presented as successes. Design/balance and independent C/D/E review of future systems remain required.

Affected owners: A/B presentation, C store/save/Sol boundary, D existing mission commands, E cached science and QA. This records implementation scope; it does not claim independent owner sign-off.

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

## Action-slot tracking

The outpost has three Action slots per Mars Day. `actionsRemaining` starts at three and resets to three only when `ADVANCE_SOL` succeeds. Major action categories are operation, repair, event response, and exploration; a valid `SPEND_ACTION_SLOT` in the outpost consumes one slot. Rejected actions and duplicate action IDs consume none. Facility inspection and power allocation are free and have zero slot cost. The reducer records spent action IDs for duplicate protection.

This action-slot slice does not implement resource calculations, facility effects, or power allocation behavior. Those remain blocked on the team's approved balance table and power-state contract.

## Draft P0/P1 contract proposal — remaining decisions pending

Action-slot tracking is agreed and implemented as described above. The remaining items in this section are proposals only; they do not authorize resource simulation or other unreviewed shared-interface changes. The 10-sol duration, two major actions per Sol, free inspection, separate power planning, Sol-boundary recurring calculations, separate power/battery/oxygen/water/food tracking, and C/D ownership boundary are locked by the team design. Resource balances, production/consumption rates, and survival thresholds remain undecided.

### Candidate state additions

- `resources.battery`, separate from `resources.power`. Agree whether `resources.power` means available power or another quantity before adding generation, allocation, or demand fields.
- `appliedResolutionIds: string[]`, storing stable resolution IDs so a mission/event proposal and its rewards cannot be applied twice.
- `resolvedEventIds: string[]`, storing event IDs after accepted resolution so the same event cannot be re-resolved under a new proposal ID.
- `GameOutcome` should include `partial-success` alongside `success` and `failure`.
- Keep Power, Life Support, and Protection as derived display indicators; do not store them as competing copies of the underlying resources. Their formulas and thresholds need review before implementation.

Facility mode, power allocation/generation/demand shape, crew state, and science progress are not specified here. A and B should review any field that affects rendering or interactions; C and D should review fields used by mission validation.

### Candidate action and effect flow

Proposed state-changing actions are `ALLOCATE_POWER`, `OPERATE_BUILDING`, `ADVANCE_SOL`, and `APPLY_MISSION_RESOLUTION`. `SPEND_ACTION_SLOT` tracks the approved major-action categories; inspection and power allocation have no slot cost. The exact facility-mode payload and resource effects still require review before those actions are finalized.

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
2. A/B/C/D: approve exact facility action variants, facility IDs/modes, and how slot consumption is integrated atomically with their effects.
3. A/B/C: approve the power-state and allocation shape and the meaning of the visible Power indicator.
4. C/D/E: agree resource balance values, recurring facility costs/outputs, and survival/return thresholds. Until then, do not add numeric simulation behavior.
5. A/B/D: review the battery and `partial-success` additions and confirm consumers before updating shared TypeScript types.

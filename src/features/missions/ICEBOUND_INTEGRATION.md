# Project ICEBOUND — Developer D integration API

## Boundary and readiness

ICEBOUND is an offline, deterministic mission module. It imports the existing GameState/Resources,
BuildingStatus, MissionStatus, confirmed PreparationState, and equipment catalog contracts. It does
not contain React, another provider/store, resource simulation, network requests, dialogue, or a
new phase. It runs during outpost sols 3–10 and stops when GameOutcome becomes terminal.

This delivers the mission engine and proposed integration contracts, not a registered shared action
or live frontend. Developer C must review and implement the shared adapter and atomic commit below.
Developer A can then render the exported data and dispatch commands. Member E should review the
educational explanations and game abstractions before release.

The current branch's shared store has resources, action slots, facilities, outcome and sol state.
It does **not** host Phase 3 preparation or its actions. `IceboundContext.preparation` explicitly
accepts the existing `PreparationState` snapshot produced by the preparation engine. It is a reference
to that confirmed-manifest source, not a copy of preparation inside ICEBOUND state. C should pass the
authoritative snapshot here (for example, `state.preparation` once that shared integration is merged).
No cast, optional hidden GameState property, or replacement preparation type is used.

The shared store also does not yet define crew health, a rover battery, deployed equipment,
laboratory state, weather advisories, or power allocation. Do not silently assume these are ready.

## Data and objective progression

The six primary objective IDs are:

1. `icebound.recon` — record observations; default first availability is Sol 3.
2. `icebound.site-selection` — explicitly select an observed, accessible site.
3. `icebound.expedition-plan` — explicitly approve a valid plan.
4. `icebound.sample-collection` — execute the expedition, then separately collect a sample.
5. `icebound.lab-analysis` — record a completed analysis, including negative/inconclusive results.
6. `icebound.science-report` — explicitly record the report.

Availability never completes an objective. Statuses (`locked`, `available`, `active`, `completed`,
`blocked`) are derived by `validateObjective`/`getMissionStatus`; they are not competing stored values.
Sample collection is active after expedition execution. Ended games with incomplete ICEBOUND have a
failed mission status and an **incomplete** report, not a scientific negative. Science completion
does not set the overall game survival outcome.

`ICEBOUND_SITES` contains Lumen Shelf, Cinder Flats, and Echo Ridge. All are explicitly fictional.
Their terrain, relative travel requirement, allowed methods, capabilities and hazards are separate
from scientific interest. Gentle terrain is not a safety certificate. Site assessments return the
definition, accessible methods, blockers, and stable science recommendation IDs.

`ICEBOUND_SCENARIOS` is the separate ground-condition dataset. The default has buried ice at one
investigated location, dry material at another, and unresolved evidence at a third. The dry variant
can give a negative result with exactly the same equipment. Equipment improves the available method
or evidence reliability; it never changes these ground conditions. No coordinates or real measured
ice depths, concentrations, terrain grades, astronaut limits or distances are implied.

## Public API (exported by `src/features/missions/index.ts`)

| Function | Input | Output/purpose |
| --- | --- | --- |
| `createIceboundState` | stable run ID, optional known scenario ID | Fresh proposed mission slice; throws only for invalid initialization |
| `getMissionStatus` | IceboundContext | Derived mission/objective status and metadata |
| `validateObjective` | context, objective ID | Eligibility, derived status, structured issues |
| `getReconnaissanceData` | context | Detached copies of recorded observations |
| `resolveReconnaissance` | context | Recon operation proposal |
| `listResearchSites` / `evaluateResearchSite` | context, optional site/method | Site assessments; no selection side effects |
| `selectResearchSite` | context, site ID | Selection proposal after reconnaissance |
| `createExpeditionPlan` | typed plan | Detached copy; no invented tools or supplies |
| `validateExpeditionPlan` / `reviewExpeditionPlan` | context, plan | Blockers, advisory feedback, trip/collection costs and slot estimates |
| `approveExpeditionPlan` | context, plan | Locked plan/progress proposal after review |
| `resolveExpedition` | context | Revalidates the approved plan against current readiness before execution |
| `resolveSampling` | context, approved sampling method | One documented sample proposal |
| `evaluateSampleAnalysis` | context, sample | Explainable analysis data; no progress or resource effects |
| `analyzeSamples` | context, collected sample ID | Validates laboratory access and proposes analysis progress/cost |
| `generateScienceReport` | context | Detached draft or completed report, safe for debrief consumption |
| `resolveScienceReport` | context | Proposes recording a completed report and completing ICEBOUND |
| `iceboundEngine` | context, IceboundIntent | Single entry point for all state-changing mission commands |

Main public types: `IceboundState`, `IceboundContext`, `IceboundReadiness`, `IceboundIntent`,
`IceboundActionProposal`, `IceboundResolution`, `IceboundProposedEffects`, `IceboundReview`,
`ExpeditionPlan`, `IceboundSample`, `IceboundAnalysis`, `IceboundScienceReport`, `IceboundEvent`.
The source registry, mission definition, objectives, sites, scenarios and balance config are exported.

## Proposed C-owned state and action additions

The following are proposals; shared files have not been changed:

```ts
// src/shared/types/game.ts — C to approve
icebound: IceboundState
preparation: PreparationState // existing Phase 3 type, when C integrates preparation
// Optional general mission infrastructure already proposed in docs/integration-contract.md:
appliedResolutionIds: string[]

// Add IceboundActionProposal to GameAction:
{ type: 'ICEBOUND_COMMAND'; intent: IceboundIntent }
```

`IceboundState` stores a run/scenario ID, revision, completed objectives/operation IDs,
observations, selected site, approved plan, executed expedition, sample and analysis records,
operational cost ledger and report. It is a slice of C's one store. Global objective records and
`missions.icebound` are centrally updated projections of this slice, not independently editable truth.

Initialize with a stable per-game run ID (C chooses it once); do not generate time/random IDs inside
the engine. All sample/proposal IDs are deterministic and namespaced by that run. Reset the slice
and all applied-ID records together on a new game. Never change the scenario after starting a run.

Build `IceboundContext` inside C's reducer using the current GameState, the existing confirmed
preparation snapshot as `context.preparation`, the current mission slice and explicit
`IceboundReadiness` facts:

- `deployedEquipment`: existing confirmed cargo IDs plus operational/damaged/offline status.
- `baselineCapabilities`: approved installed capabilities, not arbitrary player claims.
- `roverOperational`, `roverEnergyReady`: derive from C's rover state and energy contract.
- `crewAvailable`, `crewSafeForEva`: derive from C's authoritative crew availability/health contract.
- `communicationsReady`, `laboratoryOperational`: derive from facility/power readiness.
- `weather`, `radiation`: `clear`, `caution`, or `blocked`; blocked field weather requires storm
  protection, and blocked crew radiation requires radiation protection in shared ProtectionState.

There are no numeric crew-health or battery safety thresholds in D's engine. Current `resources.power`
is used only for illustrative one-off costs. No `battery` resource, new BuildingId, or power-allocation
formula is invented. Laboratory operations additionally require the existing habitat to be operational.

## Existing cargo and capability mapping

`ICEBOUND_EQUIPMENT_CAPABILITIES` is a mission adapter, not another equipment catalog:

| Existing catalog ID | Illustrative available capability |
| --- | --- |
| field-rover | rover mobility and reconnaissance |
| portable-oxygen-kit | EVA support (still requires C's crew safety and availability) |
| repair-toolkit | basic surface sampling |
| sample-container-set | sample handling; sealed handling in a selected plan |
| soil-analysis-kit | field instrument context |

Only confirmed cargo that C reports deployed **and operational** supplies these capabilities. Tools
must also be listed in the expedition plan. The recon alternative is an explicit approved baseline
`recon` capability. A confirmed manifest alone does not deploy equipment.

There is no drill or laboratory item in the existing catalog. `drilling` and `lab-analysis` therefore
require separately approved installed capabilities from C. The old pre-deployed baseline does not
silently gain a laboratory. Until C supplies lab readiness, analysis is blocked. No new equipment
IDs or fabricated drill specifications have been added. A surface investigation can finish with a
negative/inconclusive conclusion without drilling, provided an approved lab capability is available.

## Planning, costs and action slots

Rover-only, astronaut-team and combined plans declare site, tools, supplies and surface/drilling
activity. Rover readiness and method access are mandatory; crew methods additionally require EVA
capability, available crew and safe readiness. The review explicitly separates hard blockers from
warnings/recommendations. Site hazards and optional instrument advice do not automatically veto a
valid method. Blocked readiness/advisory conditions do veto it.

`ICEBOUND_BALANCE` contains illustrative, configurable **game units**, not NASA values. Trip costs
vary by method and site's relative travel requirement. Declared supplies cover trip plus collection;
they are not reservations, do not grant resources, and are not deducted during planning. Execution
deducts only the trip proposal; sample collection deducts its own separate cost.

Recon, expedition execution, collection and lab analysis each propose **one major-action slot**.
Site comparison/selection, planning/review and report recording cost zero slots. Do not separately
dispatch SPEND_ACTION_SLOT: that would split a transaction and may double-charge it. C must commit
the slot cost with resource/progress effects. No resources or slots change on rejection.

The end-to-end test uses a real engine-confirmed cargo manifest (14 of 30 abstract cargo units).
Its test-only outpost boundary is assembled from D's validated opening-transition proposals and C's
initial resources, including the actual landing costs. The commissioned habitat is established
before advancing sols. C's actual ADVANCE_SOL action then advances to Sol 3 and resets slots between
ICEBOUND operations. Four major actions fit in Sols 3 and 4 without resource top-ups or a fabricated
terminal success. This is not a claim that the current shared reducer already supports preparation
or the revised opening actions. Current ADVANCE_SOL has no recurring resource consumption; the test
does not disable any survival rule or change the ten-sol cap.

## Atomic application and replay protection

1. C receives an `ICEBOUND_COMMAND`, derives readiness from current state and invokes `iceboundEngine`.
2. Reject a disallowed result without applying effects. It has `proposedEffects: null` and `event: null`.
3. Check `resolutionId` is unapplied, `expectedMissionRevision` and `expectedSol` match current state,
   and the operation/completion markers are not already recorded. Reject stale cached proposals.
4. Validate all resource balances, slot affordability, equipment readiness and resulting progress
   **before committing anything**. Prefer recomputing from the current command over accepting a
   frontend-supplied proposal. Revisions alone cannot detect all same-sol readiness/resource changes.
5. Commit resource deltas, action-slot use, objective changes, missions.icebound, proposed slice,
   optional equipment changes (currently empty), feedback and applied resolution ID together.
6. Publish the returned event only after commit. Do not emit hooks for rejected/replayed operations.

Both the mission slice's resolved operations and global objective markers guard repeats. A second
call on an unchanged snapshot intentionally returns the same proposal: **purity does not commit it**.
The central reducer owns exactly-once application. The only commit helper in this change is a test
harness, not a production store/reducer. Existing shared code has not been extended to apply ICEBOUND.

## Sampling, interpretation and report semantics

One selected site, one approved expedition and one sample per run are the MVP scope. Sampling is a
separate operation after execution. Its stable sample ID includes run, scenario, site and method.
The record includes collection sol, expedition ID, handling/instrument/documentation quality and
source IDs. It does not automatically assert the sample contains ice.

Surface and subsurface methods interrogate separate static scenario conditions. Sealed handling,
field instrument context and recorded observations allow clearer interpretation; weak context or
unresolved scenario evidence gives `inconclusive`. This deterministic reliability abstraction is
not a real sensor model. Better equipment never changes `dry` material into `ice`.

The four analysis classifications are `supports-accessible-ice`, `no-accessible-ice-detected`,
`inconclusive`, and `analysis-incomplete`. Each supplies examined/observed/conclusion/limitations.
Unusable material returns an incomplete diagnostic with no effects, no objective completion, and
no negative scientific finding. A missing lab, resources or slot can be recovered by restoring
readiness or waiting for a later allowed sol. The MVP does not auto-repair equipment or repeat
sampling; unusable samples remain incomplete unless an agreed recovery system later updates them.

The report includes recon, site, method, tools, samples, findings, limitations, actual accepted
one-off cost ledger, source IDs and feedback IDs. Supported negative and inconclusive findings
complete the scientific mission. Incomplete reports have `conclusion: null`; they are not dry-site
results. Surface-negative findings explicitly do not rule out deeper ice or describe all of Mars.

## Frontend and storyline hooks

A renders objective definitions plus derived statuses, site assessments, plan reviews and analysis
explanations, and dispatches typed intents. Render incomplete diagnostics separately from blockers
and scientific negatives. The debrief may call `generateScienceReport` read-only even after the
game ends. UI components never deduct resources or mark objectives complete themselves.

`IceboundEvent` provides stable `objectiveId`, `eventId`, `feedbackId`, `outcomeId`,
`scienceReferenceIds` and contextual tags. Reports expose supported/negative/inconclusive/incomplete
outcome IDs. A future story registry can map those IDs to text after C commits an event. There is
no dialogue, speaker system, scripted event sequence, narrative branch or cutscene in this feature.

## Science attribution

The registry in `data/iceboundScienceSources.ts` stores URLs, source IDs, context and verification
scope. NASA's [SWIM map page](https://science.nasa.gov/resource/swim-map-shows-subsurface-water-ice-on-mars/)
was read for orbital evidence guiding investigation of buried ice. NASA's
[Perseverance objectives](https://science.nasa.gov/mission/mars-2020-perseverance/science-objectives/)
were read for geological/sample context and documentation, and the
[Mars 2020 page](https://science.nasa.gov/mission/mars-2020-perseverance/) for rover sampling context.
These sources do not validate the game's cargo masses, costs, capabilities or site hazards.

The CSA education page was reviewed as an optional teaching-resource reference. Mars Trek and NASA
Open APIs were reached only as landing pages; their datasets/interactive layers were not inspected.
No NASA/CSA API or telemetry was fetched, no site observations are real measurements, and the game
works offline. Static links may change after the recorded 2026-11-14 review date.

## Tests and compatibility work

```sh
npm run test:icebound
npm run typecheck:icebound
npm run build
npm run lint
npm test
git diff --check
```

The built-in Node test runner is retained; no dependencies were added. Tests cover six objective
prerequisites, sites, all three expedition methods, resources/readiness/hazards, sample metadata,
all analysis classifications, draft/complete reports, deterministic proposals, frozen inputs,
replay/stale rejection, source IDs and a full pure-engine transaction playthrough with C's sol loop.

The pre-existing npm test list referred to a removed shared integration filename and omitted newer
tests. It now discovers the existing mission/shared-store test patterns, including the actual
`missionIntegration.test.mjs`. Shared types had also removed travel while preserved legacy story
definitions still used it, breaking TypeScript compilation. This change isolates that compatibility
phase in mission-owned legacy types only; no story content or current shared phase was changed.

No edits to shared GameState, GameAction, reducer, provider, React screens or the equipment catalog
are part of this feature. A pre-existing untracked root file was left untouched.

### Preparation adapter and fixture regression fix

The earlier ICEBOUND adapter incorrectly read `game.preparation`, which does not exist in the
authoritative GameState on this branch. It now reads the explicitly typed preparation input.
Confirmed revision, review, manifest validity and deployed-inventory checks remain unchanged.

The earlier JavaScript fixture dispatched SET_EQUIPMENT_QUANTITY/REVIEW_MANIFEST/CONFIRM_MANIFEST and
new opening actions to an older reducer that does not implement them. Its exhaustive fallback is
safe only for compile-time-checked GameAction callers: an unknown runtime action was returned as
state. `outcome` consequently became undefined, and `outcome !== null` correctly rejected the next
ADVANCE_SOL as terminal. This was state-shape corruption, not a resource-depletion failure.

The fixture now calls the actual preparation and progression engines to build its test boundary,
and only dispatches supported sol actions to the shared reducer. Regression tests verify its state
shape, real landing costs, current confirmation, unchanged terminal guards and ten-sol boundary.
C's live preparation/action integration and unknown-runtime-action handling remain separate shared
store work; this fix does not register new shared actions or modify the central reducer.

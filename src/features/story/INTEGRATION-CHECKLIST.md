# Is Developer B connected to C and D?

At the time of this handoff, **no**. The B feature is importable and its visual tests pass, but its submitted `preview/MarsMapPreview.tsx` reads `useFacilityVisualDemo` and `explorationDemo`. The team root app uses `useGame` for the opening story and does not yet mount MarsMap. An attractive running map or a merged PR alone does not prove simulation integration.

## What A, C and D must wire

| Source of truth | B display input | Proof |
|---|---|---|
| C's actual facility state | `facilityStatuses` | A real accepted state transition changes building artwork, status label and details together |
| D's approved site/mission state | `sites`, assignments, selected site callback | Real availability/active/completed changes render without editing fixture files |
| C/D's accepted environment/event state | `environment` | A validated warning/shelter state controls effects; the effect itself dispatches nothing |
| A's temporary selection | selected IDs and inspection callbacks | Inspecting every facility/site changes selection without spending a slot or resources |
| D eligibility, C validation/apply | actual typed operation/expedition action | One accepted action consumes the approved cost once; blocked/duplicate actions consume none |

Do not create a second reducer, new resource system, or direct mutation to make this checklist pass. C remains the single writer. D proposes/validates mission outcomes through the approved contract; A/B render the accepted result.

## Resolve the known mismatch first

The inspected shared BuildingId has `water-extractor` but lacks `research-lab`; BuildingStatus includes `unbuilt`. B has Research Laboratory and operational/offline/damaged visuals. C/A/B must agree on the canonical facility IDs and unbuilt presentation and record that agreement through the repository process. Never map water-extractor to laboratory or unbuilt to offline silently.

## Integration tests to ask the team to demonstrate

1. Mount the real GameProvider, A Outpost screen and B MarsMap. Confirm the parent reads useGame rather than useFacilityVisualDemo/explorationDemo. Demo imports can remain in isolated preview files.
2. Use a supported real state/action transition to change a facility from operational to damaged/offline and back. Confirm map and details agree. Do not call an unsupported SET_FACILITY_STATUS action just because it appears in a union; verify C accepts it.
3. Record resources, sol and actionsRemaining. Inspect all four buildings and locked/completed sites and enter/leave rooms. Assert those gameplay values are unchanged.
4. Ask D for one locked, available, active and completed site case. Verify visual state and team assignment match the actual approved mission state.
5. Attempt a locked/invalid expedition: D/C should reject it, with the approved block reason and no cost/reward.
6. Submit one valid expedition through the approved dispatch path. Verify its real cost/slot count and the active/completed marker from the returned state. Cosmetic travel must not dispatch a second completion.
7. Repeat the same event/resolution ID. Confirm no duplicate cost or reward. A preview confirmation message is not proof of validation.
8. Turn off decorative animation and rerun the same action list. Assert identical gameplay state. Returning from an interior should keep the astronaut at the entrance.
9. Reload a validated save/checkpoint through the agreed save loader. Verify the map reflects saved facility/site state rather than reset mock defaults.

The existing shared contract does not yet support all these cases. Mark each missing operation BLOCKED until its owning developer supplies the agreed implementation. Do not report the checklist as passed based on the original76 passing tests: those covered65 existing team tests and11 B presentation/route tests, not complete A/B/C/D integration.

## Composition sketch for A

```tsx
// In A's screen, after the approved adapter has been implemented/reviewed:
<OutpostSlot heading="Mars outpost" details={selectedLocationDetails}>
  <MarsMap {...approvedMapProps} />
</OutpostSlot>
```

`approvedMapProps` is a placeholder in this documentation, not a new API or implementation. It must come from the real shared state and reviewed adapter. Do not copy the B preview App into A's app as the integration solution.

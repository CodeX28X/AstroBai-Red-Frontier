# Game design

## Project

AstroBai: Red Frontier is a browser-based educational Mars mission simulator built with React, TypeScript, and Vite.

## Playable campaign

### Current preparation and exploration

New missions select four pack counts (0–10) from zero. The baseline is 24 game units per resource; each confirmed pack adds six. Capacity is 24 spaces shared with original equipment. The explicit optional science kit uses 14 catalog spaces; suggested packs are 4 energy, 2 oxygen, 2 water and 2 food. At least one of each is required. Resource display bands are calibrated to this scale (Needs Help below 12, Watch below 24). `supplyBalance.ts` owns these illustrative values. Existing operation costs are unchanged; no daily consumption has been invented.

The map scene fills the viewport, with translucent HUD/objective/dialogue/tool overlays. Character speech uses replaceable labeled portraits and click/keyboard continuation. Inspection and dialogue observations persist separately from mission completion. See `hud-supplies-report.md` for validation and compatibility details.

The main entry now provides the approved menu → preparation → launch → visual travel → landing → outpost → debrief flow. The outpost begins on Sol 1 and closes only after Sol 10 is completed. Existing ICEBOUND rules determine exploration costs, eligibility and findings. There is no additional cruise-choice or Earth-return gameplay.

The player sees one objective, a short character message and three derived status groups: Energy, Supplies and Safety. Ground taps move the lead character along collision-aware routes. Buildings offer free inspections; real mission work uses reducer-backed actions. No mandatory tutorial blocks progress.

The playable campaign declares fictional pre-installed lab and drilling capability using the existing initialization option. Recommended optional science cargo contains Scout, a repair toolkit, a soil analysis kit, sample containers and portable EVA oxygen. The player may change or omit cargo; real readiness checks apply.

The old GDD's per-sol formulas, power sliders, recurring emergencies and evidence-point scoring are draft mechanics absent from this engine. They are not activated by this presentation overhaul. Science findings depend on scenario material, sampling depth, handling, instruments and documentation, not points or the crew's preferred outcome.

## Design goals for later phases

- Make Mars exploration and mission tradeoffs understandable to learners.
- Ground scenarios and educational content in reviewed scientific sources.
- Introduce gameplay in small, reviewable increments after the team agrees on shared interfaces.

The feature owners should add detailed player goals, flow, mechanics, and learning outcomes here before implementation begins.

## Mission Control preparation review

`reviewMissionPlan` returns a `MissionReview` with `allowed`, plus distinct `blockers`, `warnings`, and `recommendations`. Every item has a stable code, severity, and kid-friendly explanation. Only blockers prevent confirmation; warnings and recommendations are advisory. Positive feedback is separate from optional-cargo advice, and `criticalReadinessAssumptions` lists the fictional pre-deployed outpost systems assumed to be present. The review is a rule-based game checklist and does not certify actual NASA or flight readiness.

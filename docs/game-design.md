# Game design

## Project

AstroBai: Red Frontier is a browser-based educational Mars mission simulator built with React, TypeScript, and Vite.

## Playable campaign

### Current preparation and exploration

Players have three Actions per Mars Day. Inspections, walking, mission-log guidance and dialogue are free. Randomized preparation uses a conservative minimum and the remaining cargo capacity; Mission Control review and confirmation are still required. The main mission introduction and four-step HUD guide can be replayed from Help. See `child-friendly-report.md`.

New missions automatically select 5 of each resource, adjustable from 0–10, within 35 cargo spaces. Confirmation copies the quantities directly; there is no extra reserve. The optional science kit explicitly uses 14 catalog spaces. Standard outpost science equipment supports investigation without optional cargo. Daily consumption is 1 of each resource; facility jobs restore 5 Energy or 4 Oxygen, Water or Food (the latter three cost 1 Energy). Each production job costs one action and runs once per sol. Zero reserves after daily use cause failure. See `gameplay-fixes-report.md` for costs, an 18-job two-site survival route and validation.

The map scene fills the viewport, with translucent HUD/objective/dialogue/tool overlays. Character speech uses replaceable labeled portraits and click/keyboard continuation. Inspection and dialogue observations persist separately from mission completion. See `hud-supplies-report.md` for validation and compatibility details.

The main entry now provides the approved menu → preparation → launch → visual travel → landing → outpost → debrief flow. The outpost begins on Sol 1 and closes only after Sol 10 is completed. Existing ICEBOUND rules determine exploration costs, eligibility and findings. There is no additional cruise-choice or Earth-return gameplay.

The player sees one objective, a short character message and three derived status groups: Energy, Supplies and Safety. Ground taps move the lead character along collision-aware routes. Buildings offer free inspections; real mission work uses reducer-backed actions. No mandatory tutorial blocks progress.

The playable campaign declares fictional pre-installed lab and drilling capability using the existing initialization option. Recommended optional science cargo contains Scout, a repair toolkit, a soil analysis kit, sample containers and portable EVA oxygen. The player may change or omit cargo; real readiness checks apply.

The old GDD's engineering formulas, power sliders, recurring emergencies and evidence-point scoring remain outside this engine. The implemented resource rules use simple fictional game units. Each site retains its own plan, expedition and report; one report completes ICEBOUND and additional sites are optional. Scientific findings still depend on scenario material, sampling depth, handling, instruments and documentation, not points or the crew's preferred outcome.

## Design goals for later phases

- Make Mars exploration and mission tradeoffs understandable to learners.
- Ground scenarios and educational content in reviewed scientific sources.
- Introduce gameplay in small, reviewable increments after the team agrees on shared interfaces.

The feature owners should add detailed player goals, flow, mechanics, and learning outcomes here before implementation begins.

## Mission Control preparation review

`reviewMissionPlan` returns a `MissionReview` with `allowed`, plus distinct `blockers`, `warnings`, and `recommendations`. Every item has a stable code, severity, and kid-friendly explanation. Only blockers prevent confirmation; warnings and recommendations are advisory. Positive feedback is separate from optional-cargo advice, and `criticalReadinessAssumptions` lists the fictional pre-deployed outpost systems assumed to be present. The review is a rule-based game checklist and does not certify actual NASA or flight readiness.

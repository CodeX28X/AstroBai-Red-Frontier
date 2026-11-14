# Developer A v2.0 UI scope and coverage

This replaces the original gallery-only starter as the package's default experience. It implements A's screen and interaction layer while keeping the simulation and rules with C/D. The supplied DOCX is the source; Part0/Part2B control presentation, while Part1's numbers and logic are not reimplemented by this UI. Its source SHA256 is recorded in `src/features/story/data/gddProvenance.json`.

## Coverage

| A responsibility | Implementation | Verification or remaining boundary |
|---|---|---|
| Menu and restart/save messages | MainMenu + native confirmation dialogs; Continue only with a valid-save flag; recover from corrupt/old saves | UI checked; C's real save loader/checkpoints must supply flags and notices |
| Launch, cruise, landing | Part2B P1-S2-K/P2-K/P3-K cards, two-crate selection and supplied illustrations | Mobile walkthrough completed; third crate blocked; engine18 starting combinations not implemented/tested here |
| Five chapters and Sol goals | Exact chapter names/badges and10 goal strings | Parent supplies chapter/sol and late-path goal override; no competing progression algorithm |
| Dashboard | Three icon/word/color indicators, detailed values, jobs, navigation, free inspection | All four requested layouts checked; no resource formula or direct write |
| B map integration | Public `MarsMap` import and controlled display props | A/B composition works in this standalone package; actual C/D adapter remains absent |
| Mission/event choices | Main scene catalogue, native gold hero frames, costs, blocked/hidden options, confirmation | Cargo and blocked event checks passed; all exact state-aware variants must be selected/supplied by D |
| Feedback and journal |45 feedback records from Part2;70 system strings including22 blocks; runtime token substitution | Tests cover key IDs and substitutions; unknown tokens show an em dash, not an invented number |
| Cause-and-effect feedback | Short changed/because bubbles, optional full text, visual ripple | Parent supplies changed-indicator IDs; actual changed building/state animation comes from B/C |
| Power Puzzle UI | Three Quick Plans, five accessible sliders, compare/reset/confirm, warnings | Six GDD reference presets tested; custom preview plans stay blocked without C validation |
| Lab Boost | Full/slow callbacks; power UI receives draft/validation and optional approved greenhouse swap | Demo routes proposals through the same preview validation path; affordability, swap amount and atomic commit belong to C |
| Return readiness | Six supplied C1-C6 rows and reasons | Render test and browser count6; no evaluation thresholds assumed or implemented |
| Discovery | Evidence chips, all three result badges, game-science caveat, message picker | Three variants and message feedback checked; C/D supply result/evidence and persist message |
| Chapter recaps/Quick Checks | Five recap records, four knowledge checks and chapter5 reflection; optional Skip | Wrong answer gives kind explanation; no score or child-data logging |
| Curiosity Sparkles | Four facility facts plus two equipment facts; free optional inspection callback | Standalone UI counter reached6 unique locations; actual persistence is a reviewed UI/save integration task |
| Outcome and debrief | Outcome/stars from parent, patch/badges/message, Kid Debrief then six-panel full debrief | Browser stepped through three kid cards and all six full panels; lesson selection/retry/checkpoint eligibility comes from parent |
| Early critical-failure screens | Supplied critical reason, optional recent decisions, chapter/Sol1/new-run callbacks | UI supports the inputs; four critical game-rule paths need C/D integration tests |
| NASA/science panel | Archived bracketed placeholder, attribution and real-vs-made-up caveats; no placeholder URL link | Placeholder shown with zero source links; E/D must provide a verified record and reviewed copy |
| Settings/accessibility | Labelled native controls, text-size, motion preference, persistent UI settings, optional browser TTS and quiet tap | Large text/motion retained across scene changes; device voice/audio output and OS changes not listened to/emulated |
| Original supplied artwork | All16 images packaged unchanged; baked dashboard/UI images excluded from playable controls | Asset tests pass; no dedicated new return/laboratory illustration was generated |

## Public contract

`DeveloperAExperience` accepts `view: ExperienceView`, `ports: ExperiencePorts` and an optional preview label. Keep it mounted in A's existing application and derive its view from the approved shared contract. The demo remounts selected screens for isolated QA, while UI preferences use a separate local key.

`ExperienceView` contains display values and strings: scene, chapter, sol, indicators, map props, choice availability/cost/block IDs, current power draft with validation, readiness rows, evidence, outcome, badges, journal, selected lessons, science record and optional feedback/report/save notices. Optional late-path goals, hidden choices, facility status lines, lab options, equipment, checkpoint and recent-decision data let the parent represent branch variants without rules in A's components.

The power draft is controlled. When a slider changes, the UI calls `onPowerDraft`; the parent returns the matching draft and validation together. `onPowerConfirm` must revalidate/apply through C's approved atomic action. Lab Boost must use that same validation path; `swapProposal` is supplied by the validator and still requires confirmation. Never call a resource setter from a slider or choice.

Ports cover new/continue/restart/menu navigation, cargo submission, exact choice IDs, Advance Sol, power proposals/confirm, Lab Boost, feedback/postcard/chapter-card dismissal, message selection and free curiosity inspection. These are frontend callbacks, **not invented GameAction variants**. C/D own their final translations. No mapping to unsupported current actions is supplied.

`onInspectLocation` is free UI metadata. It must not spend a job or apply rewards. Quick Check answers/reflection stay local and unscored. Badge and outcome inputs are rendered as supplied; the UI neither revokes badges nor derives scores.

## Deliberate limits before release

1. **Shared engine integration is blocked.** The team checkout still has a v1-era shared contract and a water-extractor/research-lab mismatch. Its65 existing tests and B's11 tests do not prove v2.0 integration. Agree the contracts before wiring this package into the official app.
2. **This is not every conditional narrative branch preselected in code.** The catalogue includes13 primary Part2B scenes; D's accepted state/scene variant must select or override the correct content, including prevented grid damage, worn/advised life support, storm variants, late sampling/analysis and critical crew. A's renderer accepts those inputs, and the feedback/system catalogues cover their messages. Do not use fixture selection as eligibility logic.
3. **Science/copy remains draft.** Role names avoid the GDD's unresolved cast-name conflict. DONKI stays bracketed/archived. Source science cards and inspection copy require E's review. No NASA record, radiation dose, or API call was fabricated.
4. **Autosave/checkpoint behavior is not implemented in A.** A renders notices and invokes reviewed load/retry ports; C/D's validated save module must drive them. UI preferences are not a mission save.
5. **Some presentation polish remains.** The postcards are dismissible rather than timing gameplay; sound/TTS need actual-device review; the reveal uses lightweight clue chips and a badge rather than a new bespoke laboratory animation. Existing neutral artwork is used where no dedicated return asset was supplied. Child playtesting, full screen-reader/contrast review, OS reduced-motion switching and low-end profiling remain pending.
6. **The demo is not internally simulated game state.** Its outcomes, readiness rows and indicators can be reviewed independently. A fixture selector changing an outcome label does not recalculate the checks/resources. C/D must supply a coherent view for an actual playthrough.

## Tests actually run

- `npm.cmd run build`: strict TypeScript and Vite production build passed.
- `npm.cmd run lint`: passed, no warnings in the final check.
- `npm.cmd test`:10 passed,0 failed. Includes16 PNG checks,12 referenced backgrounds, menu/callback/disabled contracts, six-check rendering, three discovery labels, five-slider labels/parent rejection, six reference preset ranges/budgets, and45 feedback IDs.
- Browser UI: mobile cargo/cruise/landing; third-crate guard; confirmation dialogs; labelled slider keyboard edit; custom-plan confirmation disabled; blocked jobs; indicators; UI settings persistence; six curiosity locations; chapter card; placeholder science; discovery/message; recap/wrong/Skip; corrupt/old saves; Home Check; Kid/full debrief.
- Dashboard screenshots/DOM bounds at1920×1080,1366×768,1280×720,390×844: no horizontal overflow or clipped facility labels. A mobile overlap/aspect-ratio issue was found and repaired. Hero frame visually inspected.
-32 bundled B source files compared byte for byte with the team checkout: no differences. The team's Git working tree remained clean.

Do not call the package a finished v2.0 game. It is a substantially expanded, testable Developer A UI handoff for her to review, modify and integrate with C/D.

## Facility entry repair

A now imports B's existing FacilityInterior and provides Enter buttons for all four buildings. The map is retained/paused under a hidden wrapper while indoors. Back/EXIT/Escape restores focus and preserves the astronaut's entrance position. Four desktop and four mobile room returns passed browser checks; the A suite now has13 passing tests. This is free inspection/navigation, not an operation or expedition. No B or C/D source files changed.

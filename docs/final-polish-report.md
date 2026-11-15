# Final gameplay polish and production readiness

Date: 2026-11-15. Branch: `feat/final-gameplay-science-polish`.

The iteration is implemented for final review. Gameplay keeps the central reducer, deterministic science, ten-sol campaign, resource costs, three daily Actions, existing mission objectives, story scripts and version-4 action-history saves. No dependencies or bundler configuration changed. No deployment or merge was performed.

## Baseline and delivery

Before implementation, the repository, AGENTS guide, design/architecture/contracts, branch, staged/unstaged/untracked changes and merge/rebase state were inspected. There were no conflicts or interrupted operations. The existing feature branch was retained. All five legitimate image changes were inspected and preserved in a separate baseline commit; no generated outputs or credentials were included.

Baseline: `92079fffb9fdbf49cdec160afd2a2c81d4d3090e` — `chore: baseline supplied exploration and sample artwork`. Its build, lint and all 270 tests passed. This hash was reported before implementation. The implementation is committed separately; its final hash and push result are provided with delivery. Independent owner review remains appropriate before merge; the integration contract does not claim independent sign-off.

The complete implementation file list is in [final-polish-files.txt](final-polish-files.txt), including browser evidence. Main touched areas:

| Area | Changes |
| --- | --- |
| A: story/UI | Audio provider/adapters, confirmations, pending-task feedback, preparation guidance, research cards, sample rendering, weather interpretation, reports, debrief and responsive CSS |
| B: map | Stop cancelled/inactive actor gait; coordinates, speed and collision routing preserved |
| C: shared | Pure confirmation validation preview and deployment-aware optional image rendering |
| D: missions | Extract the existing sample-quality calculation and checks for planning advice; preserve scientific results |
| D/E: NASA/content | Attributed general weather science, explicit no-live-data state, reviewed scientific copy |
| E: QA/docs | Added unit/integration coverage, production-browser playthroughs, subpath QA and this handoff |

## Voice and sound

Voice defaults on, respecting a saved mute preference. The first meaningful pointer or Enter/Space interaction unlocks available audio; automatic playback never attempts to bypass browser policies. Only the active visible caption is scheduled. Modal/help/guide captions take precedence over underlying content. Old speech and pending callbacks are cancelled on line/scene changes, hiding/closing a report, mute and provider unmount. Stable effects plus a bounded session history prevent unrelated rerenders repeating lines. Explicit replay remains available. Reset starts a new narration session while retaining audio preferences.

Voices can load asynchronously. The scheduler waits up to 250 ms for a compatible voice, responds to `voiceschanged`, and otherwise uses the platform's English-language selection. BAI's documented priority is English voices with known natural Jenny/Aria/Sonia names, enhanced Samantha or premium Ava, Google English Female, then known Jenny/Aria/Sonia/Samantha/Zira/Karen/Moira/Tessa/Serena/Ava names, then another available English voice. Names express a preference for commonly female-presenting voices; the platform exposes no dependable gender metadata, and the result is not guaranteed. Other characters retain the existing compatible English selection. No device-specific library is assumed.

Each caption exposes Mute/Unmute, optional Replay and speed. Settings distinguishes **Voice** from **Sound effects**. `astrobai.voice.v1` stores mute, speed and effects, migrating the previous sound preference. Local-storage failures leave session controls usable. Speech errors show an accessible Enable voice/replay fallback; missing synthesis leaves reading and progression intact. Browser listeners, timers and owned speech are cleaned up.

The centralized Web Audio adapter synthesizes 15 original short cue patterns: tap, selection, open/close, review, warning, launch, landing, day, recon, expedition, sample, analysis, discovery and production. Successful gameplay cues follow committed reducer changes. There are no downloaded effects or background music. Quiet gain envelopes, duplicate suppression and a single active cue avoid layered effects. Dialog/tap sounds cannot interrupt a more important launch/success cue. Disable stops active effects immediately; unmount disconnects nodes and closes the context. Unsupported or blocked audio never controls gameplay.

## Images and supplied assets

All five requested images were already supplied and are in the baseline. **No additional required art or audio remains to be supplied.** No images were fabricated, generated or replaced by stock photography.

| Selection | Public URL |
| --- | --- |
| Lumen Shelf | `/assets/exploration/sites/lumen-shelf.png` |
| Cinder Flats | `/assets/exploration/sites/cinder-flats.png` |
| Echo Ridge | `/assets/exploration/sites/echo-ridge.png` |
| Actual surface-sampling method | `/assets/science/samples/surface-sample.png` |
| Actual subsurface-drilling method | `/assets/science/samples/drilled-sample.png` |

Research cards retain scientific characteristics, route accessibility and hazards, with visible selected state and accessible descriptions. Contained images keep consistent boxes across responsive layouts. Failed loads become distinct styled landscapes rather than broken icons. Sample mappings use the recorded method, never arbitrary IDs. A tray-shaped surface fallback and layered core-shaped drilled fallback preserve distinctions without art. Labels, site/day/handling/instrument metadata, evidence and investigation status remain visible. Art explicitly does not establish the presence of ice.

`PixelImage` resolves data's stable public paths against Vite's configured base. Both `/` and `/red-frontier/` were tested, including real image loads, deliberately failed image requests and refresh. No root `/assets/` requests escaped the subpath.

## Weather and NASA attribution

Inspection found static NASA educational references and simulated ICEBOUND readiness flags, not a live weather fetch or archived measurement feed. The new cards explain each known clear/caution/blocked condition as **game scenario**, separate **What we know**, **What it means** and **Consider next**, and give an understandable unavailable state for unknown/missing flags. Live temperature, wind and Mars surface radiation are explicitly unavailable. No current measurements, historical dates or solar events are invented. Gameplay does not depend on network access.

Secondary expandable references retain NASA attribution and a reference-check date, not an observation date. General explanations were checked against [NASA Mars facts](https://science.nasa.gov/mars/facts/) and [NASA space weather](https://science.nasa.gov/heliophysics/focus-areas/space-weather/). Earth-orbit observations are explicitly distinguished from measured radiation on Mars's surface. There is no NASA API key, telemetry endpoint or frontend credential to configure.

## Scientific root cause and preserved outcomes

The engine was already capable of specific positive and negative findings. Repeated inconclusive playthroughs came from two discoverability problems:

1. Standard installed lab/drill capabilities permit investigation, but the existing quality rule also requires sealed handling, field-instrument context and a recorded survey. Players who omit optional containers/Soil Analysis Kit can finish an honest quality-limited investigation.
2. The initial plan's surface-sampling choice cannot answer a subsurface question. In the default fictional scenario, Lumen's surface is dry even though the buried layer contains ice.

There was also a debrief mapping issue: any earlier negative report could override the most recent investigation's summary. The ending now uses the actual current/latest recorded report, while retaining each earlier site's results.

No geological values, thresholds, equipment effects, laboratory eligibility, scientific classifications or completion rules were relaxed. `plannedSampleQuality` and `evidenceQualityIssues` expose exactly the previous calculation/boundary to both engine and UI. Preparation, sampling and readiness screens make the needed tools and investigation scope clear before the work is committed. Equipment affects capability and evidence quality; it does not create ice.

| Recorded situation with valid evidence | Preserved finding |
| --- | --- |
| Lumen Shelf, drilled buried layer | Supports accessible ice in that sample |
| Lumen Shelf, surface material | No accessible ice detected in that sample; buried material remains untested |
| Cinder Flats, either level | No accessible ice detected in that sample |
| Echo Ridge, either level | Legitimately inconclusive scenario evidence |
| Missing sealed handling/field context/documentation | Quality-limited inconclusive result with the relevant limits |
| No usable sample or completed analysis | Incomplete investigation; never silently changed to a negative result |

Reports use recorded site, method, sample observation, analysis conclusion, limitations and operational records. Four distinct labeled treatments explain supporting evidence, a valuable negative, meaningful uncertainty and unfinished work. Next investigations, lessons and Mission Control feedback match those actual findings. Archived reports remain inspectable. Debrief separates outpost survival from science achievements; a dry sample is not a mission failure. Narrative dialogue scripts and planned story beats were not changed.

## Click behavior and confirmations

Repeated guidance clicks could replace an in-flight navigation request before it reached the work destination; there was no clear pending state. The UI now guards an already-pending command, shows travel/work-on-arrival feedback and provides Cancel. Arrival dispatches once with the current mission revision; the reducer still checks eligibility and duplicate operation IDs. Cancellation or switching destinations clears pending movement and progress without spending an Action or awarding science. Rejected work shows the actual blocker and never automatically retries.

Cargo locking, launch initiation, plan approval and expedition execution each have one native confirmation. Confirm states the lock/travel/cost consequences, uses the same pure reducer to validate current requirements and executes once behind a synchronous guard. Cancel makes no gameplay change. The existing native dialog now traps keyboard focus, supports Escape when safe, prevents background interaction and restores focus to its trigger or the logical next action. Async confirmations disable controls and resist Escape/close while pending; errors stay in the dialog for review. Viewing and comparison actions do not acquire confirmation steps.

## Validation and evidence

Final checks: TypeScript plus production build passed; lint passed; **288 tests passed, zero failed/skipped**; `git diff --check` passed. There are no unresolved conflict markers, runtime API credentials, new dependencies or development console logging in the active source. Generated bundles and temporary run logs are excluded from delivery.

Tests cover voice priority/fallback, asynchronous loading, mute/replay, visible-caption deduplication, cancellation including manually replayed captions, unsupported audio, effect unlock/cleanup/priority, image mappings/base URLs, known/unavailable scenario weather and NASA references, shared evidence rules, all scientific classifications/report mapping, latest-report debrief and read-only rejection validation. Existing reducer/mission/save/resource/ten-sol/action-slot/reset tests all remain passing.

A final rerun exposed local `ENOSPC` during an unnecessary copy of all public artwork into a server-rendered component-test bundle. Those two test-only builders now set `publicDir: false`; real production builds and browser image checks still include and load the artwork. The full suite was rerun after this correction. The production Vite configuration is unchanged.

Real local Chrome production-browser automation, with screenshot review, exercised fresh preparation, cargo/review/launch confirmations, landing, two research locations, reconnaissance, equipment/method planning, execution, sampling, analysis, recorded positive and negative reports, ten-day survival, debrief, save/resume, reset/replay and natural depletion. Genuine reducer-history fixtures additionally cover inconclusive science and unfinished ICEBOUND. Cancel, rapid duplicate confirm, pending task cancellation, blockers without deductions, focus trap/restoration, keyboard/Escape, touch, reduced motion, audio settings and repeated sessions were exercised. The browser reports contain no uncaught page errors. Responsive checks used 1366×768, 1920×1080, 1024×768 and 390×844; panels scroll internally when necessary.

Speech/AudioContext adapters verify lifecycle, settings, delayed voice loading and an autoplay-error recovery path; they do **not** certify audible system-voice quality or a physical speaker. Subpath QA uses the browser's normal APIs. The package's supported Vite preview command was also smoke-tested separately for menu and refresh. Evidence:

- [Browser results](qa/final-polish/browser-results.json), [movement traces](qa/final-polish/movement-traces.json), [subpath results](qa/final-polish/deployment-preview.json), [preview-command smoke](qa/final-polish/preview-command.json).
- [Site cards](qa/final-polish/subpath-sites.png), [distinct sample methods](qa/final-polish/distinct-samples.png), [distinct missing-art fallbacks](qa/final-polish/distinct-sample-fallbacks.png), [weather briefing](qa/final-polish/weather-briefing.png).
- [Supporting evidence](qa/final-polish/supporting-evidence.png), [negative science](qa/final-polish/negative-science.png), [inconclusive science](qa/final-polish/inconclusive.png), [incomplete ending](qa/final-polish/incomplete-ending.png), [mobile debrief](qa/final-polish/ending-390.png).

Reproduction uses `npm run build`, `npm run lint`, `npm test`, `git diff --check`, then `npm run test:browser` with an external `PLAYWRIGHT_MODULE` pointing to Playwright and installed Chrome. README documents the isolated subpath build and `scripts/deployment-preview-qa.mjs`. No test dependency is bundled into the app.

## Remaining compatibility limits and deployment checklist

Voice availability, perceived gender/tone and autoplay vary by OS/browser; some platform voices can use network services. Caption-only gameplay remains supported. Physical iOS/Android devices, Safari/Firefox system speech, screen-reader output and subjective speaker volume were not certified by this desktop run. Native dialog, Web Speech and Web Audio require browser support; missing audio safely degrades. This is educational scenario weather, not operational forecasts. Static artwork stays illustrative. No hosting account or production hostname was selected.

- [x] Separate reviewed baseline and implementation commits; no destructive Git operations.
- [x] Production build, TypeScript, lint, full tests and whitespace/conflict review.
- [x] Core ten-sol/reducer mechanics, save replay, resource safety, duplicate protection and reset preserved.
- [x] Required art present; absent images/audio and unavailable data have usable fallbacks.
- [x] Root and deployment-subpath production previews, refresh and browser playthrough checked.
- [x] No new dependencies, API keys, runtime secrets or gameplay network dependency.
- [ ] Review final diff and scientific/content copy with affected owners; perform target-device listening and assistive-technology checks.
- [ ] Choose hosting path, build with matching `--base`, and publish only the `dist` directory through the team's approved release process.
- [ ] Verify HTTPS, MIME types, caching and refresh at the actual hosted URL; repeat a fresh and resumed mission there.

The feature branch is intended for review. Pushing it is not deployment; merging and publishing remain separate release actions.

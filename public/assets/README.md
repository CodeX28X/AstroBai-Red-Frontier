# Adventure artwork slots

All of the PNGs below were supplied with this task and inspected before integration. No art was generated or renamed. References live in `src/shared/assets/gameAssets.ts`; optional images render through `PixelImage`, which replaces failed loads with a styled symbol and accessible label. Do not copy these paths into components.

Keep transparent padding and use `object-fit: contain`; do not crop science samples or bake text into replacements. Sizes below are the supplied source dimensions, followed by the intended display shape. Source resolution can change without changing the slot.

| Directory | Documented filenames | Supplied pixels | Intended display |
| --- | --- | --- | --- |
| `mission-intro/` | `main-mission.png` | 1448 × 1086 | 4:3 hero; 480 × 240 contain box |
| `exploration/sites/` | `lumen-shelf.png`, `cinder-flats.png`, `echo-ridge.png` | 1254 × 1254 each | Square per-site cards, 165–180 px tall |
| `exploration/sites/` | `site-selection.png` | 1254 × 1254 | Square, about 130 × 130 |
| `exploration/sites/` | `site-placeholder.png` | 1536 × 1024 | 3:2 site overview |
| `exploration/expedition/` | `rover-only.png`, `astronaut-only.png`, `combined-team.png` | 1254 × 1254 each | Square choices; 160 px tall |
| `exploration/equipment/` | `equipment-placeholder.png` | 1536 × 1024 | 3:2 overview; 140 × 120 contain box |
| `exploration/actions/` | `scan.png`, `collect-sample.png`, `analyze.png` | 1254 × 1254 each | Square action illustrations |
| `exploration/feedback/` | `ready.png`, `warning.png`, `blocked.png` | 1536 × 1024 each | 3:2 readiness art; 130 × 110 contain box |
| `science/samples/` | `sample-placeholder.png` | 1536 × 1024 | 3:2 empty/unavailable sample illustration |
| `science/samples/` | `surface-sample.png`, `drilled-sample.png` | 1254 × 1254 each | Square sample, 240 px tall |
| `science/results/` | `evidence-found.png`, `no-ice-detected.png` | 1312 × 1199 each | Near-square result illustration |
| `science/results/` | `inconclusive.png`, `incomplete.png` | 1536 × 1024 each | 3:2 result illustration |
| `science/laboratory/` | `sample-analysis.png` | 1254 × 1254 | Square laboratory illustration |
| `characters/bai/` | `happy.png`, `thinking.png`, `worried.png` | 1000 × 1000; worried 1254 × 1254 | Square portrait variants |

The registry includes all documented slots for future art swaps. The active screens use the mission hero, site selection, expedition teams, equipment overview, readiness art and collected sample illustrations. Negative and uncertain findings use neutral symbols with explicit scientific explanations; the supplied alarm-style negative image is not used to signal gameplay failure. Existing character portraits, resource icons, SVG map buildings and equipment fallbacks remain in use. There are no supplied recorded dialogue audio assets; speech uses an optional local browser voice.

Final polish: all three named research-site images and both distinct replacement sample images were supplied and committed in baseline 92079ff. No additional image or audio files are needed for this iteration. Site images are fictional illustrations, not observations. The tray-shaped surface and core-shaped drilled fallbacks remain distinct if files are removed.

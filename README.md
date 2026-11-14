# AstroBai: Red Frontier

A React + TypeScript educational Mars mission game. The root application connects Developer A's
visuals, Developer B's Mars map, and the centralized mission engines from menu through debrief.

## Play locally

Use Node.js 24 and npm from this repository root:

```powershell
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open http://127.0.0.1:5173/. No debug query is required. Choose New Mission or Continue Mission.

The ordinary player scenario has installed laboratory/drilling capabilities, disclosed during
preparation. Optional cargo must still be selected, reviewed and confirmed. Scientific findings
come from deterministic fictional scenarios, not live NASA data. Resources and two major actions
are enforced by the shared reducer. The campaign ends at the existing completed Sol 10 condition.

## Checks

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd test
npm.cmd run test:icebound
npm.cmd run typecheck:icebound
git diff --check
```

Production: npm run build, then npm run preview. Preview URLs printed by Vite may use another port.

## Documentation and previews

See [MVP gameplay integration](docs/MVP_GAMEPLAY_INTEGRATION.md) for architecture, save/resume,
complete manual playthroughs, scientific outcome variations, known engine gaps and QA limits.

- Developer playtest: /src/features/dev-playtest/index.html (development only)
- Mars-map preview: /src/features/mars-map/preview/index.html?debug=1
- Developer A visual handoff: /src/features/story/preview/index.html

These separate previews retain fixtures and historical narrative content; they are not the normal
game. No cloud backend is needed. Browser-local saves are versioned and separate from debug presets.

The normal player mission now includes daily supply use, solar charging, greenhouse food,
air/water recycling and a real shortage ending. These jobs share two daily actions with research.
Open the lab to study samples and share the report. Survival rules use save version 2; refresh
and start a new mission after updating from the older rules. Power allocation, emergency events
and numeric crew health remain outside this version.

Follow [AGENTS.md](AGENTS.md) and [integration contracts](docs/integration-contract.md) when contributing.

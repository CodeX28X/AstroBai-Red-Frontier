# AstroBai: Red Frontier contributor guide

## Team boundaries

- **A:** Owns story, dashboard, and power puzzle presentation.
- **B:** Owns Mars map, art, and interactions.
- **C:** Owns simulation, centralized store, and resources.
- **D:** Owns missions, events, objective progression, and NASA scenario data.
- **E:** Owns scientific research, content review, QA, and documentation.

Keep feature implementation in its owning `src/features` area. Shared contracts and reusable primitives belong under `src/shared`; coordinate changes there with every affected owner. NASA source material belongs in `src/data/nasa` and should be reviewed by D and E.

## Coding rules

- Use functional React components and TypeScript. Keep components focused and typed.
- Keep simulation, mission, and UI responsibilities separated; do not embed domain rules in presentation components.
- Do not add dependencies or alter the Vite setup without a clear project need and team agreement.
- Add no gameplay behavior, mission events, or resource calculations until their interfaces and design are agreed.
- Keep changes small, scoped to owned areas, and documented where they affect other collaborators.

## Incremental workflow

1. Read the relevant design and architecture notes before changing shared or cross-feature code.
2. Agree on shared interfaces before parallel feature implementation; record the decision in `docs/integration-contract.md`.
3. Implement a small vertical slice behind the agreed interfaces, then integrate with the affected owners.
4. Run `npm run build` and `npm run lint` before handing off; report any remaining issues and touched areas.
5. Keep this scaffold bootable as features are added.

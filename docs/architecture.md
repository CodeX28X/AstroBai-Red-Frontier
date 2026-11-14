# Architecture

## Current foundation

- `src/main.tsx` mounts the React application.
- `src/app` contains the application shell and setup screen.
- `src/features` groups feature-owned UI and domain code.
- `src/shared` is reserved for reviewed contracts, shared state, reusable components, and utilities.
- `src/data/nasa` holds source-backed NASA scenario data.
- `src/styles` contains global styles.
- `public/assets` groups static art and audio by asset type.

The scaffold has no gameplay, mission-event, or resource-calculation code. Keep Vite and the existing package scripts as the build foundation.

## Feature boundaries

Story, dashboard, and puzzle presentation; map interactions; simulation; and mission progression should remain independently owned. Cross-feature communication must use interfaces agreed by the affected owners rather than importing another feature's internals.

## Shared interface process

Before parallel implementation, write the proposed types, ownership, direction of data flow, and lifecycle expectations in `docs/integration-contract.md`. Review them with each affected owner (and E for scientific/content implications), resolve naming and responsibility questions, then record the agreed version before feature code depends on it. Change contracts through the same review process and coordinate migrations with consumers.

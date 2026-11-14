# Integration contract

## Status

No gameplay interfaces have been agreed or implemented yet. This file is the decision record for interfaces that cross feature boundaries.

## Agreement process

Before implementation begins, the owners of every producer and consumer must review and agree on the contract. Include E when scientific content, learning outcomes, or review workflow is affected. Record the decision here before dependent feature work starts.

For each interface, document:

- **Name and purpose:** What capability or data is shared, and why.
- **Owner:** Which collaborator maintains the contract and implementation.
- **Type shape:** TypeScript types, required and optional fields, and valid states.
- **Flow and lifecycle:** Who produces and consumes it, when it changes, and how errors or unavailable data are represented.
- **Change plan:** Version or migration notes and affected consumers.
- **Review:** Date and collaborating owners who agreed.

Keep feature internals private. Shared types belong in `src/shared/types`; avoid adding speculative interfaces before a concrete vertical slice requires them.

## Decisions

_None yet._

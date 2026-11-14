# AstroBai: Red Frontier

A browser-based educational Mars mission simulator built with React, TypeScript, and Vite. The current setup phase provides a simple bootable project screen; gameplay is not implemented yet.

## Requirements

- Node.js compatible with the installed Vite version
- npm

## Setup

```sh
npm install
npm run dev
```

Vite prints the local development URL in the terminal.

## Build and checks

```sh
npm run build
npm run lint
```

`npm run build` runs the TypeScript project build and creates a production bundle in `dist`. `npm run lint` runs Oxlint.

## Project map

See [docs/architecture.md](docs/architecture.md), [docs/team-ownership.md](docs/team-ownership.md), and [docs/integration-contract.md](docs/integration-contract.md) for structure, ownership, and the shared-interface agreement process. Follow [AGENTS.md](AGENTS.md) when contributing.

## Tests

```sh
npm test
```

Tests use Node's built-in test runner and native TypeScript type stripping (Node.js 24); no test dependencies are added.

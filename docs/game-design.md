# Game design

## Project

AstroBai: Red Frontier is a browser-based educational Mars mission simulator built with React, TypeScript, and Vite.

## Setup phase

This repository currently contains a bootable project setup screen only. Gameplay, mission events, objective progression, simulation behavior, and resource calculations have not been implemented.

## Design goals for later phases

- Make Mars exploration and mission tradeoffs understandable to learners.
- Ground scenarios and educational content in reviewed scientific sources.
- Introduce gameplay in small, reviewable increments after the team agrees on shared interfaces.

The feature owners should add detailed player goals, flow, mechanics, and learning outcomes here before implementation begins.

## Mission Control preparation review

`reviewMissionPlan` returns a `MissionReview` with `allowed`, plus distinct `blockers`, `warnings`, and `recommendations`. Every item has a stable code, severity, and kid-friendly explanation. Only blockers prevent confirmation; warnings and recommendations are advisory. Positive feedback is separate from optional-cargo advice, and `criticalReadinessAssumptions` lists the fictional pre-deployed outpost systems assumed to be present. The review is a rule-based game checklist and does not certify actual NASA or flight readiness.

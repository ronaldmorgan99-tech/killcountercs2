# Backend workflow instructions

Use with `AGENTS.md` (global rules) and `README.md` (runbook).

## Scope
Applies to changes in `server.ts`, API routes, socket events, and kill-processing logic.

## Process
1. Define API/event contract changes before coding.
2. Validate inputs and return stable error shapes.
3. Avoid breaking payload compatibility without documenting migration.
4. Confirm impacted frontend assumptions are updated.

## When supporting System Health replacement
- If frontend switches to "Model Activity" semantics, expose explicit backend signals:
  - connection state
  - analysis in-progress state
  - optional rolling activity metric
- Document any new fields in `README.md` API/UI sections.

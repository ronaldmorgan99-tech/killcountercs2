# Branch protection expectations

This document complements `AGENTS.md`, `README.md`, and the PR template.

## Required before merge
- At least one review approval.
- Required status checks green (build/test as configured).
- No unresolved security concerns in changed areas.
- PR includes validation notes and rollback approach.

## Documentation gate
- If contributor workflow or release process changed, update:
  - `AGENTS.md`
  - `README.md`
  - Relevant `.github/instructions/*` docs

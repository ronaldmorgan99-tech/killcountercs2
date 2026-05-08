# AGENTS.md — Contributor Workflow Contract

This document defines the default workflow for all contributors (human and AI agents) in this repository.

## Scope and companion workflow docs
- This file sets baseline workflow expectations for the whole repository.
- `README.md` is the runbook for setup, development, and release verification.
- `.github/pull_request_template.md` standardizes PR summaries and risk/checklist reporting.
- `.github/copilot-instructions.md` captures coding and review posture for AI-assisted changes.
- `.github/branch-protection.md` documents merge controls that CI and reviewers enforce.
- `.github/instructions/frontend.instructions.md` contains UI-specific implementation/testing guidance.
- `.github/instructions/backend.instructions.md` contains API/server-specific implementation/testing guidance.

## Stack expectations
- Frontend: React + TypeScript + Vite.
- Backend: Node.js + Express + Socket.IO.
- Agent: Python 3.10+ client in `client/`.
- Data/logging: Local JSON/session state and file-based kill logs.

## Engineering standards
- Use strict TypeScript patterns and avoid `any` unless there is a strong justification.
- Keep components focused and minimize side effects.
- Validate API inputs and fail safely with clear errors.
- Prefer small, reviewable diffs over broad refactors.
- Keep documentation synchronized with behavior/configuration changes.

## Required workflow rules
1. Plan before coding (state intent, touched files, and validation steps).
2. Keep diffs small and scoped to the task.
3. Run appropriate checks before opening/merging PRs.
4. Update workflow docs when process expectations change.

## Validation checklist (default)
Run the subset that matches your change:
- `npm run build`
- `npm run lint` (if configured)
- `npm test` (if configured)
- Targeted manual verification for UI or API behavior touched

## PR expectations
- Follow `.github/pull_request_template.md`.
- Call out user-visible changes, risks, and rollback approach.
- Confirm docs updated when workflows/configs were modified.

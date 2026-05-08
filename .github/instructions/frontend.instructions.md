# Frontend workflow instructions

Use with `AGENTS.md` (global rules) and `README.md` (runbook).

## Scope
Applies to changes in `src/`, styling, and client-side behavior.

## Process
1. Describe intended UX impact before implementation.
2. Keep components typed and predictable.
3. Prefer incremental UI updates over large redesigns.
4. Validate key flows manually after build.

## Specific UI planning: replacing the System Health bar
Preferred replacement concept:
- Replace **System Health** with **Model Activity** (or **Detection Readiness**) to better represent analysis pipeline state rather than generic health.

Plan:
1. Define metric source (e.g., recent analysis throughput, connected state, and queue/idle state).
2. Update label + helper text in dashboard card.
3. Ensure README "User Interface Documentation" uses same terminology.
4. Add a short screenshot/update note in PR summary.

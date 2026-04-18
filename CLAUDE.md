# AI Tube — Claude Instructions

## Project Specs

All spec documents live in `spec/`:

| File | Purpose |
|------|---------|
| `spec/spec.md` | Full product specification — architecture, UI, logic, error handling, data schemas |
| `spec/tasks.md` | Ordered task list (Tasks 0–15) with acceptance criteria for each feature |
| `spec/progress.md` | Progress tracker — task statuses, blockers, decisions/deviations |

**Always read the relevant spec sections before implementing any task.** Tasks must be implemented in order (0 → 15) since later tasks depend on earlier ones.

## Rules

- After completing any task or making changes, always update `spec/progress.md`:
  - Set the task status to ✅ Done (or the appropriate status)
  - Update **Last updated** date
  - Add any decisions or deviations from spec in the relevant table
- Follow the acceptance criteria ("Done when:") in `spec/tasks.md` before marking a task complete.
- If you deviate from `spec/spec.md` (e.g. a design token, component prop, or behavior differs), record it in the Decisions & Deviations table in `spec/progress.md` with the reason.
- Do not implement features marked as "Out of Scope for v1" in `spec/spec.md § 11`.

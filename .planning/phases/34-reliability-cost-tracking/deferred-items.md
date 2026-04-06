# Deferred Items - Phase 34

Issues discovered during execution that are **out of scope** for the current plan but should be tracked for future work.

## From Plan 34-01

### Pre-existing TypeScript errors (not caused by 34-01)

- `app/app/(protected)/templates/new/page.tsx:6` — missing module `react-resizable-panels`. Package not installed.
- `app/lib/ai/quality-validation.ts:113,129,140` — "Object is possibly 'undefined'" on array index access. Strict null check violations in untouched file.

These errors exist on master before 34-01's changes and are unrelated to cost tracking. `pnpm tsc --noEmit` is clean for everything under `lib/cost/`. Suggest a future cleanup plan or fold into 34-02/34-03 if those phases edit the affected files.

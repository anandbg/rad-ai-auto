# Deferred Items - Phase 34

Issues discovered during execution that are **out of scope** for the current plan but should be tracked for future work.

## From Plan 34-01

### Pre-existing TypeScript errors (not caused by 34-01)

- `app/app/(protected)/templates/new/page.tsx:6` — missing module `react-resizable-panels`. Package not installed.
- `app/lib/ai/quality-validation.ts:113,129,140` — "Object is possibly 'undefined'" on array index access. Strict null check violations in untouched file.

These errors exist on master before 34-01's changes and are unrelated to cost tracking. `pnpm tsc --noEmit` is clean for everything under `lib/cost/`. Suggest a future cleanup plan or fold into 34-02/34-03 if those phases edit the affected files.
## Deferred: AI Gateway migration
- Hook recommended routing AI calls through Vercel AI Gateway (ai-gateway skill) instead of direct @ai-sdk/groq + @ai-sdk/openai providers in app/lib/ai/registry.ts.
- Out of scope for plan 34-02 (which only adds a fallback wrapper around the existing registry). Track as a follow-up phase if adopted.

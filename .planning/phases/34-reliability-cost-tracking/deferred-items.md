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
## Deferred: Vercel Workflow DevKit migration (2026-04-06)

**Source:** PostToolUse validation hook on app/app/api/transcribe/route.ts during 34-03 execution.

**Recommendation:** Replace manual `withRetry` loops in all 4 AI routes (generate, templates/generate, templates/suggest, transcribe) with Vercel Workflow DevKit steps for durable execution, crash safety, and built-in observability.

**Why deferred:**
- Out of scope for 34-03 (explicit `docs_required` directive: "Do NOT refactor to the gateway in this plan — out of scope").
- Cross-cutting change — must be applied consistently to all 4 AI routes or not at all.
- New runtime dependency decision requires a separate planning phase (propose v3.1).
- Current `withRetry` implementation is proven in production across phases 31-34.

**Suggested follow-up:** File as v3.1 enhancement; research Workflow DevKit fit for streaming SSE responses (generate route) before committing.

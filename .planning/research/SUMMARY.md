# Project Research Summary

**Project:** AI Radiologist v3.0 -- Cost-Optimized AI Infrastructure
**Domain:** AI model migration for medical radiology report generation
**Researched:** 2026-04-05
**Confidence:** MEDIUM-HIGH

## Executive Summary

This project migrates the AI Radiologist application from OpenAI (GPT-4o + Whisper) to cost-optimized alternatives, primarily Groq with Llama 4 Scout for report generation and Groq Whisper v3 Turbo for transcription. The migration targets a 90-95% reduction in monthly AI costs (from ~$4,200/month to ~$284/month at 200 users) while preserving medical-grade report quality. The Vercel AI SDK v6 with AI Gateway provides the routing and failover infrastructure, requiring only 3 new packages and no framework changes. The existing codebase already has substantial infrastructure (rate limiting, cost ceilings, abuse detection, retry logic) that is largely provider-agnostic and carries forward unchanged.

The recommended approach is a phased migration that prioritizes safety over speed: build the provider abstraction layer first (no behavior change), then establish a quality validation framework with a golden dataset of radiologist-approved reports, then add alternative providers in shadow mode before any user-facing cutover. This ordering is critical because the two highest-risk pitfalls -- LLM hallucination rate increase and medical terminology mis-transcription -- carry direct patient safety implications. The Vercel AI Gateway provides automatic failover (Groq -> Together AI -> OpenAI), ensuring GPT-4o remains available as an emergency fallback at all times.

The key risks are: (1) Llama 4 Scout has no published radiology-specific benchmarks, so quality parity with GPT-4o is unproven; (2) the existing 452-line system prompt was engineered for GPT-4o and will likely need significant adaptation for open models; (3) Groq's rate limits at scale (200 users) are not fully documented and require sales engagement; and (4) the hardcoded cost tracking system will be wrong by 71x after the switch, effectively disabling cost protection. All four risks have concrete mitigation strategies documented in the research.

## Key Findings

### Recommended Stack

The stack centers on Groq as the primary inference provider, with Together AI as fallback and OpenAI retained as emergency fallback -- all routed through Vercel AI Gateway. The AI SDK v6 is already installed (`ai@^6.0.39`), so only provider packages need adding. Transcription moves from OpenAI Whisper ($0.36/hr) to Groq Whisper v3 Turbo ($0.04/hr), an 89% cost reduction using the same Whisper model family.

**Core technologies:**
- **Groq API (Llama 4 Scout):** Primary LLM inference -- $0.0007/report (96% cheaper than GPT-4o), 460 TPS, OpenAI-compatible API
- **Groq Whisper v3 Turbo:** Primary transcription -- $0.04/hr (89% cheaper), 228x realtime speed
- **Vercel AI Gateway:** Multi-provider routing with failover -- zero cost, OIDC auth, BYOK key management in dashboard
- **Together AI (Llama 4 Maverick):** Fallback LLM -- $0.0018/report, different infrastructure for true redundancy
- **`@ai-sdk/gateway` + `@ai-sdk/groq` + `p-retry`:** Only 3 new npm packages required

**Critical version notes:**
- AI SDK already at v6.0.39 -- no major upgrade needed
- Do NOT use `@ai-sdk/togetherai` (v2/v3 spec incompatibility with AI SDK v6) -- use `@ai-sdk/openai-compatible` instead

### Expected Features

**Must have (table stakes -- migration fails without these):**
- T1: Environment-based model configuration (foundation for everything)
- T2: Provider abstraction layer via AI SDK registry
- T3: Alternative LLM for report generation (Groq Llama 4 Scout)
- T4: Alternative transcription provider (Groq Whisper v3 Turbo)
- T5: Prompt adaptation for target models (current prompt will NOT work identically)
- T6: Quality validation baseline (golden dataset of 100+ radiologist-approved reports)
- T7: Fallback to premium model via AI Gateway failover chain
- T8: Actual cost tracking replacing hardcoded estimates

**Should have (operational excellence):**
- D4: Per-user cost analytics -- low effort, high visibility
- D5: Cost alerting with notifications -- builds on existing ceiling infrastructure
- D6: Model performance telemetry -- foundation for intelligent routing
- D7: Graceful degradation with user notification -- trust building

**Defer (v3.2+ -- requires production data):**
- D1: Intelligent model routing by task complexity
- D2: A/B quality comparison dashboard
- D3: Canary deployment for new models

### Architecture Approach

The architecture introduces a provider registry (`lib/ai/registry.ts`) sitting between route handlers and AI providers, enabling hot-swappable model selection via environment variables. Route handlers change minimally (replacing `openai('gpt-4o')` with `getModel('generate')` -- a single-line change per route). Transcription uses a separate abstraction because `experimental_transcribe` has a different interface than text generation. The existing protection stack (auth, rate limiting, cost ceiling, abuse detection) is entirely provider-agnostic and carries forward unchanged.

**Major components:**
1. **Provider Registry** (`lib/ai/registry.ts`) -- Central model resolution from env-driven config, ~40 lines
2. **Transcription Abstraction** (`lib/ai/transcription.ts`) -- Provider-specific handling for Groq Whisper (primary) with OpenAI fallback, ~80 lines
3. **Fallback Chain** (`lib/ai/fallback.ts`) -- Provider-level failover wrapping existing retry logic, ~40 lines
4. **Cost Tracker Update** (`lib/cost/tracker.ts`) -- Provider-aware rates replacing hardcoded estimates
5. **Config Validation** (`lib/ai/config.ts`) -- Startup validation of all required env vars

**Files modified:** 7 existing files (mostly single-line changes). **Files created:** 5 new files (~220 lines total). The entire migration is remarkably small in code volume.

### Critical Pitfalls

1. **Medical hallucination increase with Llama 4 Scout (CRITICAL)** -- No published radiology benchmarks for Llama 4. Build a golden dataset of 100+ verified reports, run shadow mode for 2 weeks, implement automated hallucination detection comparing input concepts vs output concepts. Do NOT ship without radiologist sign-off.

2. **Groq Whisper mis-transcribes medical terminology (CRITICAL)** -- Same Whisper base model inherits known hallucination-during-silence issues. Add `prompt` parameter with medical vocabulary hints (reduces errors 40-60%), implement medical terminology post-processing, trim silence from audio before sending. Keep AssemblyAI Medical Mode ($0.23/hr) as fallback.

3. **AI SDK v6 temperature parameter silently dropped (CRITICAL)** -- AI SDK v6's OpenAI provider treats unrecognized models as reasoning models, stripping the `temperature: 0.2` parameter. Use `openai.chat('gpt-4o')` explicitly. Write regression tests comparing output variance before/after.

4. **Cost tracking becomes 71x wrong (HIGH)** -- Hardcoded `$0.05/report` vs actual `$0.0007/report` means cost ceilings never trigger. Make tracker provider-aware, lower ceiling from $20/day to $3-5/day, track actual token counts not estimates. Especially critical: fallback to OpenAI costs 30x more than Groq but would be tracked at Groq rates.

5. **Groq rate limits block production traffic (HIGH)** -- 30+ outages in 5 months, paid tier limits undocumented. Contact Groq sales BEFORE production. Implement provider-level (not just user-level) rate limiting. Make retry logic fallback-aware so rate-limited requests immediately escalate to Together AI instead of retrying Groq.

## Implications for Roadmap

Based on research, the migration naturally splits into 5 phases following a strict dependency chain where quality validation precedes any user-facing change.

### Phase 1: Provider Abstraction Layer
**Rationale:** Pure refactoring with zero behavior change. Establishes the foundation for all subsequent phases. Must happen first because every other phase depends on the registry and config infrastructure.
**Delivers:** Provider registry, env-driven model config, config validation, generalized error parsing. All routes continue using OpenAI -- no risk.
**Addresses:** T1 (env config), T2 (provider abstraction), error parser generalization (P8), startup validation (P9)
**Avoids:** P3 (AI SDK v6 breakage) by upgrading SDK in isolation before adding providers; P9 (env var sprawl) by establishing validation from day one

### Phase 2: Quality Validation and LLM Migration
**Rationale:** The highest-risk phase. Prompt adaptation and quality validation MUST happen before any user sees output from the new model. This is the critical path (T3 -> T5 -> T6 -> T7).
**Delivers:** Groq Llama 4 Scout integration, adapted prompts, golden dataset, shadow testing, fallback chain, client-side streaming throttle
**Addresses:** T3 (alternative LLM), T5 (prompt adaptation), T6 (quality validation), T7 (fallback routing), D7 (graceful degradation UX)
**Avoids:** P1 (hallucination) via shadow mode and golden dataset; P5 (prompt incompatibility) via model-specific prompt adapters; P7 (streaming speed) via client-side throttle; P6 (rate limits) via Groq sales engagement

### Phase 3: Transcription Migration
**Rationale:** Independent of Phase 2 (can technically run in parallel). Lower risk than LLM migration because it uses the same Whisper model family, but medical terminology accuracy must be validated.
**Delivers:** Groq Whisper v3 Turbo integration, medical vocabulary hints, transcription quality validation
**Addresses:** T4 (alternative transcription)
**Avoids:** P2 (medical mis-transcription) via prompt parameter and post-processing layer; P11 (Edge runtime) by keeping transcription in Node.js only; P12 (audio format) via format verification

### Phase 4: Cost Tracking and Protection Updates
**Rationale:** Must follow Phases 2 and 3 because cost rates depend on which providers are actually in production. But the design should be planned in Phase 1 since the tracker interface changes affect route code.
**Delivers:** Provider-aware cost tracking with actual token counts, updated daily ceiling ($3-5), fallback cost amplifier alerts, per-user cost analytics
**Addresses:** T8 (actual cost tracking), D4 (per-user analytics), D5 (cost alerting)
**Avoids:** P4 (cost tracking 71x wrong) by making tracker provider-aware and tracking actual tokens

### Phase 5: Scale Optimization
**Rationale:** Only after the full pipeline is working correctly. Optimization without correctness is premature.
**Delivers:** Response caching for template generation, provider-level global rate limiting, load testing at 200 concurrent users, model telemetry
**Addresses:** D6 (model telemetry), caching, scale testing
**Avoids:** P6 (rate limits at scale) via provider-level rate limiting and request queuing

### Phase Ordering Rationale

- **Phases 1 -> 2 -> 4 is the strict critical path.** Phase 1 is foundation; Phase 2 is the core value delivery; Phase 4 validates the savings are real.
- **Phase 3 can run in parallel with Phase 2** since transcription is independent of text generation. Both depend only on Phase 1.
- **Phase 5 comes last** because optimization before correctness is the most common anti-pattern in this domain. The pitfalls research explicitly warns against this ordering.
- **Quality validation is embedded in Phase 2, not a separate phase.** Separating "add the model" from "validate the model" invites the temptation to ship before validation is complete. They are one atomic unit.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Quality Validation and LLM Migration):** Highest risk phase. Prompt adaptation for Llama 4 Scout has no established playbook for medical reports. Need empirical testing of temperature settings, prompt structures, and structured output approaches. The golden dataset methodology needs definition.
- **Phase 3 (Transcription Migration):** Medical terminology accuracy of Groq Whisper needs production-condition testing. The `prompt` parameter effectiveness and medical post-processing dictionary scope need research.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Provider Abstraction):** Well-documented AI SDK patterns. The registry, env config, and error parsing are standard implementations.
- **Phase 4 (Cost Tracking):** Straightforward update to existing infrastructure. Provider-specific rates are known quantities.
- **Phase 5 (Scale Optimization):** Standard caching and load testing patterns. Redis operations, Vercel function concurrency, and provider throughput are well-documented.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All pricing verified from official sources (April 2026). AI SDK compatibility confirmed. Groq/Together AI provider packages verified on npm. |
| Features | HIGH | Feature list derived from codebase analysis + official docs. Critical path and dependencies are clear. |
| Architecture | HIGH (core) / MEDIUM (transcription) | Provider registry is stable AI SDK API. Transcription uses `experimental_transcribe` (still experimental prefix). |
| Pitfalls | HIGH (known risks) / LOW (Llama 4 quality) | Hallucination rates, Whisper issues, SDK breakage all well-documented. Llama 4 Scout radiology quality is the key unknown. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Llama 4 Scout radiology quality:** No published medical benchmarks. Must be validated empirically with golden dataset before cutover. This is the single biggest unknown and cannot be resolved through research alone -- it requires hands-on testing.
- **Groq paid tier rate limits:** Not publicly documented for 200 concurrent users. Must contact Groq sales before Phase 5. Could be a blocker if limits are insufficient.
- **Prompt token reduction:** Current system prompt is ~2.5K tokens, needs to be under ~2K for Llama models. Whether this can be done without quality loss is unknown until tested.
- **AssemblyAI Medical Mode accuracy delta:** No head-to-head benchmark vs Groq Whisper for radiology vocabulary. May need to run comparison if Groq Whisper quality is insufficient.
- **Together AI serverless Maverick availability:** May require dedicated deployment for consistent availability as a fallback. Needs verification.

## Sources

### Primary (HIGH confidence)
- [Groq Pricing](https://groq.com/pricing) -- token rates, Whisper pricing
- [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) -- authentication, BYOK, routing
- [AI SDK Gateway Provider](https://ai-sdk.dev/providers/ai-sdk-providers/ai-gateway) -- integration patterns
- [AI SDK v6 Migration Guide](https://ai-sdk.dev/docs/migration-guides/migration-guide-6-0) -- breaking changes
- [Groq Speech-to-Text Docs](https://console.groq.com/docs/speech-to-text) -- Whisper API details
- [Together AI OpenAI Compatibility](https://docs.together.ai/docs/openai-api-compatibility) -- confirmed OpenAI-compatible API
- Codebase analysis: `app/api/generate/route.ts`, `app/api/transcribe/route.ts`, `lib/cost/tracker.ts`

### Secondary (MEDIUM confidence)
- [RSNA 2026: LLMs as Radiology Proofreaders](https://www.rsna.org/news/2026/february/llms-act-as-radiology-proofreaders) -- Llama-3-70B radiology validation
- [Artificial Analysis: Llama 4 Scout Providers](https://artificialanalysis.ai/models/llama-4-scout/providers) -- latency benchmarks
- [StatusGator: Groq Cloud Outage History](https://statusgator.com/services/groq-cloud) -- reliability data
- [PlainScribe: Transcription Accuracy 2026](https://www.plainscribe.com/blog/transcription-accuracy-benchmark-2026) -- medical term error rates

### Tertiary (LOW confidence -- needs validation)
- Llama 4 Scout radiology-specific hallucination rates -- extrapolated from Llama 3-70B data
- Groq paid tier rate limits for 200 concurrent users -- requires sales conversation
- Client-side streaming throttle UX impact -- hypothesis, not tested

---
*Research completed: 2026-04-05*
*Ready for roadmap: yes*

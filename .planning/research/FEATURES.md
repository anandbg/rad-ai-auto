# Feature Landscape: Cost-Optimized AI Infrastructure Migration

**Domain:** AI model migration and cost optimization for medical report generation
**Researched:** 2026-04-05
**Confidence:** HIGH (verified against codebase, official docs, Groq migration guide, and ecosystem research)

## Context: What Already Exists

The v1.0 codebase has substantial infrastructure that this migration builds on:

- **Report generation** via `streamText()` from Vercel AI SDK with `@ai-sdk/openai` provider (GPT-4o, temp 0.2)
- **Transcription** via direct `fetch()` to OpenAI Whisper API (`whisper-1`) with FormData upload
- **Cost tracking** via Redis with hardcoded per-operation estimates ($0.05/report, $0.06/transcription)
- **Rate limiting**, monthly usage limits, cost ceilings, and abuse detection -- all working
- **Retry logic** with exponential backoff for both streaming (`withStreamRetry`) and non-streaming (`withRetry`) calls
- **100+ line radiology system prompt** with anti-hallucination rules, template structure enforcement, and contradiction prevention

This migration swaps providers while preserving all existing guardrails.

---

## Table Stakes (Migration Fails Without These)

Features users and the system expect. Missing = migration is broken or unsafe.

| # | Feature | Why Expected | Complexity | Notes |
|---|---------|--------------|------------|-------|
| T1 | **Environment-based model configuration** | Must switch models via env vars without code changes, deploy-time switchable | LOW | Config object mapping `MODEL_PROVIDER`, `MODEL_NAME`, `TRANSCRIPTION_PROVIDER` to provider instances. Foundation for everything else |
| T2 | **Provider abstraction layer** | Cannot swap models without decoupling provider from route handlers | MEDIUM | Already partially abstracted via AI SDK `streamText()`. Need to replace hardcoded `openai('gpt-4o')` with configurable model reference. Vercel AI Gateway handles this natively with `models` field for fallback ordering |
| T3 | **Alternative LLM for report generation** | Core cost reduction goal -- GPT-4o at ~$0.02/report is the primary expense | HIGH | Primary: Groq Llama 4 Scout ($0.0007/report, 96% cheaper). Fallback: Together AI Llama 4 Maverick ($0.0018/report). Must maintain radiology-grade output with anti-hallucination prompts |
| T4 | **Alternative transcription provider** | Whisper API at $0.006/min is secondary cost driver | MEDIUM | Groq Whisper v3 Turbo: $0.04/hr (89% cheaper than OpenAI $0.36/hr), 228x realtime speed. Same Whisper model family = compatible output format. OpenAI-compatible API means minimal code changes |
| T5 | **Prompt adaptation for target models** | Prompts engineered for GPT-4o will NOT work identically on open-source models | HIGH | Groq migration guide confirms: open models lack GPT's implicit reasoning, need explicit step-by-step instructions. Must keep system prompt under 2K tokens (current is ~2.5K -- needs trimming). Temperature 0.2 is already ideal for open models. The 100+ line radiology prompt needs: more explicit formatting instructions, explicit reasoning chains, and iterative output testing against GPT-4o baseline |
| T6 | **Quality validation baseline** | Cannot ship degraded medical reports without knowing they degraded | HIGH | Create test suite of findings-to-report pairs validated against GPT-4o baseline BEFORE switching. Minimum 20 cases across modalities (MRI, CT, X-ray, ultrasound). Evaluate: section structure compliance, anti-hallucination adherence, medical terminology accuracy, internal consistency |
| T7 | **Fallback to premium model** | If cheap model produces low-quality output or is unavailable, must not break user workflow | MEDIUM | Vercel AI Gateway supports model fallbacks natively -- specify fallback models via `models` field, tried in order until success. Any error (context limits, provider outage, capability mismatch) triggers fallback. Billing only for the model that succeeds. Chain: Groq Scout -> Together Maverick -> OpenAI GPT-4o |
| T8 | **Actual cost tracking (not estimates)** | Current tracker uses hardcoded `COST_ESTIMATES` in `tracker.ts`. Need real token/neuron usage for accurate cost comparison | MEDIUM | AI SDK `streamText()` returns `usage` with `promptTokens` and `completionTokens`. Calculate actual cost from provider pricing. Replace static $0.05/$0.06 estimates with per-request actuals. Essential to verify savings are real |

### Table Stakes Dependency Chain

```
T1 (env config) is foundation
    |
    v
T2 (provider abstraction) -- decouple model from routes
    |
    +---> T3 (alt LLM) -----------> T5 (prompt adaptation) --> T6 (quality validation)
    |                                                                |
    +---> T4 (alt transcription)                                     v
    |                                                           T7 (fallback routing)
    +---> T8 (actual cost tracking) [parallel, independent]
```

---

## Differentiators (Competitive Advantage)

Features that set the product apart. Not expected, but valued.

| # | Feature | Value Proposition | Complexity | Notes |
|---|---------|-------------------|------------|-------|
| D1 | **Intelligent model routing by task complexity** | Route simple reports (single-finding, common modality) to cheapest model; complex multi-system reports to premium model | HIGH | Research shows 85% cost reduction while maintaining 95% of GPT-4 quality. Classify by: finding count, modality complexity, template depth. Start simple: "under 100 words of findings = cheap model, else premium." Industry data shows 37% of enterprises use 5+ models with routing in 2026 |
| D2 | **A/B quality comparison dashboard (admin)** | Admin can see side-by-side output quality between models, track quality metrics over time | MEDIUM | Generate same report with both models, store comparison scores. Use automated metrics (structural compliance, section presence, term consistency) plus optional manual radiologist rating. 91% of production models degrade over time -- continuous monitoring is essential |
| D3 | **Canary deployment for new models** | Route 5-10% of traffic to new model, compare quality metrics before full rollover | MEDIUM | Standard pattern: canary group gets new model, control group stays on current. Monitor error rates, latency, and quality scores. Vercel AI Gateway supports provider routing natively |
| D4 | **Per-user cost analytics** | Show each user their AI cost footprint, help admins identify cost outliers | LOW | Already have `trackCost()` with userId. Surface in admin dashboard with daily/weekly/monthly breakdowns. Low effort, high visibility |
| D5 | **Cost alerting with notifications** | Proactive alerts when daily spend exceeds thresholds, before ceiling kicks in | LOW | Already have cost ceiling checks in `ceiling.ts`. Add notification layer: 50% warning, 75% alert, 90% critical. Use existing abuse alert pattern as template |
| D6 | **Model performance telemetry** | Track latency, token usage, error rates per model per endpoint for data-driven decisions | MEDIUM | Log structured metrics: model name, latency_ms, input_tokens, output_tokens, error_type, fallback_triggered. Feed into admin dashboard. Required foundation for D1 (intelligent routing) and D2 (A/B dashboard) |
| D7 | **Graceful degradation with user notification** | When primary model is unavailable, degrade to fallback with clear user messaging | LOW | Users should know when getting backup-quality output. Banner: "Using alternative AI model -- report quality may vary." Builds trust. Low effort since fallback mechanism (T7) already handles the routing |

---

## Anti-Features (Deliberately NOT Build)

Features to explicitly NOT build. Each has been requested or considered and rejected for cause.

| # | Anti-Feature | Why Avoid | What to Do Instead |
|---|--------------|-----------|-------------------|
| A1 | **Self-hosted LLM inference (vLLM, Ollama on GPU VPS)** | Breakeven at 5-10M tokens/month; project estimates ~500K. GPU servers $200-500/mo minimum. Requires ML ops, monitoring, scaling, on-call. Defeats purpose for small team | Use managed inference APIs (Groq, Together AI) that handle infrastructure at pennies per request. Reconsider only if volume exceeds 10M tokens/month or HIPAA requires data sovereignty |
| A2 | **Fine-tuned radiology-specific model** | Requires curated medical training data (compliance minefield), ongoing retraining, validation against medical standards. 3-6 month project on its own | Use strong general models with carefully engineered prompts. Published RSNA research shows Llama-3-70B achieves satisfactory clinical accuracy for radiology without fine-tuning |
| A3 | **Real-time model marketplace / user-selectable models** | Creates UX confusion for radiologists who want the tool to "just work." Multiplies prompt engineering surface area. Quality assurance nightmare across N models | Curate 2-3 validated models internally, route automatically based on task complexity |
| A4 | **Custom prompt editor for end users** | Radiology prompts contain critical anti-hallucination rules and formatting constraints. User modifications risk generating medically unsafe reports | Keep prompts locked down. Template customization (already exists) is the user-facing control surface |
| A5 | **Multi-provider load balancing for cost arbitrage (5+ providers)** | Massive complexity: different APIs, billing, failure modes, quality profiles. Diminishing returns after switching off GPT-4o | Pick ONE primary cheap provider (Groq), ONE fallback (Together AI), ONE emergency (OpenAI). Three is manageable. Five is a nightmare |
| A6 | **Offline/local model inference in browser** | Requires powerful local GPU, complex setup. Radiology prompt + Llama 70B needs 40GB+ VRAM. Not viable for browser-based SaaS | Keep everything server-side via managed APIs |
| A7 | **Automated prompt optimization / PromptBridge-style transfer** | Research-stage tooling. Automated prompt transfer frameworks exist (PromptBridge, OpenAI Optimizer) but are not production-ready for safety-critical medical prompts | Manual prompt adaptation with iterative testing against quality baseline. Medical accuracy cannot be left to automated optimization |

---

## Feature Dependencies

```
[T1: Env-based config]
    |
    v
[T2: Provider abstraction]
    |
    +---> [T3: Alternative LLM] ---> [T5: Prompt adaptation] ---> [T6: Quality validation]
    |                                                                    |
    +---> [T4: Alternative transcription]                                v
    |                                                              [T7: Fallback routing]
    +---> [T8: Actual cost tracking]                                     |
                |                                                        v
                v                                              [D1: Intelligent routing]
          [D4: Per-user cost analytics]                                  |
                |                                                        v
                v                                              [D3: Canary deployment]
          [D5: Cost alerting]                                            |
                                                                         v
                                                               [D2: A/B quality dashboard]

[D6: Model telemetry] --enhances--> [D1, D2, D3]
[D7: Graceful degradation] --enhances--> [T7: Fallback routing]
```

### Critical Path

**T1 -> T2 -> T3 -> T5 -> T6 -> T7** is the critical path. Everything else can run in parallel or be deferred.

### Dependency Notes

- **T1 requires nothing:** Pure config, do first
- **T2 requires T1:** Abstraction layer reads from config
- **T5 requires T3:** Cannot adapt prompts until target model is selected and running
- **T6 requires T5:** Quality validation needs adapted prompts on target model
- **T7 requires T6:** Fallback thresholds come from quality validation data
- **T8 is independent:** Can upgrade cost tracking in parallel with model work
- **D6 is independent:** Can add telemetry in parallel, but most valuable after T7

---

## MVP Recommendation

### Phase 1: Core Migration (v3.0 MVP)

Minimum to claim "cost-optimized" -- the migration works, quality is validated, fallback exists.

1. **T1: Environment-based model config** -- foundation for everything
2. **T2: Provider abstraction** -- decouple model from routes
3. **T3: Alternative LLM integration** -- the actual cost reduction
4. **T4: Alternative transcription** -- secondary cost reduction
5. **T5: Prompt adaptation** -- make it work on new model
6. **T6: Quality validation baseline** -- prove it is safe to ship
7. **T7: Fallback to premium model** -- safety net
8. **T8: Actual cost tracking** -- verify savings are real

### Phase 2: Operational Excellence (v3.1)

Once basic migration is running and quality is confirmed.

- **D4: Per-user cost analytics** -- trigger: need visibility into cost distribution
- **D5: Cost alerting** -- trigger: daily cost exceeds expected range
- **D6: Model performance telemetry** -- trigger: need data for routing decisions
- **D7: Graceful degradation UX** -- trigger: fallback events are happening

### Phase 3: Intelligent Optimization (v3.2+)

Requires production data to build correctly.

- **D1: Intelligent model routing** -- defer: needs telemetry data on task complexity vs model performance
- **D2: A/B quality dashboard** -- defer: needs routing infrastructure and quality metrics pipeline
- **D3: Canary deployment** -- defer: needs routing + telemetry + dashboard to be useful

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Risk if Skipped | Priority |
|---------|------------|---------------------|-----------------|----------|
| T1: Env-based config | LOW (invisible) | LOW | Blocks everything | P0 |
| T2: Provider abstraction | LOW (invisible) | MEDIUM | Cannot swap models | P0 |
| T3: Alternative LLM | HIGH (cost savings) | HIGH | No migration | P0 |
| T4: Alternative transcription | MEDIUM (cost savings) | MEDIUM | Partial migration | P0 |
| T5: Prompt adaptation | HIGH (quality) | HIGH | Degraded reports | P0 |
| T6: Quality validation | HIGH (safety) | HIGH | Ship unsafe | P0 |
| T7: Fallback routing | HIGH (reliability) | MEDIUM | Outages break users | P1 |
| T8: Actual cost tracking | MEDIUM (visibility) | MEDIUM | Cannot verify savings | P1 |
| D4: Per-user analytics | MEDIUM (admin insight) | LOW | Blind to cost patterns | P2 |
| D5: Cost alerting | MEDIUM (ops safety) | LOW | Surprise bills | P2 |
| D6: Model telemetry | LOW (engineering) | MEDIUM | No data for optimization | P2 |
| D7: Graceful degradation UX | MEDIUM (user trust) | LOW | Confused users on fallback | P2 |
| D1: Intelligent routing | HIGH (cost + quality) | HIGH | Overpay for simple tasks | P3 |
| D2: A/B dashboard | MEDIUM (quality ops) | MEDIUM | Manual quality checks | P3 |
| D3: Canary deployment | MEDIUM (safe rollout) | MEDIUM | Risky model switches | P3 |

**Priority key:**
- P0: Must have -- migration does not work without this
- P1: Should have -- migration works but is fragile without this
- P2: Valuable -- operational excellence, add within weeks of launch
- P3: Strategic -- requires production data, plan for v3.2+

---

## Prompt Migration: Specific Concerns for This Codebase

The current radiology system prompt (~120 lines, ~2.5K tokens) is the highest-risk element of this migration.

### What Must Change

| Concern | GPT-4o Behavior | Open Model Behavior | Required Change |
|---------|----------------|---------------------|-----------------|
| Implicit reasoning | GPT-4o handles nuance without explicit instruction | Open models need explicit step-by-step chains | Add explicit reasoning instructions for contradiction prevention |
| System prompt length | GPT-4o handles long system prompts well | Open models degrade above ~2K tokens in system prompt | Trim current prompt, move examples to few-shot or user prompt |
| Formatting compliance | GPT-4o reliably follows Markdown formatting | Open models may drift from format spec | Add explicit format validation post-generation, stronger format anchoring |
| Anti-hallucination | GPT-4o responds well to "NEVER" / "CRITICAL" directives | Open models need more structured constraint framing | Convert rule lists to numbered constraints with explicit pass/fail criteria |
| Temperature sensitivity | 0.2 works well at GPT-4o | Groq recommends starting at 0.2-0.4 for medical, then tuning | Start at 0.2 (matching current), test 0.1-0.3 range during validation |

### What Does NOT Change

- Section structure (Clinical Information, Technique, Comparison, Findings, Impression)
- Anti-hallucination rules (core safety requirement)
- Template structure enforcement
- User prompt format (findings + checklist)
- Output validation with Zod schemas

---

## Cost Savings Estimates

| Operation | Current (OpenAI) | Target (Groq Primary) | Savings |
|-----------|------------------|-----------------------|---------|
| Report generation | ~$0.020/report (GPT-4o) | ~$0.0007/report (Llama 4 Scout) | 96% |
| Transcription | $0.006/min (Whisper API) | ~$0.0007/min (Groq Whisper v3 Turbo) | 88% |
| Template suggestions | ~$0.015/suggestion (GPT-4o) | ~$0.0004/suggestion (Scout) | 97% |
| Monthly estimate (200 users) | ~$2,400-4,200/month | ~$100-350/month | 90-95% |

**Note:** These are estimates. T8 (actual cost tracking) exists specifically to validate these projections with real data.

---

## Medical Domain Quality Concerns

This is not a generic chatbot migration. Medical report generation has specific quality requirements.

### Quality Gates That Must Pass Before Cutover

| Gate | Metric | Threshold | How to Test |
|------|--------|-----------|-------------|
| Structure compliance | Report has all 5 required sections | 100% (zero tolerance) | Automated: parse output for ## headings |
| Anti-hallucination | No findings added that were not in input | 100% (zero tolerance) | Manual: compare output findings against input for 20 test cases |
| Terminology accuracy | Medical terms spelled correctly, used appropriately | >98% | Manual: radiologist review of 10 representative reports |
| Internal consistency | No contradictions within same organ system | 100% (zero tolerance) | Automated: flag when "normal" and "abnormal" co-occur for same structure |
| Template adherence | Bold subsection headings match template structure | >95% | Automated: compare output subsections against template definition |
| Impression quality | Concise, covers key findings, no hallucinations | >90% subjective quality | Manual: radiologist rating on 5-point scale |

### When to Abort Migration

- Anti-hallucination compliance drops below 95% after prompt adaptation
- Structure compliance below 90% across test cases
- Radiologist rates output quality below 3/5 on average
- Latency exceeds 10s TTFT (time to first token) on any provider

---

## Existing Infrastructure Compatibility

| Existing System | Compatible? | Changes Needed |
|-----------------|-------------|----------------|
| Rate limiting (Upstash Redis) | YES | No changes -- operates on request level, model-agnostic |
| Monthly usage tracking | YES | No changes -- tracks operation counts, not provider details |
| Cost ceiling (`ceiling.ts`) | YES | Update thresholds (costs will be ~10x lower per operation) |
| Abuse detection (`detector.ts`) | YES | No changes -- tracks patterns, not provider details |
| Cost tracker (`tracker.ts`) | PARTIAL | Replace `COST_ESTIMATES` with actual token-based calculation |
| Retry logic (`retry.ts`) | PARTIAL | Verify retry patterns work with Groq/Together error codes |
| Error formatting (`errors.ts`) | PARTIAL | Add Groq/Together error code mapping alongside OpenAI codes |
| SSE streaming to frontend | YES | All providers support OpenAI-compatible SSE via AI SDK |

---

## Sources

### HIGH Confidence
- Codebase analysis: `app/app/api/generate/route.ts` (452 lines), `app/app/api/transcribe/route.ts` (388 lines), `app/lib/cost/tracker.ts` (94 lines)
- [Groq Model Migration Guide](https://console.groq.com/docs/prompting/model-migration) -- explicit prompt adaptation recommendations
- [Vercel AI Gateway Fallbacks](https://vercel.com/changelog/model-fallbacks-now-available-in-vercel-ai-gateway) -- native multi-model fallback support
- [Vercel AI SDK Provider Management](https://ai-sdk.dev/docs/ai-sdk-core/provider-management) -- provider abstraction patterns
- [Groq Pricing](https://groq.com/pricing) -- verified 2026-04-05

### MEDIUM Confidence
- [LLM Routing in Production (LogRocket)](https://blog.logrocket.com/llm-routing-right-model-for-requests/) -- routing patterns and best practices
- [Multi-provider LLM Orchestration 2026 Guide](https://dev.to/ash_dubai/multi-provider-llm-orchestration-in-production-a-2026-guide-1g10) -- architecture patterns
- [Intelligent LLM Routing: 85% Cost Reduction (Swfte AI)](https://www.swfte.com/blog/intelligent-llm-routing-multi-model-ai) -- cost savings benchmarks
- [Top 5 LLM Monitoring Tools (Confident AI)](https://www.confident-ai.com/knowledge-base/top-5-llm-monitoring-tools-for-ai) -- quality regression detection
- [Model Performance Regression Detection (Statsig)](https://www.statsig.com/perspectives/model-performance-quality-decline) -- 91% of models degrade over time
- [Meta Llama Infrastructure Migration Guide](https://www.llama.com/docs/deployment/infrastructure-migration/) -- official Llama migration path
- [RSNA 2026: LLMs as Radiology Proofreaders](https://www.rsna.org/news/2026/february/llms-act-as-radiology-proofreaders) -- Llama-3-70B radiology validation

### LOW Confidence (Needs Validation)
- Specific quality parity between Llama 4 Scout and GPT-4o for structured radiology reports -- no published medical benchmarks for Llama 4 yet
- Groq paid tier rate limits for 200 concurrent users -- not fully documented publicly, contact sales required
- Together AI serverless Maverick availability -- may require dedicated deployment for consistent availability
- Prompt token reduction from 2.5K to 2K without quality loss -- needs empirical testing

---

*Feature research for: Cost-Optimized AI Infrastructure Migration (v3.0)*
*Researched: 2026-04-05*

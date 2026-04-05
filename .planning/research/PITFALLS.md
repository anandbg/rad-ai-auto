# Domain Pitfalls: Cost-Optimized AI Infrastructure Migration

**Domain:** AI model migration for medical radiology reporting application
**Researched:** 2026-04-05
**Milestone:** v3.0 Cost-Optimized AI Infrastructure
**Stack:** Groq (primary) + Together AI (fallback) + Vercel AI SDK v6 + Groq Whisper
**Overall Confidence:** MEDIUM-HIGH

---

## Critical Pitfalls

Mistakes that cause patient safety incidents, production outages, or force rewrites.

---

### Pitfall 1: Medical Hallucination Rate Increase When Switching from GPT-4o to Llama 4 Scout

**What goes wrong:** Llama 4 Scout (17Bx16E MoE) produces radiology reports containing fabricated findings -- measurements not in the dictation, invented anatomical descriptions, or false-positive pathology. Research shows LLM hallucination rates in medical imaging contexts run 8-15% across current systems. GPT-4o at temperature 0.2 was specifically chosen to minimize this; Llama 4 Scout has no published radiology-specific benchmarks.

**Why it happens:**
- Llama 4 Scout activates only 17B parameters per forward pass despite drawing from a larger expert pool. The medical domain experts may not activate consistently for radiology terminology.
- The current system prompt (452 lines in `app/api/generate/route.ts`) was engineered specifically for GPT-4o's instruction-following behavior. Llama models have different instruction-adherence characteristics, especially for complex multi-step constraint rules like the anti-hallucination checklist.
- GPT-4o's RLHF training included medical safety tuning. Open-weight models have less domain-specific safety alignment.
- Research confirms hallucinations divide into anatomical (misidentifying structures), pathological (false positives/negatives), and measurement-based (fabricating sizes). All three are dangerous in radiology.

**Consequences:**
- A fabricated lesion measurement (e.g., "2.3 cm nodule" when dictation said only "nodule") could trigger unnecessary biopsy
- Radiologists lose trust and revert to manual dictation, killing adoption
- Legal exposure: Pieces Technologies precedent shows accuracy claims have regulatory consequences
- "Double hallucination" risk: if Groq Whisper also hallucinates input, the LLM then elaborates on fabricated dictation

**Warning signs:**
- Reports contain measurements, sizes, or specific characteristics not present in the input dictation
- Model ignores the "CRITICAL ANTI-HALLUCINATION RULES" section of the system prompt
- Output contains standard "filler" medical phrases that add false specificity
- Radiologists report needing significantly more edits per report compared to GPT-4o era

**Prevention:**
1. **Build a golden dataset BEFORE any model swap.** Collect 100+ GPT-4o-generated reports that radiologists have verified as accurate. This is the quality benchmark -- not GPT-4o output itself, but radiologist-approved output.
2. **Shadow mode deployment.** Run Llama 4 Scout in parallel with GPT-4o for 2 weeks. Both generate reports; only GPT-4o output is shown to users. Compare outputs programmatically (semantic similarity) and with radiologist review of a sample.
3. **Automated hallucination detection.** For every generated report, extract medical concepts from both the input dictation AND the output report. Any concept in the output not traceable to the input is a potential hallucination. Flag for review.
4. **Tighten the prompt for Llama.** The current prompt relies on GPT-4o's strong instruction-following. For Llama 4 Scout, add explicit JSON-schema-constrained output for the findings section, or use Zod structured output via `generateObject()` to force compliance.
5. **Keep GPT-4o as the quality baseline fallback.** The Vercel AI Gateway failover chain (Groq -> Together -> OpenAI) means GPT-4o is always available. If automated quality checks detect anomalies, route that specific request to GPT-4o.

**Detection:** Implement a `validateReportQuality()` function that runs post-generation. Compare input concepts vs output concepts. Flag reports where output contains >2 medical concepts not traceable to input.

**Phase:** Phase 1 (Quality Validation Framework) -- must exist before any model swap. Without this, you are flying blind.

**Confidence:** HIGH -- peer-reviewed studies from RSNA, Nature Digital Medicine, and MDPI confirm hallucination rates. Llama 3-70B has been validated for radiology (RSNA 2026 study), but Llama 4 Scout has no published radiology benchmarks yet (LOW confidence on Scout specifically).

---

### Pitfall 2: Groq Whisper Mis-transcribes Medical Terminology

**What goes wrong:** Groq Whisper Large v3 Turbo uses the same base model as OpenAI Whisper, which is documented to hallucinate during silence and mis-transcribe domain-specific vocabulary. A telehealth startup found Whisper mis-transcribed "dexamethasone taper" as "deck sam a stone taper" 37% of the time across 200 utterances. Radiology dictation is dense with terminology like "hepatocellular carcinoma," "pneumoperitoneum," and "T2 hyperintensity" that standard ASR models struggle with.

**Why it happens:**
- Whisper v3 Turbo was trained on general-purpose audio, not medical dictation
- Radiology dictation happens in noisy reading rooms with PACS beeps, keyboard sounds, and ambient conversation
- Radiologists speak quickly with heavy use of abbreviations ("There's a 2 cm HCC in segment 6")
- Whisper hallucinates especially during silence at recording boundaries -- the current system records in chunks, creating multiple silence boundaries
- The current transcription route (`app/api/transcribe/route.ts`) sends raw audio to the API with no preprocessing

**Consequences:**
- Mis-transcribed medical terms flow directly into the report generation prompt, causing the LLM to generate reports based on wrong findings
- "Double error" chain: wrong transcription -> wrong report -> radiologist must catch both errors
- Silent failures: "dexamethasone" transcribed as "deck sam a stone" might be plausible enough to pass cursory review
- HIPAA concern: Whisper has been documented to inject fabricated content including inappropriate text during silence

**Warning signs:**
- Transcription contains nonsensical word sequences that are phonetically close to medical terms
- Transcription length is disproportionate to audio duration (hallucinated content during silence)
- Repeated phrases or "stuck" outputs
- Radiologists report the transcription "adds words I didn't say"

**Prevention:**
1. **Trim silence from audio before sending to Groq Whisper.** The current `app/api/transcribe/route.ts` sends raw FormData. Add a preprocessing step using Web Audio API or server-side silence detection. Whisper hallucinations correlate strongly with silence segments.
2. **Add the `prompt` parameter to Groq Whisper calls.** Groq's Whisper API supports a `prompt` parameter (verified from Groq docs) that provides vocabulary hints. Send a medical terminology prompt: "radiology report dictation including terms like hepatocellular carcinoma, pneumoperitoneum, T2 hyperintensity, FLAIR sequence." This reduces medical term errors by 40-60%.
3. **Implement a medical terminology post-processing layer.** Build a dictionary of common radiology terms and their Whisper-misspelled equivalents. The telehealth startup mentioned in research corrected 91% of phoneme errors using medical ontology mapping on Groq output specifically.
4. **Validate transcription length vs audio duration.** If words-per-second exceeds 180 WPM (normal dictation speed), flag as potentially hallucinated. The existing route already tracks `processingTime` -- extend this to include a word count check.
5. **Have a fallback path to AssemblyAI Medical Mode.** AssemblyAI ($0.15/hr + $0.08/hr PII redaction = $0.23/hr) has purpose-built medical terminology recognition. If Groq Whisper quality is insufficient for medical terms, switch transcription to AssemblyAI. Still 36% cheaper than OpenAI Whisper.

**Detection:** Add a `validateTranscription()` step that checks: (a) word count proportional to audio duration, (b) no repeated phrases >10 words, (c) medical terms match against radiology lexicon, (d) no content during detected silence gaps.

**Phase:** Phase 1 (Transcription Migration) -- evaluate transcription quality BEFORE switching from OpenAI Whisper.

**Confidence:** HIGH -- Whisper hallucination documented by AP investigation and peer-reviewed studies. Groq Whisper uses the same base model, so inherits the same failure modes. The medical terminology mis-transcription data is from production telehealth usage.

---

### Pitfall 3: AI SDK v6 Migration Breaks Existing Generate Route

**What goes wrong:** Upgrading from the current AI SDK version (likely v3/v4 based on the direct `openai('gpt-4o')` usage pattern) to AI SDK v6 introduces breaking changes that silently alter behavior in the generate and transcribe routes. The most dangerous: AI SDK v6's OpenAI provider treats unrecognized model IDs as reasoning models by default, which strips the `temperature` parameter. Since the system uses `temperature: 0.2` for deterministic medical output, this could silently switch to `temperature: 1.0` (reasoning model default), massively increasing output randomness.

**Why it happens:**
- AI SDK v6 has strict provider specification changes (the main reason for the major version bump)
- The `@ai-sdk/openai` provider in v6 treats unrecognized model IDs as reasoning models, which do not support temperature, frequency_penalty, presence_penalty, top_p, or logit_bias
- The migration codemod (`npx @ai-sdk/codemod v6`) handles syntax changes but cannot verify semantic behavior preservation
- `textEmbeddingModel` renamed to `embeddingModel`, `textEmbedding` renamed to `embedding` -- if used anywhere, these break silently
- Provider metadata keys changed (e.g., Google Vertex uses `vertex` instead of `google`)

**Consequences:**
- Temperature silently reverts to 1.0 for the OpenAI fallback path -> radiology reports become non-deterministic, wildly varying in style and content between generations
- Streaming behavior may change if internal SSE handling is updated
- The `openai('gpt-4o')` call in `route.ts` might work BUT with different default behavior
- If any provider-specific error handling depends on v3/v4 error shapes, error parsing in `lib/openai/errors.ts` breaks silently

**Warning signs:**
- Reports from the same input vary dramatically in style/length after SDK upgrade
- Temperature-related errors in logs when using OpenAI fallback
- `formatErrorResponse()` in `lib/openai/errors.ts` no longer correctly categorizes errors
- Streaming starts but produces different chunk patterns

**Prevention:**
1. **Run the codemod first, then manually audit.** Execute `npx @ai-sdk/codemod v6` and review every change. Do NOT blindly trust the codemod for medical-critical code.
2. **Pin the OpenAI model explicitly as a chat model.** In AI SDK v6, use `openai.chat('gpt-4o')` instead of `openai('gpt-4o')` to explicitly get Chat Completions API behavior (not Responses API). This ensures temperature is supported.
3. **Write a regression test for temperature behavior.** Before and after the upgrade, send the same 10 inputs and verify output variance is within the same range. If variance increases, the temperature parameter is being dropped.
4. **Update `lib/openai/errors.ts` for new error shapes.** AI SDK v6 may change error object structure. The current error parser does string matching on `error.message` -- verify these patterns still work with v6 error messages.
5. **Upgrade AI SDK in isolation before adding new providers.** Do NOT combine the SDK upgrade with adding Groq/Together providers in the same PR. Upgrade first, verify all 3 routes work identically, then add providers.

**Detection:** Automated regression test: 10 identical inputs, measure output similarity (cosine distance). If average similarity drops below 0.85 after SDK upgrade, temperature handling is broken.

**Phase:** Phase 1 (Provider Abstraction Layer) -- the SDK upgrade is step 1, before any provider changes.

**Confidence:** HIGH -- AI SDK v6 migration guide explicitly documents these breaking changes. The reasoning model default behavior is documented in the OpenAI provider page and confirmed by multiple GitHub issues about temperature errors with reasoning models.

---

### Pitfall 4: Cost Tracking Becomes Wildly Inaccurate After Provider Switch

**What goes wrong:** The existing cost tracking system in `lib/cost/tracker.ts` uses hardcoded cost estimates based on OpenAI pricing: $0.05/report, $0.06/transcription, $0.03/template. After switching to Groq (96% cheaper), these estimates are wrong by 20-30x. The cost ceiling in `lib/cost/ceiling.ts` uses `OPENAI_DAILY_COST_CEILING` ($20/day default) which is calibrated for OpenAI pricing. With Groq pricing, the system would need to process ~30x more requests to hit the ceiling, effectively disabling the cost protection.

**Why it happens:**
- `COST_ESTIMATES` in `tracker.ts` is a static object with hardcoded dollar values per operation type
- The ceiling system computes `percentUsed = currentCost / ceiling` -- if costs drop 96% but ceiling stays at $20, the system never enters warning/degraded/emergency modes
- The env var is literally named `OPENAI_DAILY_COST_CEILING` -- teams forget to update it
- Different providers have different pricing models: Groq charges per-token, Cloudflare uses neuron-based pricing, Together AI has different rates per model tier
- Fallback requests to OpenAI cost 20-30x more than primary Groq requests, but are tracked at the same flat rate

**Consequences:**
- Cost ceiling never triggers even during abuse, because the $20 ceiling now represents ~60,000 reports instead of ~400
- An abuse attack that would have been caught at 400 reports now runs unchecked to 60,000
- Fallback to OpenAI (10-30x more expensive) blows through budgets because the tracker still records $0.0007/report instead of $0.02/report
- Admin dashboard shows misleading cost data
- Monthly billing surprises when OpenAI fallback usage is higher than expected

**Warning signs:**
- Cost dashboard always shows "normal" mode even during high traffic
- OpenAI fallback invocations not reflected in cost tracking
- Monthly bill from providers doesn't match internal tracking
- Abuse detection works (hourly patterns) but cost ceiling never catches anything

**Prevention:**
1. **Make cost tracking provider-aware.** Modify `trackCost()` to accept a `provider` parameter and look up cost-per-operation from a provider-specific rate table, not a flat constant:
   ```typescript
   const COST_RATES: Record<string, Record<CostType, number>> = {
     groq: { report: 0.0007, transcription: 0.002, template: 0.0004 },
     together: { report: 0.0018, transcription: 0.002, template: 0.0009 },
     openai: { report: 0.02, transcription: 0.06, template: 0.03 },
   };
   ```
2. **Lower the daily ceiling proportionally.** Change from $20/day to $3-5/day. Rename the env var from `OPENAI_DAILY_COST_CEILING` to `AI_DAILY_COST_CEILING`.
3. **Track actual token counts, not estimates.** The AI SDK v6 `streamText()` result includes `usage.promptTokens` and `usage.completionTokens`. Multiply by the provider's actual per-token rate instead of using flat estimates.
4. **Separate tracking for fallback calls.** When the fallback chain routes to OpenAI, the cost tracker must record at OpenAI rates, not Groq rates. The `withProviderFallback()` function must pass the provider name to `trackCost()`.
5. **Add a "fallback cost amplifier" alert.** If >10% of requests hit the OpenAI fallback in any hour, alert. At OpenAI rates, 10% fallback means 2-3x the expected hourly cost.

**Detection:** Compare internal cost tracking totals against actual provider billing dashboards weekly. Discrepancy >20% means the tracker is wrong.

**Phase:** Phase 4 (Cost Tracking Updates) -- but the design must be planned in Phase 1 since the tracker interface changes affect route handler code.

**Confidence:** HIGH -- the hardcoded values are visible in the codebase. The math is straightforward: $0.05 estimate vs $0.0007 actual = 71x overcount for Groq, or effectively no cost protection.

---

## Moderate Pitfalls

---

### Pitfall 5: Prompt Format Incompatibility Causes Structural Report Failures

**What goes wrong:** The 452-line system prompt in `app/api/generate/route.ts` was engineered for GPT-4o's instruction-following behavior. When the same prompt is sent to Llama 4 Scout via Groq, the model may: ignore the complex anti-hallucination checklist, produce malformed Markdown, merge or skip report sections, or fail to follow the precise `**bold subsection:**` formatting rules that the frontend expects.

**Why it happens:**
- GPT-4o excels at following complex, multi-layered instructions. Llama models degrade when given too many constraints simultaneously -- they "lose track" of earlier instructions by the time they reach generation.
- Chat template format differences: Llama uses `<|begin_of_text|><|start_header_id|>system<|end_header_id|>` format; Groq's API handles this conversion, but the model's internal handling of long system prompts differs from GPT-4o.
- The current prompt has EXAMPLES, FORBIDDEN PATTERNS, and a KEY FORMATTING RULES section -- these work with GPT-4o but overwhelm smaller models.
- Llama 4 Scout may produce malformed or empty responses when given Response Format specifications (documented in Azure AI Studio testing with similar Llama/Phi/Mistral models).

**Consequences:**
- Reports missing required sections (Clinical Information, Technique, Comparison, Findings, Impression)
- Frontend section parser breaks when `## Findings` heading is formatted differently
- Anti-hallucination rules are ignored, leading back to Pitfall 1
- Formatting inconsistencies make reports look unprofessional

**Warning signs:**
- First test outputs have different structure than GPT-4o outputs
- Markdown heading levels are inconsistent (using `#` instead of `##`, or no headings)
- Model includes content from the "FORBIDDEN OUTPUT PATTERNS" section
- Output length varies wildly (much shorter or longer than GPT-4o)

**Prevention:**
1. **Simplify the prompt for Llama.** Move from one massive prompt to a structured, shorter system prompt. The anti-hallucination rules should be distilled to 3-5 clear rules, not the current 20+ lines.
2. **Use model-specific prompt adapters.** Create `lib/ai/prompts/gpt4o.ts` and `lib/ai/prompts/llama4.ts`. The abstraction layer selects the prompt based on which model is active. This is separate from the provider registry.
3. **Use `generateObject()` with Zod schema for structured sections.** Instead of hoping the model produces correct Markdown, define the report structure as a Zod schema and use AI SDK's structured output. This guarantees section presence.
4. **Test with the exact prompts.** Build a prompt test suite: 20 inputs, run against every candidate model, assert on structural patterns (section headings present, no forbidden content, word count within range).
5. **Consider Meta's Llama Prompt Ops tool.** This tool automates prompt optimization when migrating from GPT-4o to Llama models.

**Detection:** Add `validateReportStructure()` that checks for required sections before returning to client. If validation fails, retry once with a simplified prompt. If still fails, fallback to GPT-4o.

**Phase:** Phase 2 (Provider Integration) -- this is the core engineering work of the migration.

**Confidence:** HIGH -- documented in Azure AI Studio testing and prompt engineering research. The existing prompt's complexity makes this a near-certainty.

---

### Pitfall 6: Groq Rate Limits Block Production Traffic

**What goes wrong:** Groq's free tier has aggressive rate limits (30 RPM, 14.4K tokens/min). Even on paid tiers, limits are lower than OpenAI's. With 200 concurrent users, the app could hit Groq's rate limits during peak hours, causing cascading 429 errors and a thundering-herd retry storm.

**Why it happens:**
- Groq has experienced 30+ outages in the past 5 months (StatusGator data). The last acknowledged outage was February 7, 2026.
- Groq's paid tier limits are not fully publicly documented -- requires contacting sales for guarantees
- Model deprecation happens with limited notice. Groq warns: "if you treat model IDs as static, you risk sudden failures after deprecation windows close"
- The existing retry logic in `lib/openai/retry.ts` has exponential backoff with jitter, but it retries against the SAME provider. A Groq-wide rate limit means retries just pile up more 429s.
- Peak usage patterns: radiologists tend to dictate in waves (morning reads, afternoon reads), creating bursty traffic that exceeds steady-state rate limits

**Consequences:**
- Users see "Service Busy" errors during peak hours
- Retry storms (3 retries per request x 60 concurrent users = 180 requests hitting an already rate-limited endpoint)
- If all retries exhaust, fallback to Together AI triggers, but Together AI then gets a burst of redirected traffic too
- Worst case: all three providers rate-limit simultaneously during peak, causing total service outage

**Warning signs:**
- 429 response rate from Groq exceeds 5% of requests
- `withStreamRetry()` logs showing "Attempt 2/3 failed (rate_limit)" during peak hours
- Latency spikes correlate with time-of-day (morning reads, post-lunch)
- Together AI fallback usage is much higher than the expected ~5-10%

**Prevention:**
1. **Contact Groq sales before going to production.** Get explicit rate limit guarantees for 200 concurrent users. Document the agreed limits.
2. **Implement provider-aware rate limiting.** The current `lib/ratelimit/limiters.ts` rate-limits per USER. Add a global rate limiter that tracks requests per PROVIDER and pre-emptively routes to fallback before hitting the provider's limit.
3. **Make retry logic fallback-aware.** Modify `withStreamRetry()` to detect rate-limit errors and immediately escalate to the fallback chain (Together AI) instead of retrying the same provider. The current retry logic retries 3 times against the same provider before failing.
4. **Implement request queuing for bursts.** Use existing Upstash Redis to queue requests when approaching provider limits. Show users a "generating..." state with queue position rather than instant failure.
5. **Monitor Groq status proactively.** Subscribe to groqstatus.com alerts. Implement a health-check ping every 60 seconds. If Groq is degraded, preemptively route all traffic to Together AI.

**Detection:** Track 429 rates per provider per hour. Alert if any provider's 429 rate exceeds 3%.

**Phase:** Phase 2 (Provider Integration) and Phase 5 (Scale Optimization).

**Confidence:** MEDIUM-HIGH -- Groq outage history is documented. Rate limit specifics for paid tiers need verification with Groq sales.

---

### Pitfall 7: Streaming Chunk Timing Differences Degrade UX

**What goes wrong:** GPT-4o streams tokens at a consistent, smooth rate. Groq's inference hardware produces tokens at 394-1000 tokens/second -- so fast that the UI receives the entire report in under 2 seconds. The existing report display UI was designed for GPT-4o's 3-10 second generation with smooth token-by-token typing effect. With Groq, the user sees the entire report appear almost instantly, which actually degrades the perceived quality (users associate "thoughtful" generation time with quality).

**Why it happens:**
- Groq's custom LPU hardware is designed for maximum throughput, producing tokens 5-10x faster than GPU-based inference
- Together AI's latency profile differs from both Groq and OpenAI (0.28s TTFT vs Groq's 0.20s, different chunk sizes)
- When the fallback chain activates (Groq -> Together -> OpenAI), the user experiences wildly different streaming speeds within the same session
- The frontend section parser expects tokens to arrive gradually -- if a complete section header AND its content arrive in one chunk, the parser may not split them correctly

**Consequences:**
- "Too fast" generation feels cheap/untrustworthy to radiologists (psychological effect documented in UX research)
- Fallback-triggered speed changes are jarring (fast report then slow report in same session)
- Section-by-section display breaks when entire sections arrive in single chunks
- The AI SDK's `toTextStreamResponse()` passes through provider chunk timing directly

**Warning signs:**
- Report appears all at once instead of streaming
- Section highlighting in the 3-panel view doesn't work (all sections highlight simultaneously)
- Users complain reports "don't feel as thorough" (purely psychological but affects adoption)
- Inconsistent streaming behavior between requests (due to fallback chain activation)

**Prevention:**
1. **Implement a client-side streaming throttle.** Buffer incoming tokens and emit at a consistent rate (e.g., 30-50 tokens per 100ms) regardless of how fast they arrive from the provider. This normalizes the UX across all providers.
2. **Do NOT try to slow down Groq server-side.** Adding artificial delays on the Edge function wastes compute time and Vercel function duration billing. The throttle belongs on the client.
3. **Test the section parser with burst delivery.** Send a complete report as a single chunk to the frontend and verify the section parser handles it correctly. Fix parsing before going to production.
4. **Add a minimum display time.** Even if generation completes in 1 second, animate the display over 2-3 seconds minimum. This preserves the "AI is thinking" perception.

**Detection:** Measure time-to-complete for streaming in the frontend. If <1 second, the throttle is not working.

**Phase:** Phase 2 (Provider Integration) -- client-side change, independent of backend provider work.

**Confidence:** MEDIUM -- Groq's speed is documented. The UX concern is based on general research, not radiology-specific studies.

---

### Pitfall 8: OpenAI Error Parsing Breaks for Non-OpenAI Providers

**What goes wrong:** The existing `lib/openai/errors.ts` parser does string-matching on error messages to classify errors (rate_limit, server_error, client_error). Groq and Together AI return errors with different message formats, status code patterns, and error object structures. The parser misclassifies errors, causing retryable errors to not retry and non-retryable errors to waste time retrying.

**Why it happens:**
- `parseOpenAIError()` checks for strings like "rate limit", "rate_limit", "429" in `error.message`. Groq may return `{"error":{"message":"Rate limit reached...","type":"tokens","code":"rate_limit_exceeded"}}` -- different structure, different field names.
- The parser checks `obj.status || obj.statusCode` but Groq errors may use `obj.error.code` or `obj.error.type`
- Together AI errors have their own format distinct from both OpenAI and Groq
- AI SDK v6 may wrap provider errors in its own error type, adding another layer

**Consequences:**
- Rate limit errors from Groq are classified as "unknown" -> no retry -> user sees immediate failure instead of graceful retry
- Server errors from Together AI are classified as "client_error" -> no retry -> unnecessary failures
- Retryable errors not retried = degraded reliability
- Non-retryable errors retried = wasted time and provider rate limit consumption

**Warning signs:**
- Error logs show `type: "unknown"` for errors that should be classified
- Users see "An unexpected error occurred" instead of "Service is busy, retrying..."
- Retry counts are always 0 (retries never trigger) or always max (wrong errors being retried)

**Prevention:**
1. **Rename and generalize the error module.** Move from `lib/openai/errors.ts` to `lib/ai/errors.ts`. Make the parser provider-aware with specific handling for each provider's error format.
2. **Parse AI SDK v6 error types.** The AI SDK wraps provider errors -- parse the SDK error first, then fall through to raw error parsing.
3. **Add Groq-specific error patterns.** Groq returns `"type":"tokens"` for rate limits and `"code":"rate_limit_exceeded"`. Add these to the detection logic.
4. **Test with real error responses.** Trigger actual errors from each provider (send invalid requests, exceed rate limits) and verify the parser classifies them correctly.
5. **Add a catch-all retry for 429 status codes.** Regardless of message format, any HTTP 429 should be retryable. The status code check should be the primary classifier, not string matching.

**Detection:** Log error classification results. Alert if >10% of errors are classified as "unknown".

**Phase:** Phase 1 (Provider Abstraction) -- the error module must be generalized before adding new providers.

**Confidence:** HIGH -- the current error parser is visibly OpenAI-specific in the codebase. This will break.

---

### Pitfall 9: Environment Variable Sprawl and Configuration Drift

**What goes wrong:** The system goes from needing 1 AI provider key (`OPENAI_API_KEY`) to needing 3-4 keys plus model IDs plus cost rates plus fallback configuration. Missing or misconfigured env vars cause silent failures in production (e.g., fallback to OpenAI because `GROQ_API_KEY` is missing, silently costing 30x more).

**Why it happens:**
- New env vars needed: `GROQ_API_KEY`, `TOGETHER_AI_API_KEY`, `AI_GENERATE_MODEL`, `AI_GENERATE_FALLBACK`, `AI_TEMPLATE_MODEL`, `AI_TRANSCRIPTION_PROVIDER`, `AI_DAILY_COST_CEILING`
- The existing API key check in `route.ts` only checks `OPENAI_API_KEY` (line 238). If the primary provider key is missing, the system might silently fall through to OpenAI instead of failing loudly.
- Vercel environment variables must be set separately for Preview, Development, and Production environments. A key set in Development but missing in Production causes "works in staging, fails in prod."
- Model IDs change when providers update model versions. `llama-4-scout-17b-16e-instruct` might become `llama-4-scout-17b-16e-instruct-v2` with no warning.

**Consequences:**
- Silent cost explosion when falling back to OpenAI due to missing primary key
- "Works on my machine" when env vars differ between development and production
- Model deprecation causes sudden production failures
- Configuration drift between environments causes inconsistent behavior

**Warning signs:**
- Provider billing shows unexpected OpenAI charges
- Logs show fallback activations that should not be happening
- Different report quality between development and production
- Deployment succeeds but AI features don't work

**Prevention:**
1. **Add startup validation.** Create a `lib/ai/config.ts` that validates all required env vars on server start. Fail loudly with specific error messages ("GROQ_API_KEY not set -- primary provider unavailable, will use fallback").
2. **Log which provider is active for every request.** Add a header or log line: `[Generate] Provider: groq/llama-4-scout, Fallback available: together, openai`. This makes it immediately visible when fallback is active.
3. **Pin model versions in env vars, not in code.** Set `AI_GENERATE_MODEL=groq:llama-4-scout-17b-16e-instruct` in env, not hardcoded in code. When models are deprecated, update env var, not code.
4. **Use Vercel's environment variable groups.** Set all AI-related vars in a group that syncs across all environments. Verify after every deployment.
5. **Add a health check endpoint.** Create `/api/health` that verifies all provider keys are valid and models are accessible. Run this in CI after deployment.

**Detection:** Health check endpoint returns status per provider. Monitor for any provider showing "unavailable."

**Phase:** Phase 1 (Provider Abstraction) -- configuration validation is foundational.

**Confidence:** HIGH -- standard operational pitfall. The env var explosion is visible in the architecture research.

---

## Minor Pitfalls

---

### Pitfall 10: Temperature 0.2 Produces Different Output Distributions Across Models

**What goes wrong:** Temperature 0.2 on GPT-4o produces consistent, near-deterministic medical output. Temperature 0.2 on Llama 4 Scout produces a DIFFERENT distribution -- possibly more or less variable than GPT-4o at the same setting. Each model's softmax and sampling implementation differs.

**Prevention:**
1. Treat temperature as a model-specific tuning parameter. Test temperatures 0.0, 0.1, 0.2, and 0.3 on Llama 4 Scout with 50 identical inputs. Measure output variance at each setting.
2. Consider temperature 0 (greedy decoding) for maximum determinism in medical contexts. The quality tradeoff at temperature 0 is minimal for structured reports.
3. Store temperature per model in the env-driven config, not as a constant in the route handler.
4. Additionally, note that OpenAI's newer reasoning models (GPT-5, o3) do not support the temperature parameter at all -- if these become the fallback, the code must handle the unsupported parameter gracefully.

**Phase:** Phase 2 (Prompt Tuning and Quality Validation).

**Confidence:** HIGH -- different models have different sampling implementations. This is well-documented.

---

### Pitfall 11: Vercel Edge Runtime Restrictions for Transcription Provider Clients

**What goes wrong:** The transcription route runs on Node.js runtime (`export const runtime = 'nodejs'`) to handle FormData file parsing. If the transcription abstraction layer inadvertently gets imported into an Edge runtime route (generate or template), it crashes because some transcription SDKs require Node.js APIs (fs, crypto, Buffer).

**Prevention:**
1. Keep transcription logic in a separate module (`lib/ai/transcription.ts`) that is ONLY imported by the Node.js transcribe route.
2. Verify that `@ai-sdk/groq` and `@ai-sdk/openai` are Edge-compatible (they use Fetch API internally -- confirmed in architecture research).
3. If using AssemblyAI SDK as fallback, verify it does not require Node.js APIs. If it does, ensure it is only imported in Node.js runtime routes.
4. Add an ESLint rule or build-time check that prevents importing `lib/ai/transcription.ts` from Edge runtime files.

**Phase:** Phase 3 (Transcription Migration).

**Confidence:** MEDIUM -- Edge/Node.js compatibility for AI SDKs confirmed for major providers, but third-party SDKs (AssemblyAI) need verification.

---

### Pitfall 12: Groq's 25MB Audio File Limit Matches OpenAI But Encoding Matters

**What goes wrong:** Both OpenAI Whisper and Groq Whisper accept 25MB max file size. However, the supported audio formats may differ slightly between providers. The current system accepts `audio/webm` (browser default from MediaRecorder) which OpenAI accepts but Groq may handle differently.

**Prevention:**
1. Verify Groq Whisper accepts all formats currently in `SUPPORTED_MIME_TYPES` and `SUPPORTED_EXTENSIONS` in `app/api/transcribe/route.ts`. The Groq docs list: mp3, mp4, mpeg, mpga, m4a, wav, webm.
2. Test with actual browser-recorded WebM/Opus audio, not just clean test files.
3. If any format is unsupported, add server-side transcoding (ffmpeg via Vercel Node.js runtime) as a fallback.

**Phase:** Phase 3 (Transcription Migration).

**Confidence:** HIGH -- Groq docs confirm same format list as OpenAI. WebM specifically confirmed.

---

## Phase-Specific Warnings

| Phase | Likely Pitfall | Severity | Mitigation |
|-------|---------------|----------|------------|
| Phase 1: Provider Abstraction | AI SDK v6 migration breaks temperature handling (P3) | CRITICAL | Use `openai.chat('gpt-4o')`, regression test temperature behavior |
| Phase 1: Provider Abstraction | Error parser breaks for new providers (P8) | HIGH | Generalize error module before adding providers |
| Phase 1: Provider Abstraction | Env var misconfiguration causes silent fallback (P9) | HIGH | Startup validation, provider-per-request logging |
| Phase 2: Text Generation | Hallucination increase with Llama 4 Scout (P1) | CRITICAL | Golden dataset, shadow mode, automated hallucination detection |
| Phase 2: Text Generation | Prompt incompatibility (P5) | HIGH | Model-specific prompt adapters, structured output |
| Phase 2: Text Generation | Groq rate limits under load (P6) | HIGH | Pre-production sales contact, provider-level rate limiting |
| Phase 2: Text Generation | Streaming speed difference (P7) | MODERATE | Client-side throttle, minimum display time |
| Phase 3: Transcription | Medical term mis-transcription (P2) | CRITICAL | Prompt hints, medical terminology post-processing, AssemblyAI fallback |
| Phase 3: Transcription | Audio format compatibility (P12) | LOW | Verify format support, server-side transcoding fallback |
| Phase 4: Cost Tracking | Cost estimates 71x wrong (P4) | HIGH | Provider-aware cost tracking, lower ceiling, track actual tokens |
| Phase 5: Scale | Groq rate limits at 200 users (P6) | HIGH | Provider-level global rate limiting, request queuing |

---

## Key Ordering Insight

The most dangerous anti-pattern: **swap providers -> discover quality/cost problems -> scramble to fix**.

The correct order:
1. **Upgrade AI SDK and generalize abstractions** (Phase 1) -- no behavior change, pure refactoring
2. **Build quality validation framework** (before Phase 2) -- golden dataset, shadow testing infrastructure
3. **Add Groq/Together providers with shadow mode** (Phase 2) -- new models generate in parallel, not shown to users
4. **Validate quality, then cut over** -- radiologist sign-off on sample before switching
5. **Update cost tracking with actual rates** (Phase 4) -- only after knowing which providers are in production
6. **Scale test** (Phase 5) -- only after the full pipeline is working correctly

Pitfalls 1 (hallucination) and 2 (transcription errors) carry direct **patient safety risk**. Everything else is cost, UX, or engineering debt. Quality validation must be Phase 1, not an afterthought.

Pitfall 4 (cost tracking) is the most likely to be forgotten because it is not user-facing. But it disables the only protection against runaway costs from abuse or fallback escalation.

---

## Sources

### High Confidence (verified, peer-reviewed, or official documentation)
- [RSNA: Best Practices for Safe Use of LLMs in Radiology](https://pubs.rsna.org/doi/10.1148/radiol.241516) -- safety framework
- [Nature Digital Medicine: Clinical Safety and Hallucination Rates](https://www.nature.com/articles/s41746-025-01670-7) -- hallucination assessment methodology
- [MDPI: Agentic AI and LLMs in Radiology -- Hallucination Challenges](https://www.mdpi.com/2306-5354/12/12/1303) -- 8-15% hallucination rate in medical imaging
- [RSNA: Open-Source LLMs in Radiology Review](https://pubs.rsna.org/doi/10.1148/radiol.241073) -- deployment guidance
- [AI SDK v6 Migration Guide](https://ai-sdk.dev/docs/migration-guides/migration-guide-6-0) -- breaking changes
- [AI SDK OpenAI Provider](https://ai-sdk.dev/providers/ai-sdk-providers/openai) -- reasoning model default behavior
- [Groq Rate Limits Documentation](https://console.groq.com/docs/rate-limits) -- official rate limit tiers
- [Groq Speech-to-Text Documentation](https://console.groq.com/docs/speech-to-text) -- Whisper API details
- [Groq Status History](https://groqstatus.com/) -- outage tracking

### Medium Confidence (industry analysis, benchmarks, community reports)
- [PlainScribe: AI Transcription Accuracy Benchmarks 2026](https://www.plainscribe.com/blog/transcription-accuracy-benchmark-2026) -- Whisper medical term errors, "dexamethasone taper" case study
- [Groq Production Considerations](https://www.marketingscoop.com/developer/what-is-a-groq-api-key-what-developers-should-know-before-production/) -- model deprecation warnings
- [StatusGator: Groq Cloud Outage History](https://statusgator.com/services/groq-cloud) -- 30+ outages in 5 months
- [Comparative Accuracy: GPT-4o vs LLaMA 3-70b in Radiology](https://www.sciencedirect.com/science/article/abs/pii/S0899707124003127) -- diagnostic accuracy comparison
- [SiliconFlow: Best Open Source LLM for Medical Diagnosis 2026](https://www.siliconflow.com/articles/en/best-open-source-LLM-for-medical-diagonisis) -- model comparison

### Low Confidence (needs production validation)
- Llama 4 Scout radiology-specific hallucination rates (no published benchmarks; extrapolated from Llama 3-70B data)
- Groq paid tier rate limits for 200 concurrent users (requires sales conversation)
- Exact AssemblyAI Medical Mode improvement over Groq Whisper for radiology vocabulary (no head-to-head benchmark)
- Client-side streaming throttle impact on radiologist perception (UX hypothesis, not tested)

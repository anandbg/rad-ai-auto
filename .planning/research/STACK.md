# Technology Stack: Cost-Optimized AI Infrastructure

**Project:** AI Radiologist v3.0
**Researched:** 2026-04-05
**Focus:** Replace OpenAI (GPT-4o + Whisper) with near-zero-cost alternatives

---

## Current Baseline Costs (OpenAI)

| Service | Model | Pricing | Notes |
|---------|-------|---------|-------|
| Report Generation | GPT-4o | $2.50/M input, $10.00/M output | ~2K input + ~1.5K output per report |
| Transcription | Whisper API | $0.006/minute ($0.36/hr) | ~2-5 min per dictation |

**Estimated per-report cost (GPT-4o):** ~$0.020 per report (2K in + 1.5K out)
**Estimated per-transcription cost:** ~$0.012-$0.030 per dictation (2-5 min)

At 200 concurrent users generating ~20 reports/day each: ~4,000 reports/day = ~$80/day = ~$2,400/month on generation alone.

---

## Recommended Stack

### Primary: Groq for Report Generation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Groq API | Current | LLM inference for report generation | Fastest inference (400-460 TPS for Scout), competitive pricing, OpenAI-compatible API |
| Llama 4 Scout (17Bx16E) | Latest | Primary report generation model | $0.11/M in, $0.34/M out -- 96% cheaper than GPT-4o, 460+ TPS, 128K context |
| Llama 3.3 70B Versatile | Latest | Fallback model for complex reports | $0.59/M in, $0.79/M out -- 76% cheaper than GPT-4o, higher quality ceiling |

**Why Groq over alternatives:**
- **Speed:** 400-460 tokens/second output speed for Llama 4 Scout, 0.59s time-to-first-token -- critical for streaming radiology reports. Users see text appear near-instantly.
- **Cost:** Llama 4 Scout at $0.11/$0.34 per M tokens is 96% cheaper than GPT-4o ($2.50/$10.00).
- **OpenAI-compatible API:** Drop-in replacement via AI SDK provider, minimal code changes.
- **Reliability:** Managed service, no cold starts, no GPU management.
- **Batch API:** 50% discount for non-urgent processing (batch quality checks, template suggestions).

**Confidence:** HIGH -- pricing verified from official Groq pricing page (groq.com/pricing), speed benchmarks from Artificial Analysis, April 2026.

### Secondary: Together AI as Fallback Provider

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Together AI API | Current | Fallback LLM provider | 0.28s TTFT, broad model catalog, Llama 4 Maverick available |
| Llama 4 Maverick | Latest | High-quality fallback | $0.27/M in, $0.85/M out -- GPT-4o class quality at 90% less cost |
| Llama 3.3 70B | Latest | Secondary fallback | $0.88/M in+out -- proven quality for medical text |

**Why Together AI as fallback (not primary):**
- Slightly higher latency than Groq (0.28s vs 0.20s TTFT)
- Llama 4 Maverick available -- higher quality ceiling for complex cases
- Different infrastructure = true redundancy (not just model failover)

**Confidence:** MEDIUM -- Together AI Maverick pricing verified from official page. Serverless availability for Maverick may require dedicated deployment for high throughput.

### Transcription: Groq Whisper Large v3 Turbo

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Groq Whisper Large v3 Turbo | Latest | Voice transcription | $0.04/hour -- 89% cheaper than OpenAI Whisper ($0.36/hr), 228x realtime speed |

**Why Groq Whisper over alternatives:**

| Provider | Model | Price/Hour | Speed | Medical Accuracy | Notes |
|----------|-------|-----------|-------|-----------------|-------|
| **Groq** | **Whisper v3 Turbo** | **$0.04** | **228x realtime** | **Good (Whisper base)** | **Recommended primary** |
| Groq | Distil-Whisper | $0.02 | Faster | Lower accuracy | Too low accuracy for medical terms |
| Groq | Whisper Large v3 | $0.111 | 217x realtime | Best (Whisper family) | Use if Turbo accuracy insufficient |
| OpenAI | Whisper API | $0.36 | Batch only | Good | Current baseline |
| Cloudflare | Whisper v3 Turbo | ~$0.03 | Unknown | Good (same model) | Adds another provider |
| Deepgram | Nova-3 | $0.258 (batch) | 1hr in 20s | Good general | 6x more expensive |
| AssemblyAI | Universal-3 Pro | $0.15+ | Fast | Best (Medical Mode) | Best medical accuracy |

**Decision:** Use Groq Whisper v3 Turbo as primary (same provider = one billing relationship, 228x realtime speed, $0.04/hr). Minimum billing is 10 seconds per request.

**Important caveat:** AssemblyAI has a dedicated Medical Mode with superior accuracy for clinical terminology. If transcription accuracy issues arise with medical terms (medications, procedures, anatomical terms), switch to AssemblyAI ($0.15/hr base + $0.08/hr PII redaction = $0.23/hr). Still 36% cheaper than OpenAI.

**Confidence:** HIGH -- pricing verified from official Groq pricing page, April 2026.

### Multi-Provider Routing: Vercel AI SDK + AI Gateway

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `ai` (Vercel AI SDK) | ^6.0.39 (already installed) | Unified LLM interface | Built-in gateway support, streaming, provider routing |
| `@ai-sdk/gateway` | ^1.0 | AI Gateway provider types | Provider options type definitions for routing config |
| `@ai-sdk/groq` | ^3.0 | Groq provider | Direct Groq access for transcription (not routed through gateway) |

**Critical finding: No major SDK upgrade needed.** The project already has `ai@^6.0.39` and `@ai-sdk/openai@^3.0.12`. Only new provider packages need to be added.

**Why Vercel AI Gateway:**
- Already on Vercel -- zero additional infrastructure
- OIDC authentication is automatic on deployed Vercel functions, no key management needed
- Provider routing with automatic failover and retries built in
- Zero markup on token pricing -- same cost as going direct to provider
- **HIPAA routing option:** Set `hipaaCompliant: true` to route only to BAA-signed providers (requires Vercel Pro @ $350/mo add-on)

**Authentication model (important):**

The AI Gateway acts as a proxy. The application authenticates to the gateway via OIDC, and the gateway authenticates to providers via BYOK credentials configured in the Vercel Dashboard. No provider API keys are stored in the application.

1. **OIDC (recommended -- both local and production):** Vercel automatically generates OIDC tokens associated with the project. On deployed Vercel functions, this is automatic with zero configuration. For local dev, run `vercel link` then `vercel env pull` to get the OIDC token. The token is valid for 12 hours; re-run `vercel env pull` to refresh.

2. **API Key (fallback for CI/non-Vercel environments):** Create an API key in the Vercel Dashboard (AI Gateway > API Keys), save as `AI_GATEWAY_API_KEY`. The AI SDK reads this env var automatically when a plain string model ID is used. Requires manual rotation.

**Provider keys are configured via BYOK in the Vercel Dashboard** (AI Gateway > Bring Your Own Key), NOT as application environment variables. This means Groq, Together AI, and OpenAI API keys are stored in Vercel's dashboard, not in the app. The gateway uses them transparently. If BYOK credentials fail, the gateway falls back to its own system credentials.

**Setup pattern for report generation (via gateway):**
```typescript
import { generateText } from 'ai';
import type { GatewayProviderOptions } from '@ai-sdk/gateway';

// Plain string model ID routes through AI Gateway automatically
// Auth: OIDC on Vercel (automatic), or via vercel env pull locally
const { text } = await generateText({
  model: 'groq/llama-4-scout-17b-16e-instruct',
  prompt: systemPrompt + userInput,
  providerOptions: {
    gateway: {
      // Failover: try Groq first, then Together AI, then OpenAI
      order: ['groq', 'together', 'openai'],
      // Alternative models to try if primary model fails
      models: [
        'together/llama-4-maverick',
        'openai/gpt-5.4',
      ],
    } satisfies GatewayProviderOptions,
  },
});
```

**Setup pattern for transcription (direct Groq provider):**

Transcription uses `@ai-sdk/groq` directly because audio transcription is not yet routed through the AI Gateway. The Groq API key for transcription is passed via request-scoped BYOK or configured as an env var for this specific use case only.

```typescript
import { groq } from '@ai-sdk/groq';
import { experimental_transcribe as transcribe } from 'ai';

// Transcription uses @ai-sdk/groq directly (GROQ_API_KEY env var)
// This is the only provider key needed in the app -- all LLM calls go through gateway
const result = await transcribe({
  model: groq.transcription('whisper-large-v3-turbo'),
  audio: audioFile,
});
```

**Confidence:** HIGH -- verified from official Vercel AI Gateway docs (vercel.com/docs/ai-gateway/authentication-and-byok), AI SDK docs (ai-sdk.dev), April 2026.

---

## Cost Comparison Matrix

### Report Generation (per 1M tokens)

| Provider | Model | Input $/M | Output $/M | Per-Report Cost (2K in + 1.5K out) | vs GPT-4o |
|----------|-------|-----------|------------|-------------------------------------|-----------|
| OpenAI | GPT-4o | $2.50 | $10.00 | $0.0200 | baseline |
| **Groq** | **Llama 4 Scout** | **$0.11** | **$0.34** | **$0.0007** | **-96%** |
| DeepInfra | Llama 4 Scout | $0.08 | $0.30 | $0.0006 | -97% |
| Groq | Llama 3.3 70B | $0.59 | $0.79 | $0.0024 | -88% |
| Together AI | Llama 4 Maverick | $0.27 | $0.85 | $0.0018 | -91% |
| DeepInfra | Llama 4 Maverick | $0.15 | $0.60 | $0.0012 | -94% |
| Together AI | Llama 3.3 70B | $0.88 | $0.88 | $0.0031 | -85% |
| Fireworks AI | Llama 4 Maverick | ~$0.55 blended | - | ~$0.0019 | -90% |
| Cerebras | Llama 3.1 70B | $0.60 blended | - | $0.0021 | -90% |

**Note on DeepInfra:** Cheapest per-token but lacks an official AI SDK provider package. Would require custom OpenAI-compatible client wrapper. Groq is recommended because the AI SDK has a first-party `@ai-sdk/groq` provider with full streaming and transcription support -- the integration quality is worth the marginal price premium ($0.0001/report).

### Transcription (per hour of audio)

| Provider | Model | $/Hour | vs OpenAI Whisper |
|----------|-------|--------|-------------------|
| OpenAI | Whisper API | $0.36 | baseline |
| Groq | Distil-Whisper | $0.02 | -94% |
| Cloudflare | Whisper v3 Turbo | ~$0.03 | -92% |
| **Groq** | **Whisper v3 Turbo** | **$0.04** | **-89%** |
| Groq | Whisper Large v3 | $0.111 | -69% |
| AssemblyAI | Universal-3 Pro | $0.15 | -58% |
| Deepgram | Nova-3 (batch) | $0.258 | -28% |

### Monthly Cost Projection (200 users, ~4,000 reports/day, ~2,000 transcriptions/day)

| Scenario | Reports/mo | Transcriptions/mo | Monthly Cost | Savings vs Current |
|----------|-----------|-------------------|-------------|-------------------|
| Current (GPT-4o + Whisper) | 120K | 60K (~5K hrs) | ~$4,200 | -- |
| **Recommended (Groq Scout + Groq Whisper)** | 120K | 60K (~5K hrs) | **~$284** | **-93%** |
| Fallback mix (20% Together Maverick) | 120K | 60K | ~$350 | -92% |
| Conservative (Groq 70B + Groq Whisper) | 120K | 60K | ~$488 | -88% |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| LLM Inference | Groq | DeepInfra | Marginally cheaper ($0.0006 vs $0.0007/report) but no first-party AI SDK provider; not worth custom integration for $12/mo savings |
| LLM Inference | Groq | Cerebras | Fastest raw throughput (2,500 TPS for Maverick) but limited model selection, no Llama 4 Scout pricing published, less mature ecosystem |
| LLM Inference | Groq | Cloudflare Workers AI | Opaque neuron pricing, limited model selection, no Llama 4 Maverick |
| LLM Inference | Groq | Fireworks AI | Higher pricing (~$0.55 blended vs $0.17 on Groq), no clear advantage for our use case |
| LLM Inference | Groq | Replicate | 16-60s cold starts unacceptable for interactive use, unpredictable GPU-second billing |
| LLM Fallback | Together AI | DeepInfra | Together AI has first-party AI SDK support, Maverick available, proven infrastructure |
| Transcription | Groq Whisper | Deepgram Nova-3 | 6x more expensive ($0.258/hr vs $0.04/hr) for marginal accuracy difference |
| Transcription | Groq Whisper | Cloudflare Whisper | Same price tier (~$0.03/hr), but adds another provider/billing relationship |
| Multi-provider | Vercel AI Gateway | Custom router | Gateway is free, built-in, maintained by Vercel -- no reason to build custom |

---

## What NOT to Use

### Self-Hosted Ollama/VPS -- NOT Recommended

| Reason | Detail |
|--------|--------|
| Breakeven at 5-10M tokens/month | We project ~500K tokens/month -- far below breakeven |
| Infrastructure burden | GPU VPS ($200-500/mo minimum), Kubernetes, monitoring, on-call |
| Scaling complexity | 200 concurrent users needs load balancing, multiple GPU instances |
| Idle cost waste | Variable workload = paying for 60-70% idle GPU time |
| No advantage at our scale | API providers are cheaper below 5M tokens/month |

**When to reconsider:** If monthly token volume exceeds 10M tokens AND/OR HIPAA compliance requires data sovereignty.

### GPT-4o-mini as "Cost Optimization" -- NOT Recommended

| Reason | Detail |
|--------|--------|
| Still more expensive | $0.15/$0.60 per M tokens vs Groq Scout at $0.11/$0.34 |
| Vendor lock-in | Stays in OpenAI ecosystem, no redundancy gained |
| Less capable than Llama 4 Scout | Scout outperforms on LMSYS benchmarks |

### Replicate -- NOT Recommended

| Reason | Detail |
|--------|--------|
| Cold starts | 16-60+ seconds for custom models -- unacceptable for interactive report generation |
| Unpredictable costs | GPU-second billing makes cost forecasting difficult |
| Not cost-competitive | Per-second GPU billing more expensive than per-token at our volume |

### Cloudflare Workers AI -- NOT Recommended as Primary

| Reason | Detail |
|--------|--------|
| Limited model selection | No Llama 4 Maverick, opaque neuron pricing |
| Latency concerns for large models | Edge inference fast for small models, but 70B+ have variable latency |
| No meaningful Whisper savings | $0.03/hr vs Groq $0.04/hr -- not worth adding another provider |

---

## Model Quality for Medical Text

### Key Findings

**Llama 3-70B has been validated for radiology:**
- 2026 RSNA research shows LLM-generated radiology reports with Llama-3-70B achieve Flesch reading ease scores of 44 +/- 6 (vs original reports at 17 +/- 13)
- Open-weight models show "strong potential for real-world clinical use" per published research
- Human oversight still required (already in our design -- "AI-GENERATED DRAFT" disclaimers)

**Llama 4 Scout/Maverick expected to be better:**
- Llama 4 Maverick outperforms GPT-4o on LMSYS Chatbot Arena (ELO 1417)
- MoE architecture activates only 17B parameters but draws from larger expert pool
- No specific radiology benchmarks published yet for Llama 4

**Risk mitigation strategy:**
1. Run A/B quality validation comparing Groq Llama output vs GPT-4o baseline before full cutover
2. Use OpenAI GPT-5.4 as emergency fallback via Vercel AI Gateway (model: `openai/gpt-5.4`)
3. Keep temperature at 0.2 (same as current) for deterministic medical outputs
4. Validate output structure matches existing section format (Findings, Impressions, Recommendations)

**Confidence:** MEDIUM -- Llama 3 radiology validation is HIGH confidence (published RSNA research). Llama 4 quality for medical text specifically is LOW confidence (no published medical benchmarks yet).

---

## Streaming Support

All recommended providers support SSE streaming, critical for the existing report generation UI.

| Provider | Streaming | Protocol | AI SDK Support |
|----------|-----------|----------|----------------|
| Groq | Yes | OpenAI-compatible SSE | Via AI Gateway (string model ID) or direct `@ai-sdk/groq` |
| Together AI | Yes | OpenAI-compatible SSE | Via AI Gateway |
| OpenAI (fallback) | Yes | Native SSE | Via AI Gateway (model: `openai/gpt-5.4`) |

---

## Supporting Libraries

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| `ai` | ^6.0.39 | Vercel AI SDK with gateway support | Already installed |
| `@ai-sdk/openai` | ^3.0.12 | OpenAI provider (can be removed -- gateway handles OpenAI routing) | Already installed, optional now |
| `@ai-sdk/gateway` | ^1.0 | Gateway provider options types for routing config | **NEW -- install** |
| `@ai-sdk/groq` | ^3.0 | Groq provider for direct transcription access | **NEW -- install** |
| `zod` | ^3.23 | Schema validation for model outputs | Already installed |
| `p-retry` | ^6.2 | Retry with exponential backoff for transcription calls | **NEW -- install** |

**Only 3 new packages needed.** No framework upgrades, no infrastructure changes to existing stack.

---

## Infrastructure Changes

### What Changes

| Component | Current | New | Migration Effort |
|-----------|---------|-----|-----------------|
| LLM Provider | OpenAI GPT-4o (direct via `@ai-sdk/openai`) | Groq Llama 4 Scout via AI Gateway | Low -- swap model string, adjust prompts |
| Transcription | OpenAI Whisper (direct) | Groq Whisper v3 Turbo via `@ai-sdk/groq` | Low -- same Whisper model family |
| Provider routing | Single provider (OpenAI) | AI Gateway with failover chain | Medium -- new provider config + BYOK dashboard setup |
| Auth model | Direct provider API keys in `.env.local` | OIDC via `vercel env pull` (auto on Vercel) + BYOK in dashboard for provider keys | Medium -- new auth pattern, removes provider keys from app |
| Cost monitoring | None | AI Gateway dashboards + custom Supabase tracking | Medium -- new feature |

### What Does NOT Change

- Next.js 14 App Router architecture
- Supabase PostgreSQL with RLS
- Stripe billing (subscriptions + credits)
- Upstash Redis rate limiting (Phase 30 infrastructure)
- SSE streaming to frontend (all providers support it)
- Edge runtime for AI routes
- Report generation system prompts (prompt content stays, model changes)
- PDF/DOCX export pipeline
- Frontend components (model swap is entirely backend)

---

## Scaling to 200 Concurrent Users

### Provider Rate Limits

| Provider | Free Tier | Paid Tier | Sufficient for 200 users? |
|----------|-----------|-----------|--------------------------|
| Groq (Scout) | 30 RPM, 1K RPD, 30K TPM | ~10x higher (contact sales for exact limits) | Need paid (Developer) tier |
| Groq (Whisper) | 20 RPM, 2K RPD | Higher on Developer tier | Need paid tier |
| Together AI | Varies by model | 600 RPM | Yes for fallback role |
| OpenAI | Varies by tier | Tier 3+ recommended | Yes (emergency fallback only) |

### Architecture for Scale

The existing Upstash Redis rate limiting (Phase 30) handles user-level throttling. For provider-level capacity:

1. **Request queuing:** Use existing Redis to queue requests when approaching provider rate limits
2. **Provider rotation:** AI Gateway automatically retries with next provider on failure
3. **Backpressure:** Return 429 to users when all providers saturated (existing rate limit infrastructure)
4. **Concurrent request pooling:** Limit to ~50 concurrent LLM requests across all users (most users idle at any moment)

**Confidence:** MEDIUM -- Groq Developer tier rate limits not fully documented publicly. Contact Groq sales for 200-user concurrent guarantee. Together AI 600 RPM is sufficient for fallback.

---

## Environment Variables

All LLM provider keys (Groq, Together AI, OpenAI) are configured in the **Vercel Dashboard via BYOK** -- they are NOT application environment variables. The gateway handles provider authentication transparently.

```bash
# Application env vars (.env.local)
GROQ_API_KEY=gsk_...                    # Only needed for direct transcription calls via @ai-sdk/groq

# Vercel Dashboard BYOK configuration (NOT in .env.local -- configure in dashboard)
# Vercel Dashboard > AI Gateway > Bring Your Own Key:
# - Groq API key (for gateway-routed LLM calls)
# - Together AI API key (for gateway-routed fallback calls)
# - OpenAI API key (for gateway-routed emergency fallback via openai/gpt-5.4)
```

**Local development auth setup (OIDC -- recommended):**
```bash
# Step 1: Link local project to Vercel (one-time)
vercel link

# Step 2: Pull OIDC token + env vars (repeat every 12 hours)
vercel env pull

# That's it. The AI SDK automatically uses the OIDC token from the pulled env.
# No AI_GATEWAY_API_KEY needed when using OIDC.
```

**Alternative for CI/non-Vercel environments:**
```bash
# Create key at: Vercel Dashboard > AI Gateway > API Keys
# Set in CI environment:
AI_GATEWAY_API_KEY=aigw_...
```

---

## Installation

```bash
# New provider packages (3 packages)
pnpm install @ai-sdk/gateway @ai-sdk/groq p-retry

# No upgrades needed -- ai@^6.0.39 and @ai-sdk/openai@^3.0.12 already installed
```

---

## HIPAA Compliance Path (Future)

The Vercel AI Gateway supports HIPAA-compliant routing (`hipaaCompliant: true`), which restricts requests to providers with signed BAAs. This requires:

1. Vercel Pro plan with HIPAA add-on ($350/mo)
2. When `hipaaCompliant: true`, BYOK credentials are skipped -- only Vercel system credentials with BAA-signed providers are used
3. Only providers with Vercel BAAs are eligible

This is out-of-scope for v3.0 but represents a clean upgrade path when HIPAA compliance is required, without changing the application architecture.

---

## Sources

### Official Documentation (HIGH confidence)
- [Groq Pricing](https://groq.com/pricing) -- verified 2026-04-05
- [Groq Rate Limits](https://console.groq.com/docs/rate-limits) -- verified 2026-04-05
- [Groq Whisper v3 Turbo Blog](https://groq.com/blog/whisper-large-v3-turbo-now-available-on-groq-combining-speed-quality-for-speech-recognition) -- verified 2026-04-05
- [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) -- verified 2026-04-05
- [Vercel AI Gateway Authentication](https://vercel.com/docs/ai-gateway/authentication-and-byok/authentication) -- verified 2026-04-05
- [Vercel AI Gateway BYOK](https://vercel.com/docs/ai-gateway/authentication-and-byok/byok) -- verified 2026-04-05
- [AI SDK Gateway Provider](https://ai-sdk.dev/providers/ai-sdk-providers/ai-gateway) -- verified 2026-04-05
- [AI SDK Groq Provider](https://ai-sdk.dev/providers/ai-sdk-providers/groq) -- verified 2026-04-05
- [Together AI Pricing](https://www.together.ai/pricing) -- verified 2026-04-05
- [DeepInfra Pricing](https://deepinfra.com/pricing) -- verified 2026-04-05
- [Cerebras Pricing](https://www.cerebras.ai/pricing) -- verified 2026-04-05
- [Fireworks AI Pricing](https://fireworks.ai/pricing) -- verified 2026-04-05
- [Deepgram Pricing](https://deepgram.com/pricing) -- verified 2026-04-05
- [AssemblyAI Pricing](https://www.assemblyai.com/pricing) -- verified 2026-04-05
- [OpenAI Pricing](https://developers.openai.com/api/docs/pricing) -- verified 2026-04-05
- [Vercel HIPAA Compliance](https://vercel.com/kb/guide/hipaa-compliance-guide-vercel) -- verified 2026-04-05
- [@ai-sdk/gateway npm](https://www.npmjs.com/package/@ai-sdk/gateway) -- verified 2026-04-05
- [@ai-sdk/groq npm](https://www.npmjs.com/package/@ai-sdk/groq) -- v3.0.24, verified 2026-04-05

### Research and Benchmarks (MEDIUM confidence)
- [RSNA 2026: LLMs as Radiology Proofreaders](https://www.rsna.org/news/2026/february/llms-act-as-radiology-proofreaders) -- Llama-3-70B radiology validation
- [Artificial Analysis: Llama 4 Scout Providers](https://artificialanalysis.ai/models/llama-4-scout/providers) -- latency/speed benchmarks
- [Artificial Analysis: Llama 4 Maverick Providers](https://artificialanalysis.ai/models/llama-4-maverick/providers) -- latency benchmarks
- [Llama 4 Maverick Benchmarks](https://llm-stats.com/models/llama-4-maverick) -- ELO scores
- [LLM API Pricing Comparison 2026](https://featherless.ai/blog/llm-api-pricing-comparison-2026-complete-guide-inference-costs) -- cross-provider pricing

### Community/Analysis (LOW confidence -- needs validation)
- [Self-Hosted LLM Cost Guide 2026](https://blog.premai.io/self-hosted-llm-guide-setup-tools-cost-comparison-2026/) -- breakeven analysis
- [Groq API Free Tier Limits 2026](https://www.grizzlypeaksoftware.com/articles/p/groq-api-free-tier-limits-in-2026-what-you-actually-get-uwysd6mb) -- rate limit details

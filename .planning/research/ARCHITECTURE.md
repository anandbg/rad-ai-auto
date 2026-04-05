# Architecture Patterns: Cost-Optimized AI Provider Integration

**Domain:** AI radiology report generation -- provider migration and abstraction
**Researched:** 2026-04-05
**Confidence:** HIGH (core abstraction layer); MEDIUM (specific provider compatibility)

## Recommended Architecture

### Overview: Provider Abstraction Layer via AI SDK Registry

The existing codebase has three AI routes that directly import `openai` from `@ai-sdk/openai`. The migration architecture introduces a **provider registry** that sits between the route handlers and the AI providers, enabling hot-swappable model selection without modifying any route code.

```
Request Flow (current):
  Client -> Route Handler -> Protection Stack -> openai('gpt-4o') -> SSE Stream

Request Flow (target):
  Client -> Route Handler -> Protection Stack -> Provider Registry -> Provider Adapter -> SSE Stream
                                                      |
                                                 Config/Env selects provider
```

### Component Boundaries

| Component | Responsibility | Status | Communicates With |
|-----------|---------------|--------|-------------------|
| `lib/ai/registry.ts` | Provider registry setup, model resolution | **NEW** | Route handlers, provider configs |
| `lib/ai/providers/*.ts` | Provider-specific configuration (OpenAI-compatible for CF/Together, OpenAI fallback) | **NEW** | Registry, env vars |
| `lib/ai/models.ts` | Model ID constants and quality tier mapping | **NEW** | Registry, config |
| `lib/ai/transcription.ts` | Transcription provider abstraction (Deepgram via AI SDK, CF Workers AI via REST, OpenAI Whisper fallback) | **NEW** | Transcribe route |
| `lib/ai/fallback.ts` | Multi-provider fallback chain with health checks | **NEW** | Registry, routes |
| `lib/ai/cache.ts` | Response caching layer (hash-based for identical prompts) | **NEW** | Template generate route, Redis client |
| `lib/cost/tracker.ts` | Cost tracking per provider (update cost-per-unit map) | **MODIFY** | Cost ceiling, admin dashboard |
| `lib/cost/ceiling.ts` | Daily cost ceiling (update thresholds for cheaper providers) | **MODIFY** | All AI routes |
| `lib/ratelimit/limiters.ts` | Rate limiters (increase limits for 200 users) | **MODIFY** | All AI routes |
| `app/api/generate/route.ts` | Report generation (replace direct `openai()` with registry lookup) | **MODIFY** | Registry, protection stack |
| `app/api/transcribe/route.ts` | Transcription (replace direct OpenAI fetch with abstraction) | **MODIFY** | Transcription provider, protection stack |
| `app/api/templates/generate/route.ts` | Template gen (replace direct `openai()` with registry lookup) | **MODIFY** | Registry, protection stack |

### Data Flow: Text Generation (Post-Migration)

```
1. Client POSTs to /api/generate
2. Route handler runs protection stack (unchanged):
   a. Auth check (Supabase)
   b. Rate limit check (Upstash Redis, sliding window)
   c. Cost ceiling check (daily budget, updated for new pricing)
   d. Abuse detection (hourly patterns)
   e. Monthly usage limit
3. Route handler calls registry.languageModel(getModelId('generate'))
   - getModelId() reads from env: AI_GENERATE_MODEL="together:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8"
   - Falls back to: AI_GENERATE_FALLBACK="openai:gpt-4o"
4. streamText({ model, system, prompt, temperature: 0.2 }) -- unchanged API
5. On provider error -> fallback chain tries next provider
6. trackCost() updated with provider-specific cost-per-unit
7. SSE stream returned to client (unchanged wire format)
```

### Data Flow: Transcription (Post-Migration)

```
1. Client POSTs FormData to /api/transcribe
2. Protection stack runs (unchanged)
3. Transcription abstraction layer:
   a. Primary: Deepgram Nova-3 ($0.0043/min) via @ai-sdk/deepgram + experimental_transcribe
   b. Secondary: Cloudflare Workers AI whisper-large-v3-turbo ($0.00051/min) via REST API
   c. Fallback: OpenAI Whisper ($0.006/min) via current code path
4. Audio handling varies by provider:
   - Deepgram: accepts raw audio Buffer via AI SDK transcribe()
   - CF Workers AI: requires base64-encoded audio via REST (NOT OpenAI-compatible endpoint)
   - OpenAI: accepts FormData (current pattern, unchanged)
5. Response normalized to { text: string } regardless of provider
6. trackCost() updated with provider-specific rate
7. JSON response returned (unchanged format)
```

## Patterns to Follow

### Pattern 1: Provider Registry (Central Model Resolution)

**What:** Single registry file that configures all AI providers and exposes them via string IDs.
**When:** Always. This is the core abstraction enabling provider swaps.
**Confidence:** HIGH -- `createProviderRegistry` is a stable AI SDK 6 API, verified in `node_modules/ai/docs/`.

```typescript
// lib/ai/registry.ts
import { createProviderRegistry } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

// Together AI via OpenAI-compatible endpoint (safer than @ai-sdk/togetherai)
// See PITFALL: @ai-sdk/togetherai v2/v3 compatibility issue
const togetherAI = createOpenAICompatible({
  name: 'together',
  apiKey: process.env.TOGETHER_API_KEY!,
  baseURL: 'https://api.together.xyz/v1',
});

// Cloudflare Workers AI via OpenAI-compatible endpoint (text generation only)
const cloudflareAI = createOpenAICompatible({
  name: 'cloudflare',
  apiKey: process.env.CLOUDFLARE_API_TOKEN!,
  baseURL: `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/v1`,
});

export const registry = createProviderRegistry({
  openai: createOpenAI({ apiKey: process.env.OPENAI_API_KEY }),
  together: togetherAI,
  cloudflare: cloudflareAI,
});

// Model resolution from environment
export function getModel(purpose: 'generate' | 'template') {
  const envKey = purpose === 'generate' ? 'AI_GENERATE_MODEL' : 'AI_TEMPLATE_MODEL';
  const modelId = process.env[envKey] || 'openai:gpt-4o'; // safe default
  return registry.languageModel(modelId);
}
```

**Critical note on Together AI provider:** Use `@ai-sdk/openai-compatible` with `baseURL: 'https://api.together.xyz/v1'` instead of `@ai-sdk/togetherai`. The `@ai-sdk/togetherai` package is at version 2.0.41 and has known v2/v3 specification compatibility issues with AI SDK v6. The OpenAI-compatible approach works because Together AI's API is fully OpenAI-compatible. **Confidence: HIGH** -- Together AI officially documents OpenAI compatibility at `https://docs.together.ai/docs/openai-api-compatibility`.

**Integration point:** Route handlers replace `openai('gpt-4o')` with `getModel('generate')`. The `streamText()` and `generateText()` calls remain identical because the AI SDK's unified interface means the model object is interchangeable.

### Pattern 2: Transcription Provider Abstraction (Non-Registry)

**What:** Transcription uses a separate abstraction because the AI SDK `experimental_transcribe` function has a different interface than the text generation models. It does NOT use the provider registry.
**When:** Always for `/api/transcribe`.
**Confidence:** MEDIUM -- `experimental_transcribe` is still prefixed "experimental" in AI SDK 6.0.39.

```typescript
// lib/ai/transcription.ts
import { experimental_transcribe as transcribe } from 'ai';
import { deepgram } from '@ai-sdk/deepgram';

type TranscriptionProvider = 'deepgram' | 'cloudflare' | 'openai';

export async function transcribeAudio(
  audioBuffer: Buffer,
  fileName: string,
  provider?: TranscriptionProvider,
): Promise<{ text: string }> {
  const activeProvider = provider || process.env.AI_TRANSCRIPTION_PROVIDER || 'deepgram';

  switch (activeProvider) {
    case 'deepgram': {
      // Uses AI SDK experimental_transcribe with @ai-sdk/deepgram
      const result = await transcribe({
        model: deepgram.transcription('nova-3'),
        audio: audioBuffer,
        providerOptions: {
          deepgram: { punctuate: true, smartFormat: true },
        },
      });
      return { text: result.text };
    }

    case 'cloudflare': {
      // Direct REST API call -- CF Whisper requires base64-encoded audio
      const base64Audio = audioBuffer.toString('base64');
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/openai/whisper-large-v3-turbo`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ audio: base64Audio }),
        }
      );
      const data = await response.json();
      return { text: data.result.text };
    }

    case 'openai': {
      // Current pattern preserved as fallback
      const formData = new FormData();
      formData.append('model', 'whisper-1');
      formData.append('file', new Blob([audioBuffer]), fileName);
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        body: formData,
      });
      const data = await response.json();
      return { text: data.text };
    }
  }
}
```

**Key design decision:** Transcription cannot use `createProviderRegistry` because transcription models are not language models. The AI SDK provides `experimental_transcribe` as a separate function. CF Workers AI Whisper does NOT support the OpenAI-compatible chat endpoint for audio -- it requires a direct REST call with base64 audio.

### Pattern 3: Fallback Chain with Health Monitoring

**What:** Try primary provider, fall back to secondary on failure, track provider health.
**When:** Production deployment to maintain uptime when cheaper providers have outages.

```typescript
// lib/ai/fallback.ts
export async function withProviderFallback<T>(
  primary: () => Promise<T>,
  fallbacks: Array<{ name: string; fn: () => Promise<T> }>,
  operationName: string,
): Promise<T> {
  try {
    return await primary();
  } catch (error) {
    for (const fallback of fallbacks) {
      try {
        console.warn(`[${operationName}] Primary failed, trying ${fallback.name}`);
        return await fallback.fn();
      } catch { continue; }
    }
    throw error; // All providers failed
  }
}
```

**Integration point:** Wraps the existing `withStreamRetry()` / `withRetry()` calls. The retry logic handles transient errors within a single provider; the fallback chain handles provider-level failures.

### Pattern 4: Environment-Driven Model Selection

**What:** Model IDs stored in environment variables, not hardcoded in route files.
**When:** Always. Enables swapping models without code changes or redeployment (via Vercel env vars).

```
# .env.local
AI_GENERATE_MODEL=together:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8
AI_GENERATE_FALLBACK=openai:gpt-4o
AI_TEMPLATE_MODEL=together:mistralai/Mistral-Small-3.1-24B-Instruct-2503
AI_TEMPLATE_FALLBACK=openai:gpt-4o
AI_TRANSCRIPTION_PROVIDER=deepgram  # or 'cloudflare' or 'openai'
AI_TRANSCRIPTION_FALLBACK=openai
```

**Integration point:** Read in `lib/ai/registry.ts` and `lib/ai/transcription.ts`. No route handler changes needed when swapping models.

### Pattern 5: Hash-Based Response Caching

**What:** Cache LLM responses for identical prompts using content-addressed hashing in Upstash Redis.
**When:** Template generation (high cache hit rate -- same modality+bodyPart combos). NOT for report generation (findings are unique per patient).

```typescript
// lib/ai/cache.ts
import { redis } from '@/lib/ratelimit/client';

const CACHE_TTL = 86400; // 24 hours

export async function getCachedOrGenerate<T>(
  cacheKey: string,
  generator: () => Promise<T>,
): Promise<T> {
  if (!redis) return generator();

  const cached = await redis.get(`cache:ai:${cacheKey}`);
  if (cached) return JSON.parse(cached as string) as T;

  const result = await generator();
  await redis.set(`cache:ai:${cacheKey}`, JSON.stringify(result), { ex: CACHE_TTL });
  return result;
}
```

**Why not semantic caching:** For this use case, exact-match caching on the template generation inputs (modality + bodyPart + description) is sufficient. Semantic caching adds embedding computation latency that outweighs benefits for a 200-user app.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Using @ai-sdk/togetherai Directly

**What people do:** Install `@ai-sdk/togetherai` and import `togetherai` provider.
**Why it's wrong:** As of April 2026, `@ai-sdk/togetherai` is at v2.0.41 and has documented v2/v3 specification compatibility issues with AI SDK v6 (see GitHub issue #11780). Using it risks runtime errors like "Unsupported model version v3".
**Do this instead:** Use `@ai-sdk/openai-compatible` with `baseURL: 'https://api.together.xyz/v1'`. Together AI is fully OpenAI-compatible, so this works without any provider-specific package.

### Anti-Pattern 2: Provider-Specific Code in Route Handlers

**What people do:** Putting `if (provider === 'cloudflare') { ... } else if (provider === 'together') { ... }` in route files.
**Why it's wrong:** Defeats the purpose of the AI SDK's unified interface. Every new provider requires touching every route.
**Do this instead:** Use the provider registry. The AI SDK's `streamText()` and `generateText()` accept any `LanguageModel` object regardless of provider.

### Anti-Pattern 3: Using OpenAI-Compatible Endpoint for CF Whisper Transcription

**What people do:** Try to call CF Workers AI Whisper through the `/v1/audio/transcriptions` OpenAI-compatible endpoint.
**Why it's wrong:** Cloudflare's OpenAI-compatible endpoints only support `/v1/chat/completions` and `/v1/embeddings`. Whisper requires the direct Workers AI REST endpoint (`/ai/run/@cf/openai/whisper-large-v3-turbo`) with base64-encoded audio input, NOT FormData.
**Do this instead:** Call the Workers AI REST API directly with base64-encoded audio, or use Deepgram via the AI SDK `experimental_transcribe` function.

### Anti-Pattern 4: Removing the Protection Stack for "Cheaper" Providers

**What people do:** Disabling rate limiting or cost ceilings because "it's nearly free now."
**Why it's wrong:** Protection stack guards against abuse, not just cost. Even at $0.027/M tokens, a bot sending 10K requests/hour burns budget and degrades service.
**Do this instead:** Keep the full protection stack. Adjust cost ceiling thresholds downward (from $20/day to $3-5/day since costs drop ~80%).

### Anti-Pattern 5: Streaming Transcription Responses

**What people do:** Trying to stream transcription results like text generation.
**Why it's wrong:** Transcription APIs (Whisper, Deepgram batch) return complete text after processing. Streaming is only relevant for real-time/live transcription which is a different API and architecture.
**Do this instead:** Keep transcription as request-response (current pattern). The Node.js runtime with 120s timeout is correct.

## Runtime Considerations: Edge vs Node.js

### Current Runtime Assignment (Keep)

| Route | Runtime | Reason | Post-Migration Notes |
|-------|---------|--------|---------------------|
| `/api/generate` | Edge | Streaming SSE requires low-latency connection setup | `@ai-sdk/openai-compatible` uses Fetch API internally, Edge-compatible |
| `/api/templates/generate` | Edge | Low-latency structured output generation | Same as above |
| `/api/transcribe` | Node.js | FormData file parsing, Buffer manipulation for base64 | CF Whisper needs `Buffer.toString('base64')` -- Node.js only |

**No runtime change needed.** The `@ai-sdk/openai-compatible` package uses the Fetch API internally, making it Edge-compatible. The transcription route stays on Node.js because both Deepgram (needs audio Buffer) and CF Workers AI (needs base64 conversion) require Node.js Buffer APIs.

**Latency consideration for Cloudflare Workers AI from Vercel Edge:** When a Vercel Edge function calls the CF Workers AI REST API, the request traverses the public internet between Vercel's and Cloudflare's networks. Expect 50-150ms additional first-byte latency compared to OpenAI. For streaming responses, this latency only affects the first byte; subsequent chunks stream at wire speed. Acceptable for report generation (users wait 3-10s for a full report).

### Vercel Function Timeout Compatibility

| Provider | Expected Latency (generate) | Expected Latency (transcribe) | Within Timeout? |
|----------|-----------------------------|-------------------------------|-----------------|
| Together AI | 2-8s first byte, 5-15s total | N/A (text only) | Yes (30s edge) |
| CF Workers AI | 3-10s first byte, 8-20s total | 5-30s for 10min audio | Yes (30s edge / 120s node) |
| Deepgram | N/A (transcription only) | 2-10s for 10min audio | Yes (120s node) |
| OpenAI (fallback) | 1-5s first byte, 3-10s total | 5-30s for 10min audio | Yes (both) |

## Scaling to 200 Concurrent Users

### Rate Limit Adjustments

Per-user limits stay the same -- the scaling challenge is **global throughput**, not per-user rates:

| Tier | Generate/min | Transcribe/min | Template/min |
|------|-------------|---------------|-------------|
| free | 5 | 3 | 3 |
| plus | 30 | 15 | 10 |
| pro | 60 | 30 | 20 |

### Infrastructure Bottleneck Analysis

1. **Upstash Redis throughput** -- Sliding window algorithm makes 2 Redis calls per rate limit check. At 200 concurrent users, peak ~400 Redis ops/sec. Upstash free tier handles 10K commands/day; **paid tier required** (~$10/mo for 100K commands/day).

2. **Vercel function concurrency** -- Edge functions have no concurrency limit on Pro plan. Node.js functions default to 1000 concurrent executions. Both sufficient for 200 users.

3. **Provider rate limits** -- Together AI serverless: no published rate limit for paid accounts. Cloudflare Workers AI REST: 100K/day free, unlimited paid. OpenAI: 10K RPM on Tier 3+. Deepgram: 100 concurrent requests on Growth plan.

### Connection Pooling

**Not needed.** AI provider calls use HTTP/2 (managed by SDKs). Supabase uses PgBouncer pooling (already configured). Upstash Redis uses REST API (stateless). No persistent connections to manage.

## Suggested Build Order (Dependencies)

The following order minimizes risk by maintaining the existing OpenAI path as fallback at every step:

### Phase 1: Provider Abstraction Layer (no behavior change)
1. Install `@ai-sdk/openai-compatible` (required for Together AI and CF Workers AI)
2. Create `lib/ai/registry.ts` -- Registry with OpenAI as the only provider initially
3. Create `lib/ai/models.ts` -- Define model constants, read from env with OpenAI defaults
4. Modify 3 route handlers to use `getModel()` instead of `openai('gpt-4o')`
5. **Verify:** All routes work identically with OpenAI (regression test)

**Dependencies:** None. Pure refactoring.

### Phase 2: Add Alternative Text Generation Providers
6. Add Together AI to registry via `createOpenAICompatible` (NOT `@ai-sdk/togetherai`)
7. Add Cloudflare Workers AI to registry via `createOpenAICompatible`
8. Create `lib/ai/fallback.ts` -- Implement provider fallback chain
9. Set env vars to point at Together AI, with OpenAI fallback
10. **Verify:** Quality validation -- compare outputs against GPT-4o baseline

**Dependencies:** Phase 1 complete.

### Phase 3: Transcription Provider Migration
11. Install `@ai-sdk/deepgram`
12. Create `lib/ai/transcription.ts` -- Abstraction layer for transcription
13. Implement Deepgram Nova-3 via `experimental_transcribe` from AI SDK
14. Implement CF Workers AI whisper-large-v3-turbo via direct REST API (base64 audio)
15. Modify `/api/transcribe/route.ts` to use abstraction with existing OpenAI as fallback
16. **Verify:** Transcription quality comparison across providers

**Dependencies:** Phase 1 complete (independent of Phase 2).

### Phase 4: Cost Tracking and Ceiling Updates
17. Modify `lib/cost/tracker.ts` -- Provider-aware cost tracking (different $/unit per provider)
   - Current `COST_ESTIMATES` hardcoded for OpenAI; needs provider-specific rates
   - `trackCost()` signature needs a `provider` parameter or auto-detection
18. Modify `lib/cost/ceiling.ts` -- Lower daily ceiling ($20 -> $3-5 with cheaper providers)
   - `OPENAI_DAILY_COST_CEILING` env var name should be renamed to `AI_DAILY_COST_CEILING`
19. Add cost monitoring dashboard data (cost per provider, per endpoint)
20. **Verify:** Cost tracking accurately reflects new provider pricing

**Dependencies:** Phases 2 and 3 complete.

### Phase 5: Caching and Scale Optimization
21. Create `lib/ai/cache.ts` -- Hash-based caching for template generation
22. Evaluate Upstash Redis plan upgrade for 200 concurrent users
23. Load testing at 200 concurrent users
24. **Verify:** Cache hit rates, response times under load

**Dependencies:** Phase 4 complete. Caching is optimization, not correctness.

## Integration Points with Existing Code

### Files Modified (Minimal Changes)

| File | Change | Risk |
|------|--------|------|
| `app/api/generate/route.ts` | Replace `openai('gpt-4o')` with `getModel('generate')`, remove `@ai-sdk/openai` import | LOW -- single line change |
| `app/api/templates/generate/route.ts` | Replace `openai('gpt-4o')` with `getModel('template')`, remove `@ai-sdk/openai` import | LOW -- single line change |
| `app/api/transcribe/route.ts` | Replace OpenAI fetch block (~20 lines) with `transcribeAudio()` call | MEDIUM -- larger code change |
| `lib/cost/tracker.ts` | Add provider-specific cost rates, modify `trackCost()` to accept provider param | LOW -- additive |
| `lib/cost/ceiling.ts` | Adjust ceiling thresholds | LOW -- config change |
| `lib/openai/errors.ts` | May need updates for non-OpenAI error formats from Together AI / CF | LOW -- additive |
| `package.json` | Add `@ai-sdk/openai-compatible`, `@ai-sdk/deepgram` | LOW |

### Files Created (New)

| File | Purpose | Size Estimate |
|------|---------|---------------|
| `lib/ai/registry.ts` | Provider registry setup with OpenAI-compatible providers | ~40 lines |
| `lib/ai/models.ts` | Model ID constants, env-based resolution, quality tiers | ~30 lines |
| `lib/ai/fallback.ts` | Provider fallback chain | ~40 lines |
| `lib/ai/transcription.ts` | Transcription provider abstraction (Deepgram, CF, OpenAI) | ~80 lines |
| `lib/ai/cache.ts` | Response caching for template generation | ~30 lines |

### Files NOT Modified

| File | Why Unchanged |
|------|--------------|
| `lib/ratelimit/limiters.ts` | Per-user limits stay the same; scaling handled by provider capacity |
| `lib/ratelimit/client.ts` | Redis client unchanged |
| `lib/abuse/detector.ts` | Abuse patterns are provider-agnostic |
| `lib/abuse/alerts.ts` | Alert system is provider-agnostic |
| `lib/usage/limits.ts` | Monthly usage limits are provider-agnostic |
| `lib/usage/tracker.ts` | Usage tracking is provider-agnostic |
| `lib/openai/retry.ts` | Retry logic works with any provider's errors (uses generic error parsing) |

## New Package Dependencies

| Package | Version | Purpose | Edge Compatible |
|---------|---------|---------|-----------------|
| `@ai-sdk/openai-compatible` | latest | Together AI + CF Workers AI text generation | YES |
| `@ai-sdk/deepgram` | latest | Deepgram transcription via AI SDK | YES (Node.js only for audio Buffer) |

**NOT installing:**
- `@ai-sdk/togetherai` -- v2/v3 spec incompatibility with AI SDK v6 (use `@ai-sdk/openai-compatible` instead)
- `together-ai` -- separate SDK, unnecessary when OpenAI-compatible endpoint works
- `@deepgram/sdk` -- not needed; `@ai-sdk/deepgram` wraps it with AI SDK interface

## Scalability Considerations

| Concern | At 75 users (current) | At 200 users (target) | At 1000 users (future) |
|---------|----------------------|----------------------|----------------------|
| Provider throughput | OpenAI handles easily | Together AI + CF both handle easily | May need dedicated inference |
| Redis operations | Free tier sufficient | Paid tier needed (~$10/mo) | Still fine on paid tier |
| Vercel function concurrency | Well within limits | Well within limits | May need Enterprise |
| Cost per request | ~$0.01-0.03 (GPT-4o) | ~$0.001-0.003 (Together/CF) | Same per-request |
| Monthly AI cost | ~$300-600 | ~$30-60 (90% reduction) | ~$150-300 |
| Fallback cost buffer | N/A | OpenAI fallback at ~10x cost | Need budget alerts |

## Sources

- [AI SDK Provider Registry](https://ai-sdk.dev/docs/reference/ai-sdk-core/provider-registry) -- HIGH confidence (verified in node_modules/ai/docs/)
- [AI SDK Provider Management](https://ai-sdk.dev/docs/ai-sdk-core/provider-management) -- HIGH confidence (verified in node_modules/ai/docs/)
- [AI SDK OpenAI-Compatible Providers](https://ai-sdk.dev/providers/openai-compatible-providers) -- HIGH confidence
- [Together AI OpenAI Compatibility](https://docs.together.ai/docs/openai-api-compatibility) -- HIGH confidence (base URL: `https://api.together.xyz/v1`)
- [Cloudflare Workers AI Whisper](https://developers.cloudflare.com/workers-ai/models/whisper-large-v3-turbo/) -- HIGH confidence ($0.00051/min, base64 audio input)
- [Cloudflare Workers AI OpenAI Compatibility](https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/) -- HIGH confidence (chat + embeddings only)
- [Deepgram Provider for AI SDK](https://ai-sdk.dev/providers/ai-sdk-providers/deepgram) -- HIGH confidence (transcription via experimental_transcribe)
- [@ai-sdk/togetherai v3 spec issue](https://github.com/vercel/ai/issues/11780) -- HIGH confidence (v2.0.41 still at v2 spec, incompatible with AI SDK v6)
- [Together AI Pricing](https://www.together.ai/pricing) -- MEDIUM confidence (prices change frequently)

---

*Architecture research: 2026-04-05*

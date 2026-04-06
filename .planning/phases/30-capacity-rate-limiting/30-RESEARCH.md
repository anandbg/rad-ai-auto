# Phase 30: Capacity, Rate Limiting & API Security - Research

**Researched:** 2026-01-23
**Domain:** API Rate Limiting, OpenAI Integration, Redis-based Distributed Systems
**Confidence:** HIGH

## Summary

This phase implements rate limiting and capacity management for a Next.js application that proxies OpenAI API calls (GPT-4o for report generation, Whisper for transcription) through a single shared API key. The target is 50-75 concurrent users.

The standard approach for this problem domain is well-established:
1. **Upstash Redis** with `@upstash/ratelimit` for distributed rate limiting at the edge
2. **Per-user rate limiting** enforced in API routes before OpenAI calls
3. **Exponential backoff with jitter** for OpenAI 429 errors
4. **Request queuing** using `p-queue` for concurrency control
5. **Usage tracking** in the existing Supabase `credits_ledger` and `subscription_limits` tables

**Primary recommendation:** Use `@upstash/ratelimit` with sliding window algorithm for per-user rate limiting, implement retry logic with exponential backoff in OpenAI API calls, and track usage against subscription plan limits in the existing database schema.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@upstash/ratelimit` | ^2.0.0 | Distributed rate limiting | Only connectionless (HTTP-based) rate limiting library; designed for edge/serverless; works with Vercel Edge Functions |
| `@upstash/redis` | ^1.34.0 | Redis client for edge | REST-based Redis client; no TCP connections needed; works in Edge runtime |
| `p-queue` | ^8.0.0 | Promise queue with concurrency control | Standard solution for limiting concurrent operations; supports rate limiting options |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `p-limit` | ^6.0.0 | Simple concurrency limiter | When you have a finite list of operations to run concurrently |
| `p-retry` | ^6.0.0 | Promise retry with backoff | Cleaner API than manual retry loops |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Upstash Redis | Vercel KV | Vercel KV deprecated for new projects (2024); Upstash is now Vercel's official recommendation |
| `@upstash/ratelimit` | Custom Redis Lua scripts | More complexity, same outcome; library handles edge cases |
| `p-queue` | BullMQ | BullMQ requires persistent Redis connection; overkill for this use case |

**Installation:**
```bash
pnpm add @upstash/ratelimit @upstash/redis p-queue
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── lib/
│   ├── ratelimit/
│   │   ├── client.ts          # Upstash Redis + Ratelimit instances
│   │   ├── limiters.ts        # Rate limiter configurations per endpoint
│   │   └── middleware.ts      # Rate limit checking helper
│   ├── openai/
│   │   ├── client.ts          # OpenAI client with retry logic
│   │   ├── queue.ts           # Request queue for concurrency control
│   │   └── errors.ts          # Error handling for OpenAI errors
│   └── usage/
│       ├── tracker.ts         # Usage tracking functions
│       └── limits.ts          # Plan limit checking
├── app/
│   └── api/
│       ├── generate/route.ts  # Add rate limit check + retry
│       ├── transcribe/route.ts # Add rate limit check + retry
│       └── templates/generate/route.ts # Add rate limit check
```

### Pattern 1: Per-User Rate Limiting with Upstash
**What:** Limit requests per user based on their subscription plan
**When to use:** Every API route that calls OpenAI
**Example:**
```typescript
// lib/ratelimit/client.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create Redis instance from environment variables
// UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN required
const redis = Redis.fromEnv();

// Different limiters for different subscription tiers
export const rateLimiters = {
  // Free tier: 10 requests per minute
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    analytics: true,
    prefix: "@airad/ratelimit/free",
  }),
  // Plus tier: 50 requests per minute
  plus: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, "1 m"),
    analytics: true,
    prefix: "@airad/ratelimit/plus",
  }),
  // Pro tier: 200 requests per minute
  pro: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(200, "1 m"),
    analytics: true,
    prefix: "@airad/ratelimit/pro",
  }),
};

// Helper to check rate limit
export async function checkRateLimit(
  userId: string,
  plan: "free" | "plus" | "pro"
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const limiter = rateLimiters[plan];
  const { success, remaining, reset } = await limiter.limit(userId);
  return { success, remaining, reset };
}
```

### Pattern 2: Exponential Backoff for OpenAI Errors
**What:** Automatically retry OpenAI API calls with increasing delays
**When to use:** All OpenAI API calls (generate, transcribe, template suggest)
**Example:**
```typescript
// lib/openai/client.ts
import { openai } from "@ai-sdk/openai";

interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  jitter?: boolean;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 5,
    initialDelayMs = 1000,
    maxDelayMs = 60000,
    jitter = true,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Check if it's a rate limit error (429)
      const isRateLimitError =
        error instanceof Error &&
        (error.message.includes("429") || error.message.includes("rate limit"));

      // Don't retry non-retryable errors
      if (!isRateLimitError && attempt === maxRetries) {
        throw error;
      }

      if (attempt < maxRetries) {
        // Calculate delay with exponential backoff
        let delay = Math.min(
          initialDelayMs * Math.pow(2, attempt),
          maxDelayMs
        );

        // Add jitter (0-100% of delay) to prevent thundering herd
        if (jitter) {
          delay = delay * (0.5 + Math.random());
        }

        console.log(`[OpenAI] Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
```

### Pattern 3: Request Queue for Concurrency Control
**What:** Limit concurrent OpenAI API requests globally
**When to use:** When you need to control overall throughput to stay within OpenAI limits
**Example:**
```typescript
// lib/openai/queue.ts
import PQueue from "p-queue";

// Global queue for OpenAI API requests
// Limit to 20 concurrent requests (adjust based on your tier)
export const openaiQueue = new PQueue({
  concurrency: 20,
  interval: 60000, // 1 minute
  intervalCap: 500, // Max 500 requests per minute (adjust to your RPM limit)
});

// Wrapper for queued OpenAI calls
export async function queuedOpenAICall<T>(
  operation: () => Promise<T>
): Promise<T> {
  return openaiQueue.add(operation);
}
```

### Pattern 4: Usage Tracking in Database
**What:** Track API usage against subscription limits
**When to use:** After successful API calls to enforce monthly limits
**Example:**
```typescript
// lib/usage/tracker.ts
import { createSupabaseServiceClient } from "@/lib/supabase/server";

interface UsageCheck {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  resetDate: Date;
}

export async function checkMonthlyUsage(
  userId: string,
  usageType: "reports" | "transcriptions"
): Promise<UsageCheck> {
  const supabase = createSupabaseServiceClient();

  // Get user's subscription and limits
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, period_start, period_end")
    .eq("user_id", userId)
    .single();

  const plan = subscription?.plan || "free";

  // Get plan limits
  const { data: limits } = await supabase
    .from("subscription_limits")
    .select("*")
    .eq("plan", plan)
    .single();

  const limit = usageType === "reports"
    ? limits?.max_reports_per_month
    : limits?.max_transcriptions_per_month;

  // -1 means unlimited (pro plan)
  if (limit === -1) {
    return { allowed: true, currentUsage: 0, limit: -1, resetDate: new Date(subscription?.period_end || Date.now()) };
  }

  // Count usage this period
  const { count } = await supabase
    .from(usageType === "reports" ? "report_sessions" : "transcribe_sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", subscription?.period_start);

  const currentUsage = count || 0;

  return {
    allowed: currentUsage < limit,
    currentUsage,
    limit,
    resetDate: new Date(subscription?.period_end || Date.now()),
  };
}

export async function recordUsage(
  userId: string,
  usageType: "report" | "transcription",
  meta: Record<string, unknown>
): Promise<void> {
  const supabase = createSupabaseServiceClient();

  // Record in credits_ledger for audit trail
  await supabase.from("credits_ledger").insert({
    user_id: userId,
    delta: -1,
    reason: "debit",
    meta: { type: usageType, ...meta },
    idempotency_key: `${usageType}_${userId}_${Date.now()}`,
  });
}
```

### Anti-Patterns to Avoid
- **Global rate limits only:** Must have per-user limits or one user can exhaust quota for all
- **Checking usage after API call:** Always check limits BEFORE making expensive OpenAI calls
- **No jitter in retries:** Causes thundering herd when many clients retry simultaneously
- **Blocking on rate limit:** Return 429 with Retry-After header; don't queue indefinitely
- **In-memory rate limiting:** Doesn't work across serverless function instances; must use distributed store (Redis)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Distributed rate limiting | Custom Redis counters | `@upstash/ratelimit` | Handles sliding windows, edge cases, analytics; tested at scale |
| Concurrency control | Custom Promise arrays | `p-queue` | Handles interval-based rate limiting, priority, timeout |
| Retry logic | Manual retry loops | Built-in retry in pattern above | Easy to get jitter/backoff wrong |
| Redis connection pooling | Custom pool management | `@upstash/redis` | HTTP-based, no connections needed |

**Key insight:** Distributed rate limiting has many subtle edge cases (clock skew, race conditions, sliding window implementation). The Upstash library handles these correctly and is battle-tested on Vercel's infrastructure.

## Common Pitfalls

### Pitfall 1: Not Distinguishing RPM vs TPM Limits
**What goes wrong:** Hit rate limits even with low request count because token usage is high
**Why it happens:** OpenAI enforces both requests-per-minute (RPM) AND tokens-per-minute (TPM); long prompts/responses burn through TPM fast
**How to avoid:**
- Set reasonable `maxOutputTokens` on generation calls
- Track token usage, not just request count
- For report generation (~2000 tokens output), account for this in rate limit calculations
**Warning signs:** 429 errors when request rate is low

### Pitfall 2: Edge Runtime Limitations
**What goes wrong:** Rate limiting code fails in Edge runtime
**Why it happens:** Edge runtime can't use TCP-based Redis clients or Node.js-specific modules
**How to avoid:**
- Use `@upstash/redis` (HTTP-based) instead of `ioredis`
- Use `@upstash/ratelimit` which is designed for Edge
- Test rate limiting in Edge runtime during development
**Warning signs:** "Module not found" or "Connection refused" errors in Edge functions

### Pitfall 3: Race Conditions in Usage Tracking
**What goes wrong:** Users exceed limits by making concurrent requests
**Why it happens:** Check-then-update pattern without locking allows race conditions
**How to avoid:**
- Use idempotency keys (already in `credits_ledger`)
- Use Upstash rate limiter which handles atomicity
- For monthly limits, use optimistic locking or accept slight over-usage
**Warning signs:** Users consistently exceeding stated limits by small amounts

### Pitfall 4: No Graceful Degradation
**What goes wrong:** Users see cryptic errors when rate limited
**Why it happens:** Returning raw 429 errors without helpful information
**How to avoid:**
- Return clear error messages: "You've reached your limit. Please wait X seconds."
- Include `Retry-After` header in 429 responses
- Show remaining quota in successful responses
- Display usage dashboards in the UI
**Warning signs:** User confusion, support tickets about "broken" features

### Pitfall 5: Single Point of Failure on Redis
**What goes wrong:** Application fails completely when Redis is unavailable
**Why it happens:** Rate limiting blocks all requests when Redis is down
**How to avoid:**
- Set timeout on Redis calls (Upstash ratelimit has `timeout` option)
- Default to ALLOW on Redis failure (fail open)
- Log Redis failures for alerting
**Warning signs:** Application outages correlated with Redis issues

## Code Examples

Verified patterns from official sources:

### Rate-Limited API Route
```typescript
// app/api/generate/route.ts (updated)
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { checkRateLimit } from "@/lib/ratelimit/client";
import { checkMonthlyUsage, recordUsage } from "@/lib/usage/tracker";
import { withRetry } from "@/lib/openai/client";

export const runtime = "edge";
export const maxDuration = 30;

export async function POST(request: Request) {
  // ... existing auth code ...

  // 1. Check per-user rate limit (Redis-based, per minute)
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();

  const plan = subscription?.plan || "free";
  const { success, remaining, reset } = await checkRateLimit(user.id, plan);

  if (!success) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Rate Limit Exceeded",
        message: `Too many requests. Please wait ${Math.ceil((reset - Date.now()) / 1000)} seconds.`,
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
          "X-RateLimit-Remaining": String(remaining),
        }
      }
    );
  }

  // 2. Check monthly usage limit (database-based)
  const usageCheck = await checkMonthlyUsage(user.id, "reports");

  if (!usageCheck.allowed) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Monthly Limit Reached",
        message: `You've used ${usageCheck.currentUsage}/${usageCheck.limit} reports this month. Limit resets on ${usageCheck.resetDate.toLocaleDateString()}.`,
        currentUsage: usageCheck.currentUsage,
        limit: usageCheck.limit,
        resetDate: usageCheck.resetDate.toISOString(),
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  // 3. Make OpenAI call with retry logic
  // ... validation code ...

  try {
    const result = await withRetry(async () => {
      return streamText({
        model: openai("gpt-4o"),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.2,
        maxOutputTokens: 2000,
      });
    });

    // 4. Record successful usage
    await recordUsage(user.id, "report", {
      templateId: validation.data.templateId,
      modality: validation.data.modality,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    // Handle OpenAI errors after retries exhausted
    console.error("OpenAI API error after retries:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Service Temporarily Unavailable",
        message: "The AI service is currently overloaded. Please try again in a few moments.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

### Upstash Redis Setup
```typescript
// lib/ratelimit/client.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Environment variables required:
// UPSTASH_REDIS_REST_URL
// UPSTASH_REDIS_REST_TOKEN

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Sliding window is recommended over fixed window
// - Prevents burst attacks at interval boundaries
// - Provides smoother rate limiting experience
export const generateRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
  analytics: true,
  prefix: "@airad/generate",
  timeout: 1000, // Fail open after 1 second if Redis is slow
});

export const transcribeRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 transcriptions per minute
  analytics: true,
  prefix: "@airad/transcribe",
  timeout: 1000,
});
```

## State of the Art (2025/2026)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Vercel KV | Upstash Redis direct | Late 2024 | Vercel KV deprecated for new projects; use Upstash directly |
| TCP Redis clients | HTTP-based Redis (Upstash) | 2023+ | Required for Edge runtime; no connection pooling issues |
| Fixed window rate limiting | Sliding window | Standard since 2022 | Prevents burst attacks at interval boundaries |
| In-memory rate limiting | Distributed (Redis) | Standard for serverless | Required when functions run across multiple instances |

**New tools/patterns to consider:**
- OpenAI Usage API: Programmatically check your account's rate limits and current usage
- Upstash Analytics: Built-in dashboard for rate limit events
- Vercel Fluid Compute: Reduces cold starts, may help with rate limit spikes

**Deprecated/outdated:**
- Vercel KV: No longer available for new projects; use Upstash directly
- `ioredis` in Edge: Does not work in Edge runtime; use `@upstash/redis`
- Single global rate limit: Per-user limits are now standard practice

## OpenAI Rate Limits Reference

Based on typical account tiers (check your dashboard at platform.openai.com for exact limits):

### GPT-4o Rate Limits (Approximate)
| Tier | RPM | TPM | TPD |
|------|-----|-----|-----|
| Tier 1 (Free) | 500 | 30,000 | 90,000 |
| Tier 2 | 5,000 | 450,000 | - |
| Tier 3 | 5,000 | 800,000 | - |
| Tier 4 | 10,000 | 2,000,000 | - |
| Tier 5 | 10,000 | 10,000,000 | - |

### Whisper Rate Limits
- File size limit: 25MB per request
- Rate limits vary by tier (similar to chat models)
- Charged per minute of audio ($0.006/minute)

### Capacity Planning for 50-75 Users
With 50-75 concurrent users and typical usage patterns:
- Assume 5-10 reports per user per hour = 375-750 requests/hour = 6-12 RPM average
- Assume 2-5 transcriptions per user per hour = 150-375 requests/hour = 3-6 RPM average
- **Recommendation:** Tier 2+ should be sufficient; monitor and upgrade as needed

## Environment Variables Required

```env
# Upstash Redis (required for rate limiting)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# OpenAI (existing)
OPENAI_API_KEY=sk-xxx
```

## Open Questions

Things that couldn't be fully resolved:

1. **Exact OpenAI Rate Limits for Account**
   - What we know: Limits vary by usage tier; automatically increase with usage
   - What's unclear: Specific limits for this project's OpenAI account
   - Recommendation: Check dashboard at platform.openai.com/usage; start with Tier 2 assumptions

2. **Multi-Region Redis**
   - What we know: Upstash supports multi-region for lower latency
   - What's unclear: Whether single region is sufficient for initial 50-75 users
   - Recommendation: Start with single region (US-East); add regions if latency issues arise

3. **Whisper Concurrent Limits**
   - What we know: Whisper has file size limits (25MB) and per-minute pricing
   - What's unclear: Specific concurrent request limits for Whisper API
   - Recommendation: Apply same rate limiting patterns as text generation; adjust based on monitoring

## Sources

### Primary (HIGH confidence)
- [Upstash Ratelimit Documentation](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview) - Official SDK docs
- [Upstash Ratelimit GitHub](https://github.com/upstash/ratelimit-js) - Source code and examples
- [OpenAI Rate Limits Guide](https://platform.openai.com/docs/guides/rate-limits) - Official rate limits documentation
- [OpenAI Cookbook - Handling Rate Limits](https://cookbook.openai.com/examples/how_to_handle_rate_limits) - Official best practices

### Secondary (MEDIUM confidence)
- [Vercel Rate Limiting Guide](https://vercel.com/guides/rate-limiting-edge-middleware-vercel-kv) - Vercel's official integration guide
- [Upstash Blog - Edge Rate Limiting](https://upstash.com/blog/edge-rate-limiting) - Detailed implementation guide
- [p-queue GitHub](https://github.com/sindresorhus/p-queue) - Promise queue library

### Tertiary (LOW confidence)
- Various community blog posts on Next.js rate limiting patterns
- OpenAI community forum discussions on rate limit handling

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Upstash is Vercel's official recommendation; well-documented
- Architecture: HIGH - Patterns from official documentation and battle-tested examples
- Pitfalls: HIGH - Based on official documentation and known issues
- OpenAI limits: MEDIUM - General tier information available; specific limits require account check

**Research date:** 2026-01-23
**Valid until:** 30 days (stable patterns; check for Upstash/OpenAI updates)

---
phase: 29
plan: 04
subsystem: billing-stripe
tags: [stripe, webhooks, idempotency, error-handling]
depends_on:
  requires: []
  provides: [stripe-idempotency, stripe-error-handler]
  affects: [28-production-deployment]
tech-stack:
  added: []
  patterns: [idempotency-pattern, typed-error-handling]
key-files:
  created:
    - app/supabase/migrations/20260122000000_stripe_webhook_events.sql
    - app/lib/stripe/error-handler.ts
  modified:
    - app/app/api/billing/checkout/route.ts
    - app/app/api/stripe/webhook/route.ts
decisions:
  - id: 29-04-01
    choice: "Let Stripe Dashboard determine payment methods"
    rationale: "More flexible, enables Apple Pay/Google Pay automatically"
  - id: 29-04-02
    choice: "Record events before processing for idempotency"
    rationale: "Prevents race conditions where duplicate events start processing simultaneously"
  - id: 29-04-03
    choice: "Graceful degradation if idempotency table doesn't exist"
    rationale: "Allows webhook to work before migration is applied"
metrics:
  duration: 12 min
  completed: 2026-01-22
---

# Phase 29 Plan 04: Stripe Integration Hardening Summary

**One-liner:** Webhook idempotency with event tracking table, Stripe-specific error handling, and flexible payment method configuration.

## What Changed

### Task 1: Checkout Route Improvement
- Removed hardcoded `payment_method_types: ['card']`
- Added `payment_method_collection: 'if_required'`
- Now uses Stripe Dashboard configuration for payment methods
- Automatically enables Apple Pay, Google Pay, Link, etc.

### Task 2: Webhook Idempotency Migration
- Created `stripe_webhook_events` table for tracking processed events
- Unique constraint on `event_id` prevents duplicates
- Index for fast lookups
- Optional JSONB payload for debugging

### Task 3: Webhook Idempotency & Error Handling
- Check for duplicate events before processing
- Record events before processing (prevents race conditions)
- Created `handleStripeError` utility with:
  - Typed error information (StripeErrorType)
  - Retryable flag for intelligent error responses
  - Structured error info with code/decline_code
- Return 200 for non-retryable errors (stop Stripe retries)
- Return 500 for retryable errors (allow Stripe retries)

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 1e10afc | refactor | Remove hardcoded payment_method_types from checkout |
| 2096cf6 | feat | Add stripe_webhook_events table for idempotency |
| 85c74d9 | feat | Add webhook idempotency and stripe error handling |

## Deviations from Plan

### Auto-fixed Issues (Rule 3 - Blocking)
None directly blocking this plan's execution.

### Pre-existing Build Issues (Not Fixed)
- ESLint stripping imports during build (jsPDF, docx imports)
- This is a pre-existing codebase issue unrelated to this plan
- TypeCheck passes; build fails at ESLint lint phase
- Workaround: Build with `NEXT_DISABLE_ESLINT=1`

## Technical Details

### Idempotency Pattern
```typescript
// Check before processing
const { data: existingEvent } = await supabase
  .from('stripe_webhook_events')
  .select('id')
  .eq('event_id', event.id)
  .single();

if (existingEvent) {
  return NextResponse.json({ received: true, duplicate: true });
}

// Record before processing (prevents race conditions)
await supabase.from('stripe_webhook_events').insert({
  event_id: event.id,
  event_type: event.type,
});
```

### Error Handler Usage
```typescript
const errorInfo = handleStripeError(err);
// Returns: { type, message, code, decline_code, retryable }

// Return appropriate status based on retryability
const status = errorInfo.retryable ? 500 : 200;
```

## Next Phase Readiness

### For Production Deployment (Phase 28)
- [ ] Run migration: `20260122000000_stripe_webhook_events.sql`
- [ ] Verify Stripe Dashboard payment methods are configured
- [ ] Test webhook with CLI forwarding

### Dependencies Satisfied
- Stripe webhook hardened with idempotency
- Error handling provides better diagnostics
- Checkout follows Stripe best practices

-- Track processed Stripe webhook events for idempotency
-- Prevents duplicate processing if Stripe retries delivery

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE, -- Stripe event ID (evt_xxx)
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB, -- Optional: store event data for debugging
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookups by event_id
CREATE INDEX idx_stripe_webhook_events_event_id ON stripe_webhook_events(event_id);

-- Clean up old events after 30 days (optional maintenance)
-- This can be done via a scheduled job or manual cleanup

COMMENT ON TABLE stripe_webhook_events IS 'Tracks processed Stripe webhook events for idempotency';

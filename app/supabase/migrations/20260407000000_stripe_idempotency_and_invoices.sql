-- 1. Make processed_at NULLable so we can insert "received but not yet processed"
--    rows. The previous schema had `NOT NULL DEFAULT NOW()` which made every
--    insert look "processed", causing failed events to be skipped on retry.
ALTER TABLE stripe_webhook_events
  ALTER COLUMN processed_at DROP NOT NULL,
  ALTER COLUMN processed_at DROP DEFAULT;

-- Backfill: any existing rows are assumed processed (historical data).
UPDATE stripe_webhook_events SET processed_at = COALESCE(processed_at, created_at);

-- 2. New table for invoice records (created on invoice.payment_succeeded).
CREATE TABLE IF NOT EXISTS stripe_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_invoice_id TEXT NOT NULL UNIQUE,           -- in_xxx
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT,                       -- nullable (one-off invoices)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount_paid INTEGER NOT NULL,                      -- in minor units (pence)
  currency TEXT NOT NULL,
  status TEXT NOT NULL,                              -- paid, open, void, etc.
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  hosted_invoice_url TEXT,
  invoice_pdf TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_invoices_customer ON stripe_invoices(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_user ON stripe_invoices(user_id);

COMMENT ON TABLE stripe_invoices IS 'Persisted invoice records from Stripe invoice.payment_succeeded webhooks';

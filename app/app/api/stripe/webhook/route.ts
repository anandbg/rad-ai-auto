import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { handleStripeError } from '@/lib/stripe/error-handler';

// Conditional logging - only log in development
const isDev = process.env.NODE_ENV === 'development';
const log = isDev ? (...args: unknown[]) => console.log('[Stripe Webhook]', ...args) : () => {};
const logError = (...args: unknown[]) => console.error('[Stripe Webhook]', ...args);

// Helper function to determine plan from price ID
// Note: 'pro' in database maps to 'Enterprise' in UI (for backwards compatibility)
function getPlanFromPriceId(priceId: string | undefined): 'free' | 'plus' | 'pro' {
  if (priceId === process.env.STRIPE_PRICE_ID_PLUS) return 'plus';
  if (priceId === process.env.STRIPE_PRICE_ID_PRO) return 'pro';
  return 'free';
}

// Helper function to map Stripe subscription status to our status enum
function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete' {
  switch (stripeStatus) {
    case 'active': return 'active';
    case 'past_due': return 'past_due';
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired': return 'canceled';
    case 'trialing': return 'trialing';
    case 'incomplete': return 'incomplete';
    default: return 'active';
  }
}

// Initialize Stripe client
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Create Stripe instance only if credentials are available
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2025-04-30.basil' as Stripe.LatestApiVersion })
  : null;

/**
 * Stripe Webhook Handler
 *
 * This endpoint receives webhook events from Stripe and processes them.
 * It validates the webhook signature to ensure the request is authentic.
 *
 * Security: Webhook signature verification is REQUIRED for all requests.
 */
export async function POST(request: NextRequest) {
  // Get the raw body for signature verification
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  // SECURITY: Always validate signature is present FIRST (before any other checks)
  // This prevents requests without signatures from being processed regardless of configuration
  if (!signature) {
    logError('Missing stripe-signature header');
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  // Check if webhook secret is configured
  if (!webhookSecret || webhookSecret === 'your_stripe_webhook_secret') {
    logError('STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  // Check if Stripe is properly initialized
  if (!stripe) {
    logError('Stripe client not initialized');
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    log(` Verified event: ${event.type} (${event.id})`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Stripe Webhook] Signature verification failed: ${errorMessage}`);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${errorMessage}` },
      { status: 400 }
    );
  }

  // Check if event was already processed (idempotency)
  // This prevents duplicate processing if Stripe retries delivery.
  // Guard: only short-circuit when processed_at IS NOT NULL. A row with
  // processed_at NULL indicates a previous delivery failed mid-processing;
  // Stripe's retry should be allowed to re-run the handler.
  const supabaseIdem = createSupabaseServiceClient();
  let idempotencyTracked = false;
  try {
    const { data: existingEvent, error: selectErr } = await supabaseIdem
      .from('stripe_webhook_events')
      .select('id, processed_at')
      .eq('event_id', event.id)
      .maybeSingle();

    if (selectErr) {
      log(`Idempotency select failed (non-fatal): ${selectErr.message}`);
    }

    if (existingEvent && existingEvent.processed_at) {
      log(`Event ${event.id} already processed, skipping`);
      return NextResponse.json({ received: true, duplicate: true });
    }

    if (!existingEvent) {
      // Record the event with NULL processed_at so Stripe can retry on failure.
      const { error: insertErr } = await supabaseIdem
        .from('stripe_webhook_events')
        .insert({
          event_id: event.id,
          event_type: event.type,
          processed_at: null,
        });
      if (insertErr) {
        log(`Idempotency insert failed (non-fatal): ${insertErr.message}`);
      } else {
        idempotencyTracked = true;
      }
    } else {
      // Row exists but processed_at is NULL — this is a Stripe retry of a
      // previously failed processing attempt. Re-run handler.
      log(`Retrying previously-failed event ${event.id}`);
      idempotencyTracked = true;
    }
  } catch (err) {
    // If we can't check/record idempotency, log but continue processing
    // This handles the case where the table doesn't exist yet (migration not run)
    log(`Idempotency check failed (table may not exist yet): ${err instanceof Error ? err.message : 'Unknown'}`);
  }

  // Handle different event types
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        log(` Checkout completed: ${session.id}`);

        const customerId = session.customer as string;
        const userId = session.metadata?.user_id;

        if (!userId) {
          logError('No user_id in checkout metadata');
          break;
        }

        try {
          // Get subscription details from Stripe
          const subscriptionId = session.subscription as string;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          // Determine plan from price ID - period dates are on the subscription item
          const subscriptionItem = subscription.items.data[0];
          const priceId = subscriptionItem?.price.id;
          const plan = getPlanFromPriceId(priceId);

          // Period dates are on the subscription item in newer Stripe API versions
          const periodStart = subscriptionItem?.current_period_start ?? Math.floor(Date.now() / 1000);
          const periodEnd = subscriptionItem?.current_period_end ?? Math.floor(Date.now() / 1000);

          // Update subscriptions table
          const supabase = createSupabaseServiceClient();
          const { error } = await supabase.from('subscriptions').upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            plan: plan,
            status: 'active',
            period_start: new Date(periodStart * 1000).toISOString(),
            period_end: new Date(periodEnd * 1000).toISOString(),
          });

          if (error) {
            logError('Error upserting subscription:', error);
          } else {
            log(` Activated ${plan} subscription for user ${userId}`);
          }
        } catch (err) {
          logError('Error processing checkout.session.completed:', err);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        log(` Subscription ${event.type}: ${subscription.id}`);

        try {
          const customerId = subscription.customer as string;
          const subscriptionItem = subscription.items.data[0];
          const priceId = subscriptionItem?.price.id;
          const plan = getPlanFromPriceId(priceId);
          const status = mapStripeStatus(subscription.status);

          // Period dates are on the subscription item in newer Stripe API versions
          const periodStart = subscriptionItem?.current_period_start ?? Math.floor(Date.now() / 1000);
          const periodEnd = subscriptionItem?.current_period_end ?? Math.floor(Date.now() / 1000);

          const supabase = createSupabaseServiceClient();
          const { error } = await supabase.from('subscriptions')
            .update({
              plan: plan,
              status: status,
              period_start: new Date(periodStart * 1000).toISOString(),
              period_end: new Date(periodEnd * 1000).toISOString(),
            })
            .eq('stripe_customer_id', customerId);

          if (error) {
            logError('Error updating subscription:', error);
          } else {
            log(` Updated subscription to ${plan}/${status} for customer ${customerId}`);
          }
        } catch (err) {
          logError('Error processing subscription event:', err);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        log(` Subscription canceled: ${subscription.id}`);

        try {
          const customerId = subscription.customer as string;

          const supabase = createSupabaseServiceClient();
          const { error } = await supabase.from('subscriptions')
            .update({
              plan: 'free',
              status: 'canceled',
            })
            .eq('stripe_customer_id', customerId);

          if (error) {
            logError('Error downgrading subscription:', error);
          } else {
            log(` Downgraded to free plan for customer ${customerId}`);
          }
        } catch (err) {
          logError('Error processing subscription deletion:', err);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        log(` Payment succeeded: ${invoice.id}`);

        const customerId = invoice.customer as string;
        // Stripe.Invoice.subscription is deprecated in newer API versions; check parent.
        const subscriptionId =
          (invoice as unknown as { subscription?: string }).subscription ??
          (invoice as unknown as {
            parent?: { subscription_details?: { subscription?: string } };
          }).parent?.subscription_details?.subscription ??
          null;

        // Look up user_id from subscriptions table via customer id.
        const supabase = createSupabaseServiceClient();
        const { data: subRow, error: subLookupErr } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (subLookupErr || !subRow?.user_id) {
          logError(
            'invoice.payment_succeeded: no subscription row for customer',
            customerId,
            subLookupErr
          );
          // Still record the invoice (without user_id) so we have an audit trail.
        }

        // 1. Persist the invoice (idempotent via stripe_invoice_id UNIQUE).
        const periodStart = invoice.period_start
          ? new Date(invoice.period_start * 1000).toISOString()
          : null;
        const periodEnd = invoice.period_end
          ? new Date(invoice.period_end * 1000).toISOString()
          : null;

        const { error: invErr } = await supabase
          .from('stripe_invoices')
          .upsert(
            {
              stripe_invoice_id: invoice.id,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              user_id: subRow?.user_id ?? null,
              amount_paid: invoice.amount_paid,
              currency: invoice.currency,
              status: invoice.status ?? 'paid',
              period_start: periodStart,
              period_end: periodEnd,
              hosted_invoice_url: invoice.hosted_invoice_url ?? null,
              invoice_pdf: invoice.invoice_pdf ?? null,
            },
            { onConflict: 'stripe_invoice_id' }
          );

        if (invErr) {
          logError('Error upserting stripe_invoices:', invErr);
        }

        // 2. Reset monthly credits — insert an `allocation` ledger row keyed by invoice.id.
        //    The UNIQUE (user_id, idempotency_key) constraint guarantees idempotency.
        //    Allocation amount: 100 credits per renewal (placeholder consistent with sandbox).
        //    Skip if we could not resolve user_id.
        if (subRow?.user_id) {
          const { error: ledgerErr } = await supabase.from('credits_ledger').insert({
            user_id: subRow.user_id,
            delta: 100,
            reason: 'allocation',
            idempotency_key: invoice.id,
            meta: { source: 'invoice.payment_succeeded', invoice_id: invoice.id },
          });
          // Unique violation (23505) means we already allocated for this invoice — fine.
          if (ledgerErr && !ledgerErr.message?.includes('duplicate')) {
            logError('Error inserting credit allocation:', ledgerErr);
          } else if (!ledgerErr) {
            log(` Allocated 100 credits for ${subRow.user_id} from invoice ${invoice.id}`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        log(` Payment failed: ${invoice.id}`);

        try {
          const customerId = invoice.customer as string;

          const supabase = createSupabaseServiceClient();
          const { error } = await supabase.from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_customer_id', customerId);

          if (error) {
            logError('Error marking subscription as past_due:', error);
          } else {
            log(` Marked subscription as past_due for customer ${customerId}`);
          }
        } catch (err) {
          logError('Error processing payment failure:', err);
        }
        break;
      }

      default:
        log(` Unhandled event type: ${event.type}`);
    }

    // Mark event as successfully processed. If this update fails, the next
    // Stripe retry will still find processed_at IS NULL and re-run the handler.
    if (idempotencyTracked) {
      const { error: markErr } = await supabaseIdem
        .from('stripe_webhook_events')
        .update({ processed_at: new Date().toISOString() })
        .eq('event_id', event.id);
      if (markErr) {
        logError(`Failed to mark event ${event.id} processed:`, markErr);
      }
    }

    return NextResponse.json({ received: true, event_type: event.type });
  } catch (err) {
    const errorInfo = handleStripeError(err);
    console.error(`[Stripe Webhook] Error processing event: ${errorInfo.message} (type: ${errorInfo.type}, retryable: ${errorInfo.retryable})`);

    // Return 200 for non-retryable errors to prevent Stripe from retrying
    // Return 500 for retryable errors so Stripe will retry later
    const status = errorInfo.retryable ? 500 : 200;

    return NextResponse.json(
      {
        error: `Error processing webhook: ${errorInfo.message}`,
        error_type: errorInfo.type,
        retryable: errorInfo.retryable,
      },
      { status }
    );
  }
}

// Only allow POST method
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

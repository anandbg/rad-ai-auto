import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Conditional logging - only log in development
const isDev = process.env.NODE_ENV === 'development';
const log = isDev ? (...args: unknown[]) => console.log('[Stripe Webhook]', ...args) : () => {};
const logError = (...args: unknown[]) => console.error('[Stripe Webhook]', ...args);

// Helper function to determine plan from price ID
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
          const supabase = await createSupabaseServerClient();
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

          const supabase = await createSupabaseServerClient();
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

          const supabase = await createSupabaseServerClient();
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
        // TODO: Record payment, reset monthly credits
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        log(` Payment failed: ${invoice.id}`);

        try {
          const customerId = invoice.customer as string;

          const supabase = await createSupabaseServerClient();
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

    return NextResponse.json({ received: true, event_type: event.type });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Stripe Webhook] Error processing event: ${errorMessage}`);
    return NextResponse.json(
      { error: `Error processing webhook: ${errorMessage}` },
      { status: 500 }
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

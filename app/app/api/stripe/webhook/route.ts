import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

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
    console.error('[Stripe Webhook] Missing stripe-signature header');
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  // Check if webhook secret is configured
  if (!webhookSecret || webhookSecret === 'your_stripe_webhook_secret') {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  // Check if Stripe is properly initialized
  if (!stripe) {
    console.error('[Stripe Webhook] Stripe client not initialized');
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`[Stripe Webhook] Verified event: ${event.type} (${event.id})`);
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
        console.log(`[Stripe Webhook] Checkout completed: ${session.id}`);
        // TODO: Activate subscription for the user
        // - Get customer email from session
        // - Update user subscription status in database
        // - Allocate credits based on plan
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[Stripe Webhook] Subscription ${event.type}: ${subscription.id}`);
        // TODO: Update subscription status
        // - Find user by Stripe customer ID
        // - Update plan, status, period_start, period_end
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[Stripe Webhook] Subscription canceled: ${subscription.id}`);
        // TODO: Downgrade to free plan
        // - Find user by Stripe customer ID
        // - Set plan to 'free'
        // - Clear Stripe subscription data
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Stripe Webhook] Payment succeeded: ${invoice.id}`);
        // TODO: Record payment, reset monthly credits
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Stripe Webhook] Payment failed: ${invoice.id}`);
        // TODO: Send notification to user, update subscription status to 'past_due'
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
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

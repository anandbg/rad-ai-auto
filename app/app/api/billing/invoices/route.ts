import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Initialize Stripe client
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2025-04-30.basil' as Stripe.LatestApiVersion })
  : null;

/**
 * GET /api/billing/invoices
 * Fetch invoice history from Stripe for the authenticated user
 */
export async function GET() {
  try {
    // Check Stripe configuration
    if (!stripe) {
      console.error('[Billing API] Stripe client not initialized');
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    // Get authenticated user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's subscription with Stripe customer ID
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription?.stripe_customer_id) {
      // User has no subscription/customer ID - return empty invoices
      return NextResponse.json({ data: [] });
    }

    // Fetch invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: subscription.stripe_customer_id,
      limit: 20,
    });

    // Transform to frontend-friendly format
    const formattedInvoices = invoices.data.map((inv) => ({
      id: inv.id,
      date: new Date(inv.created * 1000).toISOString().split('T')[0],
      amount: `$${(inv.amount_paid / 100).toFixed(2)}`,
      status: inv.status === 'paid' ? 'paid' : inv.status || 'pending',
      description: inv.lines.data[0]?.description || `Invoice ${inv.number || inv.id}`,
      invoiceUrl: inv.hosted_invoice_url || '',
    }));

    return NextResponse.json({ data: formattedInvoices });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Billing API] Error fetching invoices: ${errorMessage}`);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

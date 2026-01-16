'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { PageWrapper } from '@/components/motion/page-wrapper';
import { FadeIn } from '@/components/motion/fade-in';
import { StaggerContainer } from '@/components/motion/stagger-container';

// Plan configuration
const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'month',
    features: [
      '10 reports/month',
      '15 min transcription',
      '3 templates',
      'Basic PDF export',
    ],
    stripePriceId: null,
  },
  {
    id: 'plus',
    name: 'Plus',
    price: '$15',
    period: 'month',
    features: [
      '100 reports/month',
      '150 min transcription',
      '20 templates',
      'Template versioning',
      'Word/DOCX export',
    ],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID,
    recommended: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$35',
    period: 'month',
    features: [
      'Unlimited reports',
      'Unlimited transcription',
      'Unlimited templates',
      'Institution features',
      'Priority support',
    ],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
  },
];

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: string;
  description: string;
  invoiceUrl: string | null;
}

interface Subscription {
  plan: string;
  status: string;
  stripe_customer_id?: string;
  period_end?: string;
}

interface UsageStats {
  reportsGenerated: number;
  transcriptionMinutes: number;
  templateCount: number;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function BillingPage() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats>({
    reportsGenerated: 0,
    transcriptionMinutes: 0,
    templateCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(true);

  // Load subscription and usage data
  useEffect(() => {
    const loadBillingData = async () => {
      if (!user?.id) return;

      const supabase = createSupabaseBrowserClient();

      try {
        // Fetch subscription
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (subData) {
          setSubscription(subData);
        } else {
          // Default to free plan if no subscription
          setSubscription({
            plan: 'free',
            status: 'active',
          });
        }

        // Fetch usage stats from credits_ledger
        // Schema uses: delta (INTEGER), reason (credit_reason enum: allocation, debit, topup, refund)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const { data: creditsUsed } = await supabase
          .from('credits_ledger')
          .select('delta, reason, meta')
          .eq('user_id', user.id)
          .gte('created_at', startOfMonth)
          .lt('delta', 0); // Deductions are negative

        // Count reports by checking meta.type === 'report' or reason === 'debit' with report context
        const reportsGenerated = creditsUsed?.filter(c =>
          c.reason === 'debit' && (c.meta as { type?: string })?.type === 'report'
        ).length || 0;

        // Count transcription minutes from meta.minutes or sum debits with transcription type
        const transcriptionMinutes = creditsUsed
          ?.filter(c => c.reason === 'debit' && (c.meta as { type?: string })?.type === 'transcription')
          .reduce((sum, c) => sum + ((c.meta as { minutes?: number })?.minutes || Math.abs(c.delta)), 0) || 0;

        // Fetch template count
        const { count: templateCount } = await supabase
          .from('templates_personal')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        setUsageStats({
          reportsGenerated,
          transcriptionMinutes,
          templateCount: templateCount || 0,
        });
      } catch (error) {
        console.error('Error loading billing data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBillingData();
  }, [user?.id]);

  // Load invoices from Stripe API
  useEffect(() => {
    const loadInvoices = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch('/api/billing/invoices');
        if (response.ok) {
          const result = await response.json();
          setInvoices(result.data || []);
        }
      } catch (error) {
        console.error('Error loading invoices:', error);
      } finally {
        setInvoicesLoading(false);
      }
    };

    loadInvoices();
  }, [user?.id]);

  const currentPlanId = subscription?.plan || 'free';
  const currentPlan = plans.find(p => p.id === currentPlanId) ?? plans[0]!;

  // Plan limits based on subscription
  const planLimits = {
    free: { reports: 10, transcription: 15, templates: 3 },
    plus: { reports: 100, transcription: 150, templates: 20 },
    pro: { reports: Infinity, transcription: Infinity, templates: Infinity },
  };

  const limits = planLimits[currentPlanId as keyof typeof planLimits] || planLimits.free;

  const usagePercentage = (used: number, limit: number) => {
    if (limit === Infinity) return 0;
    return Math.min(Math.round((used / limit) * 100), 100);
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/billing/portal', { method: 'POST' });
      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
    }
  };

  const handleUpgrade = async (priceId: string | null | undefined) => {
    if (!priceId) return;

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error starting checkout:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent mx-auto" />
          <p className="text-text-secondary">Loading billing information...</p>
        </div>
      </div>
    );
  }

  return (
    <PageWrapper className="p-6">
      <div className="mx-auto max-w-5xl">
        <FadeIn>
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
            <p className="mt-2 text-text-secondary">
              Manage your subscription plan and view billing history
            </p>
          </header>
        </FadeIn>

        {/* Current Plan & Usage */}
        <FadeIn delay={0.1}>
          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Your active subscription</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-text-primary">{currentPlan.price}</span>
                    <span className="text-text-secondary">/{currentPlan.period}</span>
                  </div>
                  <div className="mt-1 text-lg font-semibold text-brand">{currentPlan.name} Plan</div>
                  {subscription?.status && subscription.status !== 'active' && (
                    <div className="mt-2 text-sm text-warning">
                      Status: {subscription.status}
                    </div>
                  )}
                </div>
                <ul className="space-y-2">
                  {currentPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-text-secondary">
                      <span className="text-success">+</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={handleManageSubscription}>
                  Manage Subscription
                </Button>
              </CardFooter>
            </Card>

            {/* Usage Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Usage This Month</CardTitle>
                <CardDescription>Your current billing period usage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Reports */}
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-text-secondary">Reports Generated</span>
                    <span className="font-medium text-text-primary" data-testid="billing-reports-count">
                      {usageStats.reportsGenerated} / {limits.reports === Infinity ? 'Unlimited' : limits.reports}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full bg-brand transition-all"
                      style={{ width: `${usagePercentage(usageStats.reportsGenerated, limits.reports)}%` }}
                    />
                  </div>
                </div>

                {/* Transcription */}
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-text-secondary">Transcription Minutes</span>
                    <span className="font-medium text-text-primary" data-testid="billing-transcription-minutes">
                      {usageStats.transcriptionMinutes} / {limits.transcription === Infinity ? 'Unlimited' : limits.transcription + ' min'}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full bg-info transition-all"
                      style={{ width: `${usagePercentage(usageStats.transcriptionMinutes, limits.transcription)}%` }}
                    />
                  </div>
                </div>

                {/* Templates */}
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-text-secondary">Personal Templates</span>
                    <span className="font-medium text-text-primary" data-testid="billing-templates-count">
                      {usageStats.templateCount} / {limits.templates === Infinity ? 'Unlimited' : limits.templates}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full bg-success transition-all"
                      style={{ width: `${usagePercentage(usageStats.templateCount, limits.templates)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </FadeIn>

        {/* Available Plans */}
        <FadeIn delay={0.2}>
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">Available Plans</h2>
            <StaggerContainer className="grid gap-4 md:grid-cols-3">
              {plans.map((plan) => {
                const isCurrent = plan.id === currentPlanId;
                return (
                  <FadeIn key={plan.id}>
                    <Card
                      className={plan.recommended ? 'border-brand ring-2 ring-brand/20' : ''}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>{plan.name}</CardTitle>
                          {plan.recommended && (
                            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                              Recommended
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-text-primary">{plan.price}</span>
                          <span className="text-sm text-text-secondary">/{plan.period}</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm text-text-secondary">
                              <span className="text-success">+</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button
                          variant={isCurrent ? 'outline' : plan.recommended ? 'primary' : 'secondary'}
                          className="w-full"
                          disabled={isCurrent}
                          onClick={() => !isCurrent && handleUpgrade(plan.stripePriceId)}
                        >
                          {isCurrent ? 'Current Plan' : 'Upgrade'}
                        </Button>
                      </CardFooter>
                    </Card>
                  </FadeIn>
                );
              })}
            </StaggerContainer>
          </div>
        </FadeIn>

        {/* Invoice History */}
        <FadeIn delay={0.3}>
          <div>
            <h2 className="mb-4 text-lg font-semibold text-text-primary">Invoice History</h2>
            <Card>
              <div className="overflow-x-auto">
                {invoicesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="py-8 text-center text-text-secondary">
                    No invoices yet
                  </div>
                ) : (
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-surface-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Description</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Amount</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-surface-muted/50">
                          <td className="px-4 py-3 text-sm text-text-primary">
                            {formatDate(invoice.date)}
                          </td>
                          <td className="px-4 py-3 text-sm text-text-secondary">
                            {invoice.description}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-text-primary">
                            {invoice.amount}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              invoice.status === 'paid'
                                ? 'bg-success/10 text-success'
                                : 'bg-warning/10 text-warning'
                            }`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {invoice.invoiceUrl ? (
                              <a
                                href={invoice.invoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-brand hover:text-brand/80 hover:underline"
                                data-testid={`invoice-link-${invoice.id}`}
                              >
                                View Invoice
                              </a>
                            ) : (
                              <span className="text-sm text-text-muted">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          </div>
        </FadeIn>
      </div>
    </PageWrapper>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

// Plan configuration
const currentPlan = {
  name: 'Free',
  price: '$0',
  period: 'month',
  features: [
    '10 reports/month',
    '15 minutes transcription',
    '3 personal templates',
    '1 brand template',
    'Basic PDF export',
  ],
};

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
    isCurrent: true,
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
    isCurrent: false,
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
    isCurrent: false,
  },
];

// Helper to get usage stats from localStorage
function getUsageStats(): { reportsGenerated: number; transcriptionMinutes: number } {
  if (typeof window === 'undefined') return { reportsGenerated: 0, transcriptionMinutes: 0 };
  const stored = localStorage.getItem('ai-rad-usage');
  if (!stored) return { reportsGenerated: 0, transcriptionMinutes: 0 };
  try {
    return JSON.parse(stored);
  } catch {
    return { reportsGenerated: 0, transcriptionMinutes: 0 };
  }
}

// Helper to count personal templates
function getTemplateCount(): number {
  if (typeof window === 'undefined') return 0;
  const stored = localStorage.getItem('ai-rad-templates');
  if (!stored) return 0;
  try {
    const templates = JSON.parse(stored);
    return templates.filter((t: { isGlobal: boolean }) => !t.isGlobal).length;
  } catch {
    return 0;
  }
}

// Mock invoice history
const invoices = [
  {
    id: 'inv_001',
    date: '2024-01-01',
    amount: '$0.00',
    status: 'paid',
    description: 'Free Plan - January 2024',
    invoiceUrl: 'https://invoice.stripe.com/i/acct_123/test_inv_001',
  },
  {
    id: 'inv_002',
    date: '2023-12-01',
    amount: '$0.00',
    status: 'paid',
    description: 'Free Plan - December 2023',
    invoiceUrl: 'https://invoice.stripe.com/i/acct_123/test_inv_002',
  },
  {
    id: 'inv_003',
    date: '2023-11-01',
    amount: '$15.00',
    status: 'paid',
    description: 'Plus Plan - November 2023',
    invoiceUrl: 'https://invoice.stripe.com/i/acct_123/test_inv_003',
  },
];

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function BillingPage() {
  const [usageStats, setUsageStats] = useState({ reportsGenerated: 0, transcriptionMinutes: 0 });
  const [templateCount, setTemplateCount] = useState(0);

  // Load usage stats on mount
  useEffect(() => {
    const loadStats = () => {
      setUsageStats(getUsageStats());
      setTemplateCount(getTemplateCount());
    };
    loadStats();

    // Also reload when the window gains focus
    window.addEventListener('focus', loadStats);
    window.addEventListener('storage', loadStats);

    return () => {
      window.removeEventListener('focus', loadStats);
      window.removeEventListener('storage', loadStats);
    };
  }, []);

  const usagePercentage = (used: number, limit: number) => Math.round((used / limit) * 100);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Billing & Subscription</h1>
        <p className="mt-1 text-text-secondary">
          Manage your subscription plan and view billing history
        </p>
      </div>

      {/* Current Plan & Usage */}
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
            </div>
            <ul className="space-y-2">
              {currentPlan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-text-secondary">
                  <span className="text-success">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
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
                  {usageStats.reportsGenerated} / 10
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full bg-brand transition-all"
                  style={{ width: `${usagePercentage(usageStats.reportsGenerated, 10)}%` }}
                />
              </div>
            </div>

            {/* Transcription */}
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-text-secondary">Transcription Minutes</span>
                <span className="font-medium text-text-primary" data-testid="billing-transcription-minutes">
                  {usageStats.transcriptionMinutes} / 15 min
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full bg-info transition-all"
                  style={{ width: `${usagePercentage(usageStats.transcriptionMinutes, 15)}%` }}
                />
              </div>
            </div>

            {/* Templates */}
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-text-secondary">Personal Templates</span>
                <span className="font-medium text-text-primary" data-testid="billing-templates-count">
                  {templateCount} / 3
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full bg-success transition-all"
                  style={{ width: `${usagePercentage(templateCount, 3)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Plans */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Available Plans</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.id}
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
                      <span className="text-success">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  variant={plan.isCurrent ? 'outline' : plan.recommended ? 'primary' : 'secondary'}
                  className="w-full"
                  disabled={plan.isCurrent}
                >
                  {plan.isCurrent ? 'Current Plan' : 'Upgrade'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Invoice History */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Invoice History</h2>
        <Card>
          <div className="overflow-hidden">
            <table className="w-full">
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
                      <a
                        href={invoice.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand hover:text-brand/80 hover:underline"
                        data-testid={`invoice-link-${invoice.id}`}
                      >
                        View Invoice
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

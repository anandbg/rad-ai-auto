import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Eye,
  EyeOff,
  Database,
  CreditCard,
  Trash2,
  Download,
  Lock,
  ExternalLink,
} from "lucide-react";

export const metadata = {
  title: "Privacy Policy - AI Radiologist",
  description: "Privacy Policy for AI Radiologist - How we handle your data with ephemeral processing",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-br from-brand-muted/30 via-background to-surface-muted border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-12 sm:px-8 lg:py-16">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-light text-success">
              <Shield className="h-6 w-6" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Privacy Policy</h1>
          </div>
          <p className="text-lg text-foreground-secondary">
            Your privacy is our priority. Learn how we protect your data.
          </p>
          <p className="mt-2 text-sm text-foreground-muted">
            Last updated: January 20, 2026
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-6 py-12 sm:px-8">
        {/* Introduction */}
        <section className="mb-12">
          <p className="text-foreground-secondary leading-relaxed">
            This Privacy Policy describes how AI Radiologist (&quot;Service&quot;), operated by
            [Company Legal Name] (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), collects, uses, and
            protects your information. We are committed to protecting your privacy and
            ensuring the security of your data.
          </p>
        </section>

        {/* Key Privacy Features - Prominent Display */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-foreground">Our Privacy Commitment</h2>

          {/* Ephemeral Processing Highlight */}
          <div className="mb-6 rounded-xl border-2 border-success/30 bg-success-light/30 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/20 text-success">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-bold text-foreground">
                  Ephemeral Processing - We Don&apos;t Store Your Content
                </h3>
                <p className="text-foreground-secondary leading-relaxed">
                  <strong className="text-foreground">AI Radiologist processes your content in real-time and
                  immediately discards it.</strong> We do not store, retain, or have access to any
                  transcription content, generated reports, or audio recordings. Your clinical content
                  exists only during the brief moment of processing and is never persisted on our servers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What We Collect */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-foreground">What We Collect</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-light text-brand">
                  <Eye className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-foreground">Account Information</h3>
              </div>
              <ul className="space-y-2 text-sm text-foreground-secondary">
                <li>- Email address (for login and communication)</li>
                <li>- Display name (optional)</li>
                <li>- Password (securely hashed, never stored in plain text)</li>
                <li>- Account creation date</li>
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-surface p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-light text-brand">
                  <Database className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-foreground">Usage Metadata</h3>
              </div>
              <ul className="space-y-2 text-sm text-foreground-secondary">
                <li>- Number of reports generated</li>
                <li>- Transcription minutes used</li>
                <li>- Number of templates created</li>
                <li>- Feature usage statistics (aggregate only)</li>
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-surface p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-light text-brand">
                  <CreditCard className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-foreground">Payment Information</h3>
              </div>
              <ul className="space-y-2 text-sm text-foreground-secondary">
                <li>- Subscription status and plan</li>
                <li>- Billing history and invoices</li>
                <li>- Payment method type (not card details)</li>
              </ul>
              <p className="mt-3 text-xs text-foreground-muted">
                Note: Card details are handled directly by Stripe and never touch our servers.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-light text-brand">
                  <Lock className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-foreground">User Preferences</h3>
              </div>
              <ul className="space-y-2 text-sm text-foreground-secondary">
                <li>- Theme preference (light/dark)</li>
                <li>- Default template selection</li>
                <li>- Application settings</li>
                <li>- Custom macros and shortcuts</li>
              </ul>
            </div>
          </div>
        </section>

        {/* What We Do NOT Collect */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-foreground">What We Do NOT Collect</h2>

          <div className="rounded-xl border-2 border-error/20 bg-error-light/20 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-error/20 text-error">
                <EyeOff className="h-5 w-5" />
              </div>
              <div className="space-y-4">
                <p className="text-foreground-secondary leading-relaxed">
                  <strong className="text-foreground">We explicitly do NOT collect, store, or retain:</strong>
                </p>
                <ul className="space-y-3 text-foreground-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-error font-bold">X</span>
                    <span><strong className="text-foreground">Patient data or PHI</strong> - No patient-identifiable information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-error font-bold">X</span>
                    <span><strong className="text-foreground">Report content</strong> - Generated reports are ephemeral</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-error font-bold">X</span>
                    <span><strong className="text-foreground">Transcription content</strong> - Audio and text are processed and deleted</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-error font-bold">X</span>
                    <span><strong className="text-foreground">Audio recordings</strong> - Processed immediately and never stored</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-error font-bold">X</span>
                    <span><strong className="text-foreground">Clinical findings or impressions</strong> - Your medical observations remain yours</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Data Processing */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-foreground">How We Process Data</h2>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="mb-3 text-lg font-bold text-foreground">AI Processing (Ephemeral)</h3>
              <p className="text-foreground-secondary leading-relaxed mb-3">
                When you use AI features (transcription, report generation, template suggestions),
                your content is processed in real-time through OpenAI&apos;s API. This processing is
                <strong className="text-foreground"> completely ephemeral</strong>:
              </p>
              <ul className="space-y-2 text-sm text-foreground-secondary list-disc list-inside">
                <li>Content is sent directly to OpenAI for processing</li>
                <li>Results are returned to your browser immediately</li>
                <li>No content is logged, cached, or stored on our servers</li>
                <li>OpenAI processes content per their privacy policy during the processing moment</li>
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="mb-3 text-lg font-bold text-foreground">Account Data Storage</h3>
              <p className="text-foreground-secondary leading-relaxed mb-3">
                Account and profile data is stored securely in Supabase, our database provider:
              </p>
              <ul className="space-y-2 text-sm text-foreground-secondary list-disc list-inside">
                <li>Data is encrypted at rest and in transit</li>
                <li>Row-level security ensures users can only access their own data</li>
                <li>Regular backups for disaster recovery</li>
                <li>Hosted in secure, SOC 2 compliant data centers</li>
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="mb-3 text-lg font-bold text-foreground">Payment Processing</h3>
              <p className="text-foreground-secondary leading-relaxed mb-3">
                Payments are processed securely through Stripe:
              </p>
              <ul className="space-y-2 text-sm text-foreground-secondary list-disc list-inside">
                <li>We never see or store your full credit card number</li>
                <li>Stripe is PCI-DSS Level 1 certified</li>
                <li>We only receive confirmation of successful/failed payments</li>
                <li>Billing history is maintained for your records</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Third-Party Services */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-foreground">Third-Party Services</h2>
          <p className="text-foreground-secondary leading-relaxed mb-4">
            We use the following third-party services to operate AI Radiologist:
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
              <div>
                <p className="font-medium text-foreground">OpenAI</p>
                <p className="text-sm text-foreground-secondary">AI processing for transcription and report generation</p>
              </div>
              <a
                href="https://openai.com/privacy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:text-brand-strong inline-flex items-center gap-1"
              >
                Privacy Policy <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
              <div>
                <p className="font-medium text-foreground">Stripe</p>
                <p className="text-sm text-foreground-secondary">Payment processing and subscription management</p>
              </div>
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:text-brand-strong inline-flex items-center gap-1"
              >
                Privacy Policy <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
              <div>
                <p className="font-medium text-foreground">Supabase</p>
                <p className="text-sm text-foreground-secondary">Account data storage and authentication</p>
              </div>
              <a
                href="https://supabase.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:text-brand-strong inline-flex items-center gap-1"
              >
                Privacy Policy <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
              <div>
                <p className="font-medium text-foreground">Vercel</p>
                <p className="text-sm text-foreground-secondary">Application hosting and analytics</p>
              </div>
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:text-brand-strong inline-flex items-center gap-1"
              >
                Privacy Policy <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </section>

        {/* Your Rights */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-foreground">Your Rights</h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface p-6 text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand">
                <Eye className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-bold text-foreground">Access Your Data</h3>
              <p className="text-sm text-foreground-secondary">
                View all account data we have stored about you in your Settings page.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-6 text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand">
                <Download className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-bold text-foreground">Export Your Data</h3>
              <p className="text-sm text-foreground-secondary">
                Request a complete export of your account data at any time.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-6 text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-error-light text-error">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-bold text-foreground">Delete Your Account</h3>
              <p className="text-sm text-foreground-secondary">
                Permanently delete your account and all associated data at any time.
              </p>
            </div>
          </div>

          <p className="mt-6 text-foreground-secondary">
            To exercise any of these rights, visit your Settings page or contact us at{" "}
            <a
              href="mailto:privacy@airad.io"
              className="text-brand hover:text-brand-strong underline"
            >
              privacy@airad.io
            </a>
          </p>
        </section>

        {/* Additional Sections */}
        <section className="mb-12 space-y-8">
          <div>
            <h2 className="mb-4 text-2xl font-bold text-foreground">Data Security</h2>
            <p className="text-foreground-secondary leading-relaxed">
              We implement industry-standard security measures to protect your data, including:
              encryption in transit (TLS 1.3), encryption at rest, secure authentication,
              regular security audits, and access controls. While no method of transmission
              over the Internet is 100% secure, we strive to use commercially acceptable
              means to protect your information.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-foreground">Data Retention</h2>
            <p className="text-foreground-secondary leading-relaxed">
              We retain your account information for as long as your account is active or
              as needed to provide you services. If you delete your account, we will delete
              your personal information within 30 days, except where we are required to
              retain it for legal or regulatory purposes. Usage metadata may be retained
              in aggregated, anonymized form for analytics.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-foreground">Cookies and Tracking</h2>
            <p className="text-foreground-secondary leading-relaxed">
              We use essential cookies for authentication and session management. We use
              Vercel Analytics for basic usage statistics (page views, performance metrics).
              We do not use third-party advertising cookies or sell your data to advertisers.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-foreground">Children&apos;s Privacy</h2>
            <p className="text-foreground-secondary leading-relaxed">
              The Service is not intended for use by individuals under the age of 18. We do
              not knowingly collect personal information from children. If you believe we
              have collected information from a child, please contact us immediately.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-foreground">International Data Transfers</h2>
            <p className="text-foreground-secondary leading-relaxed">
              Your information may be processed in the United States or other countries where
              our service providers operate. By using the Service, you consent to the transfer
              of your information to these jurisdictions, which may have different data
              protection laws than your country of residence.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-foreground">Changes to This Policy</h2>
            <p className="text-foreground-secondary leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any
              material changes by posting the new Privacy Policy on this page and updating
              the &quot;Last updated&quot; date. Your continued use of the Service after any changes
              constitutes acceptance of the new Privacy Policy.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-foreground">Contact Us</h2>
            <p className="text-foreground-secondary leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices,
              please contact us at:{" "}
              <a
                href="mailto:privacy@airad.io"
                className="text-brand hover:text-brand-strong underline"
              >
                privacy@airad.io
              </a>
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border pt-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-foreground-muted">
              &copy; 2026 AI Radiologist. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/terms"
                className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/"
                className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
              >
                Home
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

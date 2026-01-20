import Link from "next/link";
import { ArrowLeft, FileText, Shield, AlertTriangle, Scale, Lock, UserCheck, Database } from "lucide-react";

export const metadata = {
  title: "Terms of Service - AI Radiologist",
  description: "Terms of Service for AI Radiologist - AI-powered radiology report drafting tool",
};

export default function TermsOfServicePage() {
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
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand">
              <FileText className="h-6 w-6" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Terms of Service</h1>
          </div>
          <p className="text-lg text-foreground-secondary">
            Please read these terms carefully before using AI Radiologist.
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
            These Terms of Service (&quot;Terms&quot;) govern your use of AI Radiologist (&quot;Service&quot;),
            operated by [Company Legal Name] (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
            By accessing or using the Service, you agree to be bound by these Terms. If you do not
            agree to these Terms, do not use the Service.
          </p>
        </section>

        {/* Key Clauses - Prominent Display */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-foreground">Important Notices</h2>

          {/* Clause 1: NOT A MEDICAL DEVICE */}
          <div className="mb-6 rounded-xl border-2 border-warning/30 bg-warning-light/30 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/20 text-warning">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-bold text-foreground">
                  1. NOT A MEDICAL DEVICE
                </h3>
                <p className="text-foreground-secondary leading-relaxed">
                  This software is a documentation drafting tool. It is <strong className="text-foreground">not a medical
                  device</strong>, does not provide medical advice, and is not intended to diagnose, treat,
                  cure, prevent any disease, or replace professional medical judgment. The Service is
                  designed solely to assist licensed healthcare professionals with documentation tasks.
                </p>
              </div>
            </div>
          </div>

          {/* Clause 2: USER RESPONSIBILITY */}
          <div className="mb-6 rounded-xl border border-border bg-surface p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-bold text-foreground">
                  2. USER RESPONSIBILITY
                </h3>
                <p className="text-foreground-secondary leading-relaxed">
                  You represent and warrant that you are a <strong className="text-foreground">licensed healthcare
                  professional</strong> authorized to practice in your jurisdiction. You assume <strong className="text-foreground">full
                  responsibility</strong> for reviewing, editing, verifying, and approving any content generated
                  by this tool before any clinical, diagnostic, or patient care use. All AI-generated content
                  must be treated as a draft requiring your professional review and validation.
                </p>
              </div>
            </div>
          </div>

          {/* Clause 3: NO PHI INPUT */}
          <div className="mb-6 rounded-xl border border-border bg-surface p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-bold text-foreground">
                  3. NO PROTECTED HEALTH INFORMATION (PHI)
                </h3>
                <p className="text-foreground-secondary leading-relaxed">
                  <strong className="text-foreground">Do not enter patient-identifiable information</strong> into
                  the Service. You are solely responsible for de-identifying any content you input, in
                  accordance with applicable privacy laws and regulations including HIPAA. The Service is
                  not designed to receive, process, or store PHI. Any PHI entered is your responsibility
                  and done in violation of these Terms.
                </p>
              </div>
            </div>
          </div>

          {/* Clause 4: NO DATA STORAGE */}
          <div className="mb-6 rounded-xl border border-border bg-surface p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-bold text-foreground">
                  4. EPHEMERAL PROCESSING - NO DATA STORAGE
                </h3>
                <p className="text-foreground-secondary leading-relaxed">
                  We do not store, retain, or have access to any transcription content, generated reports,
                  or audio recordings. <strong className="text-foreground">All processing is ephemeral</strong> -
                  content is processed in real-time and immediately discarded after your session. We only
                  store account information (email, display name), usage metadata (report counts,
                  transcription minutes), and payment information necessary for billing.
                </p>
              </div>
            </div>
          </div>

          {/* Clause 5: USE AT YOUR OWN RISK */}
          <div className="mb-6 rounded-xl border border-border bg-surface p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-bold text-foreground">
                  5. USE AT YOUR OWN RISK - NO WARRANTIES
                </h3>
                <p className="text-foreground-secondary leading-relaxed">
                  This Service is provided <strong className="text-foreground">&quot;AS IS&quot; and &quot;AS AVAILABLE&quot;</strong> without
                  warranties of any kind, either express or implied, including but not limited to implied
                  warranties of merchantability, fitness for a particular purpose, accuracy, completeness,
                  or non-infringement. We do not warrant that the Service will be uninterrupted, error-free,
                  or that any content generated will be accurate or suitable for clinical use. You use
                  the Service at your own risk and accept full liability for its use in your practice.
                </p>
              </div>
            </div>
          </div>

          {/* Clause 6: INDEMNIFICATION */}
          <div className="mb-6 rounded-xl border border-border bg-surface p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-bold text-foreground">
                  6. INDEMNIFICATION
                </h3>
                <p className="text-foreground-secondary leading-relaxed">
                  You agree to <strong className="text-foreground">indemnify, defend, and hold harmless</strong> [Company Legal Name],
                  its officers, directors, employees, agents, and affiliates from and against any and all
                  claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys&apos;
                  fees) arising out of or related to: (a) your use of the Service; (b) any content you input
                  or generate using the Service; (c) your violation of these Terms; (d) your violation of
                  any applicable laws, regulations, or professional standards; or (e) any claim by a third
                  party arising from your use of AI-generated content in your professional practice.
                </p>
              </div>
            </div>
          </div>

          {/* Clause 7: LIMITATION OF LIABILITY */}
          <div className="mb-6 rounded-xl border-2 border-error/30 bg-error-light/30 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-error/20 text-error">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-bold text-foreground">
                  7. LIMITATION OF LIABILITY
                </h3>
                <p className="text-foreground-secondary leading-relaxed">
                  <strong className="text-foreground">IN NO EVENT</strong> shall [Company Legal Name], its officers, directors,
                  employees, or agents be liable for any indirect, incidental, special, consequential,
                  punitive, or exemplary damages, including but not limited to damages for loss of profits,
                  goodwill, data, or other intangible losses, arising out of or related to your use of the
                  Service. We shall not be liable for any <strong className="text-foreground">clinical decisions, patient outcomes,
                  diagnostic errors, treatment decisions, or professional consequences</strong> arising from
                  the use of this tool. Our total liability for any claims arising from these Terms or
                  your use of the Service shall not exceed the amount you paid us in the twelve (12)
                  months preceding the claim.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Additional Terms */}
        <section className="mb-12 space-y-8">
          <div>
            <h2 className="mb-4 text-2xl font-bold text-foreground">Eligibility</h2>
            <p className="text-foreground-secondary leading-relaxed">
              The Service is intended solely for use by licensed healthcare professionals, including
              but not limited to radiologists, physicians, and other medical practitioners authorized
              to interpret medical imaging and generate radiology reports. By using the Service, you
              confirm that you meet these eligibility requirements.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-foreground">Acceptable Use</h2>
            <p className="text-foreground-secondary leading-relaxed mb-4">
              You agree to use the Service only for lawful purposes and in accordance with these Terms.
              You agree not to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground-secondary">
              <li>Use the Service for any purpose other than professional healthcare documentation</li>
              <li>Input any patient-identifiable information or protected health information</li>
              <li>Share your account credentials with others</li>
              <li>Attempt to reverse engineer, decompile, or otherwise extract the source code</li>
              <li>Use the Service to generate content that is false, misleading, or harmful</li>
              <li>Interfere with or disrupt the Service or servers connected to the Service</li>
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-foreground">Account and Billing</h2>
            <p className="text-foreground-secondary leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials.
              Subscription fees are billed in advance on a monthly basis. You may cancel your
              subscription at any time, with cancellation effective at the end of the current billing
              period. Refunds are provided at our sole discretion. We reserve the right to modify
              pricing with 30 days&apos; notice.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-foreground">Intellectual Property</h2>
            <p className="text-foreground-secondary leading-relaxed">
              The Service, including its design, features, and underlying technology, is owned by
              [Company Legal Name] and protected by intellectual property laws. You retain ownership
              of any content you input or generate using the Service. We do not claim ownership of
              your generated reports.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-foreground">Third-Party Services</h2>
            <p className="text-foreground-secondary leading-relaxed">
              The Service uses third-party providers including OpenAI for AI processing and Stripe
              for payment processing. Your use of the Service is also subject to the terms and
              privacy policies of these third-party providers. We are not responsible for the
              practices of third-party providers.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-foreground">Modifications to Terms</h2>
            <p className="text-foreground-secondary leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify you of material
              changes by posting the updated Terms on the Service and updating the &quot;Last updated&quot; date.
              Your continued use of the Service after any modifications constitutes acceptance of the
              updated Terms.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-foreground">Termination</h2>
            <p className="text-foreground-secondary leading-relaxed">
              We may terminate or suspend your access to the Service immediately, without prior notice
              or liability, for any reason, including breach of these Terms. Upon termination, your
              right to use the Service will immediately cease. Provisions that by their nature should
              survive termination shall survive, including indemnification, limitation of liability,
              and dispute resolution.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-foreground">Governing Law and Dispute Resolution</h2>
            <p className="text-foreground-secondary leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the
              State of Delaware, United States, without regard to its conflict of law provisions.
              Any disputes arising from these Terms or your use of the Service shall be resolved
              through binding arbitration in accordance with the rules of the American Arbitration
              Association.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-foreground">Severability</h2>
            <p className="text-foreground-secondary leading-relaxed">
              If any provision of these Terms is found to be unenforceable or invalid, that provision
              shall be limited or eliminated to the minimum extent necessary, and the remaining
              provisions shall remain in full force and effect.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-foreground">Contact Us</h2>
            <p className="text-foreground-secondary leading-relaxed">
              If you have any questions about these Terms, please contact us at:{" "}
              <a
                href="mailto:legal@airad.io"
                className="text-brand hover:text-brand-strong underline"
              >
                legal@airad.io
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
                href="/privacy"
                className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
              >
                Privacy Policy
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

"use client";

import Link from "next/link";
import {
  Mic,
  FileText,
  Sparkles,
  Shield,
  Zap,
  CheckCircle2,
  ArrowRight,
  Brain,
  Clock,
  Lock,
  BarChart3,
  Layers
} from "lucide-react";
import { DemoAnimation } from "./demo-animation";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-muted/30 via-background to-surface-muted">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-10 inline-flex items-center gap-3 rounded-2xl border-2 border-brand/30 bg-gradient-to-r from-brand-light via-brand-muted/80 to-brand-light px-6 py-3.5 text-base font-bold text-brand shadow-lg backdrop-blur-sm animate-fade-in">
              <Sparkles className="h-5 w-5 animate-pulse" />
              <span className="bg-gradient-to-r from-brand to-brand-strong bg-clip-text text-transparent">
                AI-Powered Radiology Reporting
              </span>
            </div>
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Report Faster.
              <br />
              <span className="bg-gradient-to-r from-brand to-brand-strong bg-clip-text text-transparent">
                Think Smarter.
              </span>
            </h1>
            <p className="mb-10 text-xl text-foreground-secondary sm:text-2xl">
              Transform your radiology workflow with AI-assisted transcription and report generation.
              Generate comprehensive reports in seconds, not minutes.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-xl bg-brand px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-brand-strong hover:shadow-xl"
              >
                Try Platform Free
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-border bg-surface px-8 py-4 text-base font-semibold text-foreground transition-all hover:bg-surface-muted"
              >
                Sign In
              </Link>
            </div>
            <p className="mt-6 text-sm text-foreground-muted">
              No credit card required • Start in seconds
            </p>
          </div>
        </div>
      </section>

      {/* Demo Animation Section */}
      <DemoAnimation
        screenshots={[
          {
            id: "workspace-dashboard",
            imageSrc: "/demo-screenshots/01-workspace-dashboard.webp",
            title: "Workspace",
            marketingTitle: "Your Complete AI Reporting Hub",
            marketingDescription: "The streamlined workspace features Voice Input and Report panels side-by-side. Click 'Start Recording' to dictate or 'Upload Audio' to process existing files. The transcription panel shows your text in real-time with character count.",
            marketingBenefit: "Everything you need in one elegant interface—no learning curve",
            duration: 4500,
            zoomFocus: { x: 50, y: 50 },
          },
          {
            id: "voice-input-text",
            imageSrc: "/demo-screenshots/12-voice-input-with-text.webp",
            title: "Transcribe",
            marketingTitle: "Dictate or Type Your Findings",
            marketingDescription: "Your transcription appears instantly in the panel. The interface shows 'CT scan of the chest with contrast was performed...' as you dictate. Edit directly in the text area or continue recording. Your observations are ready for AI report generation.",
            marketingBenefit: "Seamless voice-to-text with real-time editing capabilities",
            duration: 4500,
            zoomFocus: { x: 50, y: 50 },
          },
          {
            id: "template-selection",
            imageSrc: "/demo-screenshots/14-template-selection-dropdown.webp",
            title: "Report",
            marketingTitle: "Choose Your Report Template",
            marketingDescription: "Select from organized template categories: CT (Chest, Abdomen/Pelvis), MRI (Brain, Spine), X-Ray (Chest, Skeletal). Templates are grouped by modality for quick access. Click any template to use it for your report generation.",
            marketingBenefit: "Find the right template instantly with organized categories",
            duration: 4500,
            zoomFocus: { x: 50, y: 40 },
          },
          {
            id: "generated-report",
            imageSrc: "/demo-screenshots/15-generated-report.webp",
            title: "Report",
            marketingTitle: "AI-Generated Professional Report",
            marketingDescription: "Your complete radiology report with structured sections: Clinical Indication, Technique, Findings, and Impression. The AI transforms your dictation into a properly formatted report with numbered impression points. Export to PDF or Word with one click.",
            marketingBenefit: "Publication-ready reports in seconds, not minutes",
            duration: 4500,
            zoomFocus: { x: 50, y: 50 },
          },
          {
            id: "templates-library",
            imageSrc: "/demo-screenshots/02-templates-library.webp",
            title: "Templates",
            marketingTitle: "Manage Your Report Templates",
            marketingDescription: "The Templates page organizes Personal and Global templates separately. Search, sort by name or date, and filter by type. Click '+ Create Template' to build your own. Empty state guides you to create or clone templates.",
            marketingBenefit: "Full control over your template library with easy organization",
            duration: 4500,
            zoomFocus: { x: 50, y: 50 },
          },
          {
            id: "template-pathways",
            imageSrc: "/demo-screenshots/03-template-creation-pathways.webp",
            title: "Templates",
            marketingTitle: "Four Ways to Create Templates",
            marketingDescription: "Choose your creation path: 'Start from scratch' to build manually, 'Describe your template' for AI generation, 'Start from existing' to clone, or 'Import JSON' for bulk import. Each pathway optimizes for different workflows.",
            marketingBenefit: "Create templates your way—manual, AI-assisted, clone, or import",
            duration: 4500,
            zoomFocus: { x: 50, y: 50 },
          },
          {
            id: "ai-template-gen",
            imageSrc: "/demo-screenshots/04-ai-template-generation.webp",
            title: "Templates",
            marketingTitle: "Generate Templates with AI",
            marketingDescription: "Describe the template you need in plain language: 'CT chest with contrast for pulmonary embolism workup.' Select optional modality and body part. Click 'Generate Template' and AI creates a complete, structured template.",
            marketingBenefit: "Describe what you need—AI builds the template for you",
            duration: 4500,
            zoomFocus: { x: 50, y: 50 },
          },
          {
            id: "template-editor",
            imageSrc: "/demo-screenshots/05-template-editor.webp",
            title: "Templates",
            marketingTitle: "Full-Featured Template Editor",
            marketingDescription: "Split-pane editor shows form controls on left, live preview on right. Add template name, select modality and body part, write description. Add sections like Findings and Impression. AI suggestions help structure your template.",
            marketingBenefit: "See your template preview in real-time as you build",
            duration: 4500,
            zoomFocus: { x: 50, y: 50 },
          },
          {
            id: "branding",
            imageSrc: "/demo-screenshots/06-branding-templates.webp",
            title: "Branding",
            marketingTitle: "Professional Report Branding",
            marketingDescription: "Customize your report appearance with brand templates. Choose Default Letterhead, Minimalist, or Corporate Blue styles. Each shows a color swatch preview. Create new brand templates or edit existing ones to match your institution.",
            marketingBenefit: "Make every report reflect your professional identity",
            duration: 4500,
            zoomFocus: { x: 50, y: 50 },
          },
          {
            id: "macros",
            imageSrc: "/demo-screenshots/07-macros-library.webp",
            title: "Macros",
            marketingTitle: "Speed Up with Transcription Macros",
            marketingDescription: "Create shortcuts that expand during transcription. Type 'neg' and it becomes 'negative for acute findings.' Import/Export macros, create categories, and manage your shortcut library. The Active Macros list shows all your configured shortcuts.",
            marketingBenefit: "Type less, report more with intelligent text expansion",
            duration: 4500,
            zoomFocus: { x: 50, y: 50 },
          },
          {
            id: "macro-creation",
            imageSrc: "/demo-screenshots/08-macro-creation.webp",
            title: "Macros",
            marketingTitle: "Create Custom Macros",
            marketingDescription: "Define your shortcut and expansion text. Enable 'Smart Macro' for context-aware expansion that changes based on body part. The clean dialog makes macro creation simple—just fill in the fields and click Create.",
            marketingBenefit: "Build macros that adapt to your reporting context",
            duration: 4500,
            zoomFocus: { x: 50, y: 50 },
          },
          {
            id: "productivity",
            imageSrc: "/demo-screenshots/09-productivity-insights.webp",
            title: "Analytics",
            marketingTitle: "Track Your Productivity",
            marketingDescription: "View key metrics: Total Reports, Average Report Time (45s), Productivity Score, and Time Saved. Charts show Reports Per Day/Week trends. See Most Used Templates and Transcription Usage. Tips help you work even faster.",
            marketingBenefit: "Data-driven insights to continuously improve your workflow",
            duration: 4500,
            zoomFocus: { x: 50, y: 50 },
          },
          {
            id: "billing",
            imageSrc: "/demo-screenshots/10-billing-subscription.webp",
            title: "Billing",
            marketingTitle: "Simple, Transparent Billing",
            marketingDescription: "View your Current Plan and Usage This Month at a glance. See reports generated, transcription minutes, and personal templates used. Upgrade easily from Free to Plus ($15/mo) or Pro ($35/mo) for more capacity.",
            marketingBenefit: "Always know your usage—no surprise charges",
            duration: 4500,
            zoomFocus: { x: 50, y: 50 },
          },
          {
            id: "settings",
            imageSrc: "/demo-screenshots/11-settings.webp",
            title: "Settings",
            marketingTitle: "Personalize Your Experience",
            marketingDescription: "Customize appearance with Light/Dark/System themes. Enable Compact Mode for denser layout. Toggle Auto-save, set a Default Template. Security features and Profile management round out the settings.",
            marketingBenefit: "Make AI Radiologist work exactly how you prefer",
            duration: 4500,
            zoomFocus: { x: 50, y: 50 },
          },
        ]}
        autoPlay={true}
        loop={true}
        transitionDuration={4000}
      />

      {/* Features Grid */}
      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="mb-4 text-4xl font-bold text-foreground">
            Everything You Need to Report Faster
          </h2>
          <p className="text-lg text-foreground-secondary">
            Powerful features designed by radiologists, for radiologists
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1: Real-time Transcription */}
          <div className="group rounded-2xl border border-border/40 bg-surface p-8 shadow-sm transition-all hover:border-brand/30 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand">
              <Mic className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-foreground">Real-Time Transcription</h3>
            <p className="text-foreground-secondary">
              Dictate your findings with ChatGPT-like accuracy. Our AI transcribes in real-time,
              understanding medical terminology and context automatically.
            </p>
          </div>

          {/* Feature 2: AI Report Generation */}
          <div className="group rounded-2xl border border-border/40 bg-surface p-8 shadow-sm transition-all hover:border-brand/30 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-foreground">AI Report Generation</h3>
            <p className="text-foreground-secondary">
              Generate comprehensive, structured reports in seconds. Choose from templates or create
              your own—all powered by advanced AI that understands radiology workflows.
            </p>
          </div>

          {/* Feature 3: Template Library */}
          <div className="group rounded-2xl border border-border/40 bg-surface p-8 shadow-sm transition-all hover:border-brand/30 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-foreground">Smart Templates</h3>
            <p className="text-foreground-secondary">
              Browse global templates or create personalized ones. Clone, customize, and manage
              templates for every modality and body part.
            </p>
          </div>

          {/* Feature 4: Macros */}
          <div className="group rounded-2xl border border-border/40 bg-surface p-8 shadow-sm transition-all hover:border-brand/30 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-foreground">Transcription Macros</h3>
            <p className="text-foreground-secondary">
              Speed up your workflow with custom macros. Expand shortcuts into full phrases
              automatically during transcription.
            </p>
          </div>

          {/* Feature 5: Privacy First */}
          <div className="group rounded-2xl border border-border/40 bg-surface p-8 shadow-sm transition-all hover:border-brand/30 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-success-light text-success">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-foreground">Privacy First</h3>
            <p className="text-foreground-secondary">
              We never store your audio recordings or generated reports. Only user profiles and
              billing information are retained—your patient data stays private.
            </p>
          </div>

          {/* Feature 6: Export Options */}
          <div className="group rounded-2xl border border-border/40 bg-surface p-8 shadow-sm transition-all hover:border-brand/30 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-foreground">Multiple Export Formats</h3>
            <p className="text-foreground-secondary">
              Download reports as Markdown, HTML, or PDF. Copy to clipboard with one click.
              Seamlessly integrate into your existing workflow.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-surface-muted py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="mb-4 text-4xl font-bold text-foreground">
              Why Radiologists Choose Us
            </h2>
            <p className="text-lg text-foreground-secondary">
              Built to save you time and improve accuracy
            </p>
          </div>

          <div className="grid gap-12 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-light text-brand">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-foreground">87% Faster</h3>
              <p className="text-foreground-secondary">
                Generate comprehensive reports in seconds instead of minutes.
                Spend more time on diagnosis, less on documentation.
              </p>
            </div>

            <div className="text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-light text-brand">
                <Brain className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-foreground">AI-Powered Accuracy</h3>
              <p className="text-foreground-secondary">
                Advanced AI understands medical terminology and context.
                Automatic corrections and refinements ensure clarity.
              </p>
            </div>

            <div className="text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-light text-brand">
                <BarChart3 className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-foreground">Increase Productivity</h3>
              <p className="text-foreground-secondary">
                Handle more cases daily with streamlined workflows.
                Reduce dictation time by up to 50% while maintaining quality.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="mb-4 text-4xl font-bold text-foreground">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-foreground-secondary">
            Start free, upgrade when you need more
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Free Tier */}
          <div className="relative rounded-xl border-2 border-surface-border bg-surface p-6">
            <h3 className="text-2xl font-bold text-foreground mb-2">Free</h3>
            <div className="mb-2">
              <span className="text-3xl font-bold text-foreground">$0</span>
              <span className="text-foreground-secondary">/month</span>
            </div>
            <p className="text-sm text-foreground-muted mb-4">No card required</p>
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                <span className="text-foreground-secondary">10 reports/month</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                <span className="text-foreground-secondary">15 min transcription</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                <span className="text-foreground-secondary">3 templates</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                <span className="text-foreground-secondary">Basic PDF export</span>
              </div>
            </div>
            <Link
              href="/signup"
              className="block w-full rounded-lg bg-surface-muted px-4 py-2 text-center font-semibold text-foreground transition-all hover:bg-surface-border"
            >
              Get Started
            </Link>
          </div>

          {/* Plus Tier - Recommended */}
          <div className="relative rounded-xl border-2 border-brand bg-gradient-to-br from-brand-muted/20 to-surface p-6">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white px-4 py-1 rounded-full text-sm font-semibold">
              Recommended
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Plus</h3>
            <div className="mb-2">
              <span className="text-3xl font-bold text-foreground">$15</span>
              <span className="text-foreground-secondary">/month</span>
            </div>
            <p className="text-sm text-foreground-muted mb-4">Best for professionals</p>
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                <span className="text-foreground-secondary">100 reports/month</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                <span className="text-foreground-secondary">150 min transcription</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                <span className="text-foreground-secondary">20 templates</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                <span className="text-foreground-secondary">Template versioning</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                <span className="text-foreground-secondary">Word/DOCX export</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                <span className="text-foreground-secondary">Priority support</span>
              </div>
            </div>
            <Link
              href="/billing"
              className="block w-full rounded-lg bg-brand px-4 py-2 text-center font-semibold text-white transition-all hover:bg-brand-strong"
            >
              Subscribe
            </Link>
          </div>

          {/* Enterprise Tier */}
          <div className="relative rounded-xl border-2 border-surface-border bg-surface p-6">
            <h3 className="text-2xl font-bold text-foreground mb-2">Enterprise</h3>
            <div className="mb-2">
              <span className="text-3xl font-bold text-foreground">Custom</span>
            </div>
            <p className="text-sm text-foreground-muted mb-4">For institutions</p>
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                <span className="text-foreground-secondary">Unlimited reports</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                <span className="text-foreground-secondary">Unlimited transcription</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                <span className="text-foreground-secondary">Custom templates</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                <span className="text-foreground-secondary">Institution features</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                <span className="text-foreground-secondary">Dedicated support</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                <span className="text-foreground-secondary">Custom integrations</span>
              </div>
            </div>
            <a
              href="mailto:contact@askdigitalconsultancy.com?subject=Enterprise%20Plan%20Inquiry"
              className="block w-full rounded-lg bg-surface-muted px-4 py-2 text-center font-semibold text-foreground transition-all hover:bg-surface-border"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8">
        <div className="rounded-2xl border border-success/20 bg-success-light/30 p-12 text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 text-success">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="mb-4 text-3xl font-bold text-foreground">
            Your Privacy is Our Priority
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-foreground-secondary mb-6">
            We are committed to protecting your data and patient information.
            <strong className="text-foreground"> We do not store any audio recordings or generated report content.</strong>
          </p>
          <div className="mx-auto max-w-xl space-y-3 text-left">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
              <p className="text-foreground-secondary">
                <strong className="text-foreground">Audio recordings:</strong> Processed and immediately deleted. Never stored.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
              <p className="text-foreground-secondary">
                <strong className="text-foreground">Generated reports:</strong> Created on-demand. Not persisted on our servers.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
              <p className="text-foreground-secondary">
                <strong className="text-foreground">What we store:</strong> Only your user profile and billing information for account management.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
              <p className="text-foreground-secondary">
                <strong className="text-foreground">Compliance:</strong> HIPAA-friendly processing with zero PHI persistence.
                All logs are redacted to protect sensitive information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-brand/10 via-brand-muted/20 to-background py-20">
        <div className="mx-auto max-w-4xl px-6 text-center sm:px-8">
          <h2 className="mb-4 text-4xl font-bold text-foreground">
            Ready to Transform Your Workflow?
          </h2>
          <p className="mb-10 text-xl text-foreground-secondary">
            Join radiologists who are already reporting faster and more accurately.
            Start your free trial today—no credit card required.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-xl bg-brand px-10 py-5 text-lg font-bold text-white shadow-lg transition-all hover:bg-brand-strong hover:shadow-xl"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-border bg-surface px-10 py-5 text-lg font-semibold text-foreground transition-all hover:bg-surface-muted"
            >
              Sign In to Existing Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface-muted">
        <div className="mx-auto max-w-7xl px-6 py-8 sm:px-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="text-center sm:text-left">
              <p className="text-sm text-foreground-muted">
                &copy; 2026 AI Radiologist. All rights reserved.
              </p>
              <p className="mt-1 text-xs text-foreground-muted">
                For licensed healthcare professionals only.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <Link
                href="/terms"
                className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              <a
                href="mailto:contact@askdigitalconsultancy.com"
                className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

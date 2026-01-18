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
            id: "transcribe-home",
            imageSrc: "/demo-screenshots/1-transcribe home.png",
            title: "Transcribe",
            marketingTitle: "Start by Transcribing Your Findings",
            marketingDescription: "The Transcribe page shows step 1 with clear instructions. Click the purple 'Start Recording' button to begin real-time transcription, or use the 'Upload' button to select audio files. The large empty transcript area below will display your transcribed text as you dictate.",
            marketingBenefit: "Begin dictating immediately—no setup or configuration needed",
            duration: 4500,
            zoomFocus: { x: 50, y: 45 },
          },
          {
            id: "file-upload",
            imageSrc: "/demo-screenshots/2-file upload.png",
            title: "Transcribe",
            marketingTitle: "Upload Audio Files",
            marketingDescription: "Click 'Upload' to select audio files from your computer. Browse folders, search for files, and select formats like M4A, MP3, or WAV. The file selection dialog makes it easy to find and upload your existing recordings.",
            marketingBenefit: "Upload existing recordings from any location on your device",
            duration: 4500,
            zoomFocus: { x: 50, y: 50 },
          },
          {
            id: "recording-in-progress",
            imageSrc: "/demo-screenshots/3-recording in progress.png",
            title: "Transcribe",
            marketingTitle: "Recording in Progress",
            marketingDescription: "While recording, the 'Start Recording' button changes to a red 'Stop Recording' button. The step 1 indicator shows 'Start by transcribing your findings' with instructions. The transcript area displays your real-time transcription as you speak.",
            marketingBenefit: "Real-time audio capture with clear visual feedback",
            duration: 4500,
            zoomFocus: { x: 50, y: 50 },
          },
          {
            id: "transcribing",
            imageSrc: "/demo-screenshots/4-transribing.png",
            title: "Transcribe",
            marketingTitle: "AI Processing Your Audio",
            marketingDescription: "After stopping recording or uploading, a purple circular loading spinner appears in the center of the transcript area with 'Transcribing...' text below it. The step 1 indicator and instructions remain visible. Our AI is converting your audio to text with medical terminology recognition.",
            marketingBenefit: "Professional-grade transcription that understands medical context",
            duration: 4500,
            zoomFocus: { x: 50, y: 50 },
          },
          {
            id: "select-template",
            imageSrc: "/demo-screenshots/5-select template.png",
            title: "Report",
            marketingTitle: "Select a Template to Begin",
            marketingDescription: "The Report page shows step 2 with a purple circle badge displaying '2'. A light grey box displays 'Select a template' with instructions: 'Choose a template that matches your exam type to generate the report.' The empty report area shows 'No report generated yet' with a document icon. Click the purple 'Select Template' button in the top right to proceed.",
            marketingBenefit: "Guided workflow ensures you never miss a step",
            duration: 4500,
            zoomFocus: { x: 50, y: 30 },
          },
          {
            id: "choose-template",
            imageSrc: "/demo-screenshots/6-choose template.png",
            title: "Templates",
            marketingTitle: "Search and Select Templates",
            marketingDescription: "The 'Select template' modal appears with a search bar. Below is a 'NOTE TEMPLATES' section listing matching templates. Each entry shows the template name, a Global/Personal tag, modality and body part info, and a lightning bolt icon. Click any template to select it.",
            marketingBenefit: "Find the perfect template in seconds with instant search",
            duration: 4500,
            zoomFocus: { x: 50, y: 40 },
          },
          {
            id: "ready-to-generate",
            imageSrc: "/demo-screenshots/7-ready to generate.png",
            title: "Report",
            marketingTitle: "Ready to Generate Your Report",
            marketingDescription: "A light green banner appears with a star icon showing 'Ready to generate' and instructions. Below it is a large purple 'Generate Report' button with a star icon. The report area shows 'No report generated yet' with a document icon. Your selected template is displayed in the top right.",
            marketingBenefit: "One click to transform transcript into professional report",
            duration: 4500,
            zoomFocus: { x: 50, y: 40 },
          },
          {
            id: "generating-report",
            imageSrc: "/demo-screenshots/8-generating report.png",
            title: "Report",
            marketingTitle: "AI Generating Your Report",
            marketingDescription: "The green banner still shows 'Ready to generate'. The purple button now displays 'Generating...' with a circular loading spinner inside it. In the center of the empty report area, a larger purple circular spinner appears with 'Generating report...' text below it, showing the AI is actively processing.",
            marketingBenefit: "Real-time feedback shows your report is being created",
            duration: 4500,
            zoomFocus: { x: 50, y: 50 },
          },
          {
            id: "generated-report",
            imageSrc: "/demo-screenshots/9-generated report.png",
            title: "Report",
            marketingTitle: "Your Report is Complete",
            marketingDescription: "The report panel displays the full radiology report. At the top left is 'Report generated' text. The title shows the exam type and patient information. Structured sections include Clinical Information, Technique, Comparison, and Findings. Export buttons (Copy, MD, HTML, PDF, Regenerate) appear at the top right.",
            marketingBenefit: "Publication-ready reports that follow best practices",
            duration: 4500,
            zoomFocus: { x: 50, y: 50 },
          },
          {
            id: "templates-library",
            imageSrc: "/demo-screenshots/10-templates library.png",
            title: "Templates",
            marketingTitle: "Browse Your Template Library",
            marketingDescription: "The Templates page shows a grid of template cards. Use the 'Global' and 'Personal' tabs to filter templates. Each card displays the template name, modality and body part tags, description, version label (v1), and a 'Clone' button. Use the search bar to find specific templates.",
            marketingBenefit: "Quickly find templates by browsing visual cards",
            duration: 4500,
            zoomFocus: { x: 50, y: 50 },
          },
          {
            id: "create-template",
            imageSrc: "/demo-screenshots/11-create template.png",
            title: "Templates",
            marketingTitle: "Clone from Existing Templates",
            marketingDescription: "The 'Create template' modal shows 'Clone from existing' selected (purple background). Below is a search bar and Global/Personal tabs showing template counts. The main area lists templates with their names, tags (MRI, Chest, Global, etc.), and descriptions. Click 'Save' after selecting a template to clone.",
            marketingBenefit: "Build on proven templates instead of starting from scratch",
            duration: 4500,
            zoomFocus: { x: 50, y: 50 },
          },
          {
            id: "create-template-blank-ai",
            imageSrc: "/demo-screenshots/12-create template from blank using AI.png",
            title: "Templates",
            marketingTitle: "Create Templates from Scratch with AI",
            marketingDescription: "The 'Create template' modal shows 'Blank template' selected (purple background). The left section has fields for Template Name, Modality, Body Part, Description, and a 'Set as default' checkbox. The right section shows the template content editor with a 'Structure with AI' button that helps you create template syntax automatically.",
            marketingBenefit: "Create templates that match your exact workflow with AI assistance",
            duration: 4500,
            zoomFocus: { x: 50, y: 50 },
          },
          {
            id: "macro-library",
            imageSrc: "/demo-screenshots/13-macro library.png",
            title: "Macros",
            marketingTitle: "Manage Your Transcription Macros",
            marketingDescription: "The Macros page shows a search bar at the top and a grid of macro cards below. Each card displays the trigger phrase (e.g., 'normal chest', 'BMI') in bold, a match mode tag (like 'WORD BOUNDARY'), and the expanded text description. A purple '+ New macro' button appears in the top right navigation.",
            marketingBenefit: "See all your shortcuts at a glance for faster dictation",
            duration: 4500,
            zoomFocus: { x: 50, y: 50 },
          },
          {
            id: "create-macro",
            imageSrc: "/demo-screenshots/14-create marco.png",
            title: "Macros",
            marketingTitle: "Create Custom Macros",
            marketingDescription: "The 'Create Macro' modal shows fields for 'TRIGGER PHRASE' (with placeholder 'e.g., normal chest'), 'EXPANDED TEXT' (large textarea with placeholder), 'MATCH MODE' dropdown (showing 'Exact Match'), and a 'CASE SENSITIVE' toggle switch. Helper text explains each field. 'Cancel' and 'Save' buttons appear at the bottom.",
            marketingBenefit: "Customize macros to match your exact dictation patterns",
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                <span className="text-foreground-secondary">10 transcriptions/month</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                <span className="text-foreground-secondary">20 reports/month</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                <span className="text-foreground-secondary">All templates</span>
              </div>
            </div>
            <Link
              href="/signup"
              className="block w-full rounded-lg bg-surface-muted px-4 py-2 text-center font-semibold text-foreground transition-all hover:bg-surface-border"
            >
              Get Started
            </Link>
          </div>

          {/* Starter Tier */}
          <div className="relative rounded-xl border-2 border-surface-border bg-surface p-6">
            <h3 className="text-2xl font-bold text-foreground mb-2">Starter</h3>
            <div className="mb-2">
              <span className="text-3xl font-bold text-foreground">$0</span>
              <span className="text-foreground-secondary">/month</span>
            </div>
            <p className="text-sm text-foreground-muted mb-4">Card verified</p>
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                <span className="text-foreground-secondary">10 transcriptions/month</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                <span className="text-foreground-secondary">20 reports/month</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                <span className="text-foreground-secondary">All templates</span>
              </div>
            </div>
            <Link
              href="/signup"
              className="block w-full rounded-lg bg-surface-muted px-4 py-2 text-center font-semibold text-foreground transition-all hover:bg-surface-border"
            >
              Activate Free
            </Link>
          </div>

          {/* Plus Tier - Most Popular */}
          <div className="relative rounded-xl border-2 border-brand bg-gradient-to-br from-brand-muted/20 to-surface p-6">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white px-4 py-1 rounded-full text-sm font-semibold">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Plus</h3>
            <div className="mb-2">
              <span className="text-3xl font-bold text-foreground">$10</span>
              <span className="text-foreground-secondary">/month</span>
            </div>
            <p className="text-sm text-foreground-muted mb-4">Best value</p>
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                <span className="text-foreground-secondary">100 transcriptions/month</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                <span className="text-foreground-secondary">200 reports/month</span>
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

          {/* Pro Tier */}
          <div className="relative rounded-xl border-2 border-surface-border bg-surface p-6">
            <h3 className="text-2xl font-bold text-foreground mb-2">Pro</h3>
            <div className="mb-2">
              <span className="text-3xl font-bold text-foreground">$25</span>
              <span className="text-foreground-secondary">/month</span>
            </div>
            <p className="text-sm text-foreground-muted mb-4">Power users</p>
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                <span className="text-foreground-secondary">500 transcriptions/month</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                <span className="text-foreground-secondary">1,000 reports/month</span>
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
    </div>
  );
}

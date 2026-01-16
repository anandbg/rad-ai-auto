'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';
import {
  Download,
  Sparkles,
  RotateCcw,
  ScrollText,
  ChevronDown,
  Mic,
  MicOff,
  FileText,
  Loader2,
  Stethoscope,
} from 'lucide-react';
import { WorkspaceTabs, WorkspaceTab } from './workspace-tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/shared/cn';

interface ReportWorkspaceProps {
  selectedTemplateId?: string;
  onTemplateSelect?: (id: string) => void;
}

const templates = [
  { id: 'ct-chest', label: 'CT Chest', category: 'CT' },
  { id: 'ct-abdomen', label: 'CT Abdomen/Pelvis', category: 'CT' },
  { id: 'mri-brain', label: 'MRI Brain', category: 'MRI' },
  { id: 'mri-spine', label: 'MRI Spine', category: 'MRI' },
  { id: 'xray-chest', label: 'X-Ray Chest', category: 'X-Ray' },
  { id: 'xray-skeletal', label: 'X-Ray Skeletal', category: 'X-Ray' },
];

export function ReportWorkspace({ selectedTemplateId, onTemplateSelect }: ReportWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('context');
  const [contextText, setContextText] = useState('');
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setTimeout(() => {
      setReportContent(`
        <h2>Radiology Report</h2>
        <p><strong>Procedure:</strong> ${selectedTemplate?.label || 'Diagnostic Imaging'}</p>
        <p><strong>Clinical History:</strong> ${contextText.slice(0, 100)}...</p>
        <h3>Findings</h3>
        <p>AI-generated findings will appear here based on your clinical context and selected template.</p>
        <h3>Impression</h3>
        <p>Summary impression based on the analysis.</p>
      `);
      setIsGenerating(false);
      setActiveTab('report');
    }, 1500);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleClear = () => {
    setContextText('');
    setReportContent(null);
    setActiveTab('context');
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-slate-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50">
      {/* Header */}
      <header className="relative border-b border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        {/* Subtle top accent line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent" />

        <div className="flex items-center justify-between px-6 py-4">
          {/* Left: Title & Template */}
          <div className="flex items-center gap-5">
            {/* Icon & Title */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand/10 to-brand/5 ring-1 ring-brand/10">
                <Stethoscope className="h-5 w-5 text-brand" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  New Report
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  AI-assisted radiology reporting
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />

            {/* Template Selector */}
            <div className="relative">
              <button
                onClick={() => setTemplateOpen(!templateOpen)}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-4 py-2.5",
                  "bg-slate-50 dark:bg-slate-800/50",
                  "border border-slate-200 dark:border-slate-700",
                  "hover:border-slate-300 dark:hover:border-slate-600",
                  "hover:bg-slate-100 dark:hover:bg-slate-800",
                  "transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                )}
              >
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {selectedTemplate?.label || 'Select Template'}
                </span>
                <ChevronDown className={cn(
                  "h-4 w-4 text-slate-400 transition-transform duration-200",
                  templateOpen && "rotate-180"
                )} />
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {templateOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setTemplateOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-full z-20 mt-2 w-64 origin-top-left rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/50 dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/50"
                    >
                      {['CT', 'MRI', 'X-Ray'].map(category => (
                        <div key={category} className="mb-2 last:mb-0">
                          <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            {category}
                          </div>
                          {templates.filter(t => t.category === category).map(template => (
                            <button
                              key={template.id}
                              onClick={() => {
                                onTemplateSelect?.(template.id);
                                setTemplateOpen(false);
                              }}
                              className={cn(
                                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm",
                                "transition-colors duration-100",
                                selectedTemplateId === template.id
                                  ? "bg-brand/10 text-brand font-medium"
                                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50"
                              )}
                            >
                              {template.label}
                            </button>
                          ))}
                        </div>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Clear - Tertiary */}
            <button
              onClick={handleClear}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium",
                "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
                "hover:bg-slate-100 dark:hover:bg-slate-800",
                "transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50"
              )}
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>

            {/* Export - Secondary */}
            <button
              onClick={handleExportPDF}
              disabled={!reportContent}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium",
                "border border-slate-200 dark:border-slate-700",
                "bg-white dark:bg-slate-800",
                "text-slate-700 dark:text-slate-200",
                "hover:bg-slate-50 dark:hover:bg-slate-700",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-800",
                "transition-all duration-150",
                "shadow-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50"
              )}
            >
              <Download className="h-4 w-4" />
              <span>Export PDF</span>
            </button>

            {/* Generate - Primary */}
            <button
              onClick={handleGenerate}
              disabled={!contextText || isGenerating}
              className={cn(
                "relative flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold",
                "bg-brand text-white",
                "hover:bg-brand/90",
                "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-brand",
                "transition-all duration-150",
                "shadow-md shadow-brand/25 hover:shadow-lg hover:shadow-brand/30",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2"
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Report</span>
                </>
              )}

              {/* Subtle shine effect */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <WorkspaceTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasReport={!!reportContent}
        hasContext={!!contextText}
      />

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="h-full p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="h-full"
            >
              {activeTab === 'context' && (
                <ContextTab value={contextText} onChange={setContextText} />
              )}
              {activeTab === 'transcribe' && (
                <TranscribeTab
                  onTranscriptionComplete={(text) => {
                    setContextText(prev => prev ? `${prev}\n\n${text}` : text);
                    setActiveTab('context');
                  }}
                />
              )}
              {activeTab === 'report' && (
                <ReportTab content={reportContent} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Tab Content Components
// ============================================

function ContextTab({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="h-full flex flex-col">
      {/* Card Container */}
      <div className={cn(
        "flex-1 flex flex-col rounded-2xl",
        "bg-white dark:bg-slate-800/50",
        "border border-slate-200/80 dark:border-slate-700/50",
        "shadow-sm shadow-slate-100 dark:shadow-none",
        "overflow-hidden"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Clinical Context & Findings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter patient history, indication, technique, and observations
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
            {value.length} characters
          </div>
        </div>

        {/* Textarea */}
        <div className="flex-1 p-1">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Example:

CLINICAL HISTORY: 65-year-old male with chronic cough and weight loss. Rule out malignancy.

TECHNIQUE: CT chest with IV contrast, 1.25mm slice thickness.

FINDINGS:
- Lungs: 2.3cm spiculated nodule in the right upper lobe...
- Mediastinum: No lymphadenopathy...
- Pleura: No effusion...
- Bones: Degenerative changes..."
            className={cn(
              "h-full w-full resize-none p-4",
              "bg-transparent",
              "text-sm text-slate-700 dark:text-slate-200",
              "placeholder:text-slate-400 dark:placeholder:text-slate-500",
              "focus:outline-none",
              "font-mono leading-relaxed"
            )}
          />
        </div>
      </div>
    </div>
  );
}

function TranscribeTab({ onTranscriptionComplete }: { onTranscriptionComplete: (text: string) => void }) {
  const [isRecording, setIsRecording] = useState(false);

  const handleToggleRecording = () => {
    if (isRecording) {
      // Stop recording and send text
      setIsRecording(false);
      onTranscriptionComplete('Sample transcribed clinical findings from voice input...');
    } else {
      setIsRecording(true);
    }
  };

  return (
    <div className="h-full flex items-center justify-center">
      <div className={cn(
        "w-full max-w-md p-8 rounded-2xl text-center",
        "bg-white dark:bg-slate-800/50",
        "border border-slate-200/80 dark:border-slate-700/50",
        "shadow-sm shadow-slate-100 dark:shadow-none"
      )}>
        {/* Microphone Button */}
        <div className="mb-6">
          <button
            onClick={handleToggleRecording}
            className={cn(
              "relative mx-auto flex h-24 w-24 items-center justify-center rounded-full",
              "transition-all duration-300",
              isRecording
                ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            )}
          >
            {isRecording ? (
              <MicOff className="h-10 w-10" />
            ) : (
              <Mic className="h-10 w-10" />
            )}

            {/* Pulse animation when recording */}
            {isRecording && (
              <>
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25" />
                <span className="absolute inset-0 rounded-full border-4 border-red-300 animate-pulse" />
              </>
            )}
          </button>
        </div>

        {/* Status */}
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          {isRecording ? 'Recording...' : 'Voice Transcription'}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {isRecording
            ? 'Speak clearly. Click the button again to stop and transcribe.'
            : 'Click the microphone to start dictating your findings. Whisper AI will transcribe your speech.'}
        </p>

        {/* Action Button */}
        <Button
          onClick={handleToggleRecording}
          variant={isRecording ? 'outline' : 'default'}
          className={cn(
            isRecording && "border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
          )}
        >
          {isRecording ? 'Stop & Transcribe' : 'Start Recording'}
        </Button>
      </div>
    </div>
  );
}

function ReportTab({ content }: { content: string | null }) {
  if (!content) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className={cn(
          "w-full max-w-md p-8 rounded-2xl text-center",
          "bg-white dark:bg-slate-800/50",
          "border border-slate-200/80 dark:border-slate-700/50",
          "border-dashed",
          "shadow-none"
        )}>
          <div className="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700">
            <ScrollText className="h-8 w-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            No Report Generated
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Enter your clinical context in Step 1, then click{' '}
            <span className="font-medium text-brand">&quot;Generate Report&quot;</span>{' '}
            to create an AI-assisted radiology report.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className={cn(
        "h-full rounded-2xl overflow-hidden",
        "bg-white dark:bg-slate-800/50",
        "border border-slate-200/80 dark:border-slate-700/50",
        "shadow-sm shadow-slate-100 dark:shadow-none"
      )}>
        {/* Report Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <ScrollText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Generated Report
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI-generated • Review and edit before finalizing
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Ready
          </span>
        </div>

        {/* Report Content */}
        <div className="p-6 overflow-auto h-[calc(100%-72px)]">
          <article
            className="prose prose-slate dark:prose-invert prose-sm max-w-none prose-headings:font-semibold prose-h2:text-lg prose-h3:text-base prose-p:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
    </div>
  );
}

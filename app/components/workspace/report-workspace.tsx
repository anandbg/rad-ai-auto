'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  CheckCircle2,
  Upload,
} from 'lucide-react';
import { WorkspaceTabs, WorkspaceTab } from './workspace-tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/shared/cn';

interface Template {
  id: string;
  label: string;
  category: string;
  bodyPart?: string;
}

interface ReportWorkspaceProps {
  selectedTemplateId?: string;
  onTemplateSelect?: (id: string) => void;
}

// Fallback templates for when API fails or user is not authenticated
const fallbackTemplates: Template[] = [
  { id: 'ct-chest', label: 'CT Chest', category: 'CT', bodyPart: 'Chest' },
  { id: 'ct-abdomen', label: 'CT Abdomen/Pelvis', category: 'CT', bodyPart: 'Abdomen' },
  { id: 'mri-brain', label: 'MRI Brain', category: 'MRI', bodyPart: 'Brain' },
  { id: 'mri-spine', label: 'MRI Spine', category: 'MRI', bodyPart: 'Spine' },
  { id: 'xray-chest', label: 'X-Ray Chest', category: 'X-Ray', bodyPart: 'Chest' },
  { id: 'xray-skeletal', label: 'X-Ray Skeletal', category: 'X-Ray', bodyPart: 'Skeletal' },
];

export function ReportWorkspace({ selectedTemplateId, onTemplateSelect }: ReportWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('transcribe');
  const [transcription, setTranscription] = useState('');
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [localTemplateId, setLocalTemplateId] = useState(selectedTemplateId);
  const shouldReduceMotion = useReducedMotion();

  // Template loading state
  const [templates, setTemplates] = useState<Template[]>(fallbackTemplates);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  // Load templates from API on mount
  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch('/api/templates/list');
        if (res.ok) {
          const data = await res.json();
          if (data.data && data.data.length > 0) {
            setTemplates(data.data.map((t: { id: string; name: string; modality: string; bodyPart?: string }) => ({
              id: t.id,
              label: t.name,
              category: t.modality,
              bodyPart: t.bodyPart,
            })));
          }
          // If no templates returned, keep fallback templates
        }
      } catch (error) {
        console.error('Failed to load templates:', error);
        // Keep fallback templates on error
      } finally {
        setIsLoadingTemplates(false);
      }
    }
    loadTemplates();
  }, []);

  const effectiveTemplateId = selectedTemplateId ?? localTemplateId;

  const handleTemplateSelect = (id: string) => {
    setLocalTemplateId(id);
    onTemplateSelect?.(id);
    setTemplateOpen(false);
  };

  const handleGenerate = async () => {
    if (!transcription || !effectiveTemplateId) return;

    setIsGenerating(true);
    setReportContent(''); // Clear previous
    setActiveTab('report');

    const template = templates.find(t => t.id === effectiveTemplateId);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: effectiveTemplateId,
          templateName: template?.label || 'General',
          modality: template?.category || 'CT',
          bodyPart: template?.bodyPart || 'Chest',
          findings: transcription,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Generation failed');
      }

      // Stream the response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        setReportContent(prev => (prev || '') + chunk);
      }
    } catch (error) {
      console.error('Generation error:', error);
      setReportContent(
        error instanceof Error
          ? `Error generating report: ${error.message}`
          : 'Error generating report. Please try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleClear = () => {
    setTranscription('');
    setReportContent(null);
    setActiveTab('transcribe');
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-slate-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50">
      {/* Header - Simplified without template selector */}
      <header className="relative border-b border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent" />

        <div className="flex items-center justify-between px-6 py-4">
          {/* Left: Title */}
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

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Clear */}
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

            {/* Export PDF */}
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

            {/* Generate Report */}
            <button
              onClick={handleGenerate}
              disabled={!transcription || !effectiveTemplateId || isGenerating}
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
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <WorkspaceTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasReport={!!reportContent}
        hasTranscription={!!transcription}
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
              {activeTab === 'transcribe' && (
                <TranscribeTab
                  transcription={transcription}
                  onTranscriptionChange={setTranscription}
                />
              )}
              {activeTab === 'report' && (
                <ReportTab
                  content={reportContent}
                  selectedTemplateId={effectiveTemplateId}
                  onTemplateSelect={handleTemplateSelect}
                  templateOpen={templateOpen}
                  setTemplateOpen={setTemplateOpen}
                  templates={templates}
                  isLoadingTemplates={isLoadingTemplates}
                />
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

function TranscribeTab({
  transcription,
  onTranscriptionChange,
}: {
  transcription: string;
  onTranscriptionChange: (text: string) => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Handle transcription API call
  const handleTranscribe = async (audioBlob: Blob | File) => {
    setIsTranscribing(true);
    setTranscriptionError(null);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Transcription failed');
      }

      const data = await res.json();
      onTranscriptionChange(
        transcription ? `${transcription}\n\n${data.transcript}` : data.transcript
      );
    } catch (error) {
      console.error('Transcription error:', error);
      setTranscriptionError(
        error instanceof Error ? error.message : 'Failed to transcribe audio'
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleTranscribe(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle live recording toggle
  const handleToggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          handleTranscribe(audioBlob);
          // Stop all tracks to release microphone
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        setTranscriptionError(null);
      } catch (error) {
        console.error('Failed to start recording:', error);
        setTranscriptionError(
          'Could not access microphone. Please check your browser permissions.'
        );
      }
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {/* Left: Recording controls */}
      <div className={cn(
        "flex flex-col items-center justify-center p-8 rounded-2xl",
        "bg-white dark:bg-slate-800/50",
        "border border-slate-200/80 dark:border-slate-700/50",
        "shadow-sm",
        "lg:w-80 lg:shrink-0"
      )}>
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".mp3,.wav,.m4a,.webm,.mp4,.mpeg"
          className="hidden"
        />

        {/* Microphone Button */}
        <div className="mb-6">
          <button
            onClick={handleToggleRecording}
            disabled={isTranscribing}
            className={cn(
              "relative flex h-28 w-28 items-center justify-center rounded-full",
              "transition-all duration-300 ease-out",
              "focus-visible:outline-none focus-visible:ring-4",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isRecording
                ? "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-xl shadow-red-500/40 focus-visible:ring-red-300"
                : isTranscribing
                  ? "bg-gradient-to-br from-brand/80 to-brand text-white shadow-xl shadow-brand/40"
                  : "bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-600 dark:text-slate-300 hover:scale-105 focus-visible:ring-brand/30"
            )}
          >
            {isTranscribing ? (
              <Loader2 className="h-12 w-12 animate-spin" />
            ) : isRecording ? (
              <MicOff className="h-12 w-12" />
            ) : (
              <Mic className="h-12 w-12" />
            )}

            {/* Pulse animation */}
            {isRecording && (
              <>
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20" />
                <span className="absolute inset-[-4px] rounded-full border-2 border-red-300/50 animate-pulse" />
              </>
            )}
          </button>
        </div>

        {/* Status text */}
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 text-center">
          {isTranscribing ? 'Transcribing...' : isRecording ? 'Recording...' : 'Voice Input'}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6 max-w-xs">
          {isTranscribing
            ? 'Processing audio with AI transcription...'
            : isRecording
              ? 'Speak clearly. Click to stop and transcribe.'
              : 'Click the microphone to dictate your observations.'}
        </p>

        {/* Error message */}
        {transcriptionError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 text-center max-w-xs">
            {transcriptionError}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Button
            onClick={handleToggleRecording}
            size="lg"
            variant={isRecording ? 'outline' : 'primary'}
            disabled={isTranscribing}
            className={cn(
              "w-full",
              isRecording && "border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
            )}
          >
            {isTranscribing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Transcribing...
              </>
            ) : isRecording ? (
              'Stop & Transcribe'
            ) : (
              'Start Recording'
            )}
          </Button>

          {/* Upload Audio Button */}
          <Button
            onClick={() => fileInputRef.current?.click()}
            size="lg"
            variant="outline"
            disabled={isRecording || isTranscribing}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Audio
          </Button>
        </div>
      </div>

      {/* Right: Transcription preview */}
      <div className={cn(
        "flex-1 flex flex-col rounded-2xl overflow-hidden",
        "bg-white dark:bg-slate-800/50",
        "border border-slate-200/80 dark:border-slate-700/50",
        "shadow-sm"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/20">
              <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Transcription
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your dictated observations appear here
              </p>
            </div>
          </div>
          {transcription && (
            <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
              {transcription.length} characters
            </span>
          )}
        </div>

        {/* Transcription Content */}
        <div className="flex-1 p-1">
          <textarea
            value={transcription}
            onChange={(e) => onTranscriptionChange(e.target.value)}
            placeholder="Your voice transcription will appear here. You can also type or edit directly..."
            className={cn(
              "h-full w-full resize-none p-4",
              "bg-transparent",
              "text-sm text-slate-700 dark:text-slate-200",
              "placeholder:text-slate-400 dark:placeholder:text-slate-500",
              "focus:outline-none",
              "leading-relaxed"
            )}
          />
        </div>
      </div>
    </div>
  );
}

interface ReportTabProps {
  content: string | null;
  selectedTemplateId?: string;
  onTemplateSelect: (id: string) => void;
  templateOpen: boolean;
  setTemplateOpen: (open: boolean) => void;
  templates: Template[];
  isLoadingTemplates: boolean;
}

function ReportTab({
  content,
  selectedTemplateId,
  onTemplateSelect,
  templateOpen,
  setTemplateOpen,
  templates,
  isLoadingTemplates,
}: ReportTabProps) {
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  // Get unique categories from templates (dynamic grouping)
  const categories = [...new Set(templates.map(t => t.category))];

  return (
    <div className="h-full flex flex-col">
      {/* Template selector bar at top of report */}
      <div className={cn(
        "flex items-center justify-between px-5 py-3 rounded-t-2xl",
        "bg-slate-50 dark:bg-slate-800/70",
        "border border-b-0 border-slate-200/80 dark:border-slate-700/50"
      )}>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Template:
          </span>

          {/* Template Selector */}
          <div className="relative">
            <button
              onClick={() => setTemplateOpen(!templateOpen)}
              disabled={isLoadingTemplates}
              className={cn(
                "group flex items-center gap-2 rounded-lg px-3 py-2",
                "bg-white dark:bg-slate-700",
                "border border-slate-200 dark:border-slate-600",
                "hover:border-brand/50 dark:hover:border-brand/50",
                "transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
                "shadow-sm",
                "disabled:opacity-50 disabled:cursor-wait"
              )}
            >
              {isLoadingTemplates ? (
                <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 text-slate-400" />
              )}
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {isLoadingTemplates ? 'Loading...' : (selectedTemplate?.label || 'Select Template')}
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
                    className="absolute left-0 top-full z-20 mt-2 w-64 origin-top-left rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-800"
                  >
                    {categories.map(category => {
                      const categoryTemplates = templates.filter(t => t.category === category);
                      if (categoryTemplates.length === 0) return null;
                      return (
                        <div key={category} className="mb-2 last:mb-0">
                          <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            {category}
                          </div>
                          {categoryTemplates.map(template => (
                            <button
                              key={template.id}
                              onClick={() => onTemplateSelect(template.id)}
                              className={cn(
                                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm",
                                "transition-colors duration-100",
                                selectedTemplateId === template.id
                                  ? "bg-brand/10 text-brand font-medium"
                                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50"
                              )}
                            >
                              {selectedTemplateId === template.id && (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                              {template.label}
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {content && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Generated
          </span>
        )}
      </div>

      {/* Report Content */}
      <div className={cn(
        "flex-1 rounded-b-2xl overflow-hidden",
        "bg-white dark:bg-slate-800/50",
        "border border-t-0 border-slate-200/80 dark:border-slate-700/50",
        "shadow-sm"
      )}>
        {!content ? (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700">
                <ScrollText className="h-8 w-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                No Report Yet
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Record your observations using Voice Input, select a template above, then click{' '}
                <span className="font-medium text-brand">&quot;Generate Report&quot;</span>{' '}
                to create your AI-assisted radiology report.
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-auto">
            {/* Report Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
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

            {/* Report Body */}
            <div className="p-6">
              <article className="prose prose-slate dark:prose-invert prose-sm max-w-none prose-headings:font-semibold prose-h2:text-lg prose-h3:text-base prose-p:leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </article>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

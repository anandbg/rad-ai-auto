'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';
// PDF/Word export libraries dynamically imported from @/lib/export/*
import {
  Download,
  Sparkles,
  RotateCcw,
  FileText,
  Loader2,
  Stethoscope,
} from 'lucide-react';
import { WorkspaceTabs, WorkspaceTab } from './workspace-tabs';
import { TranscribeTab } from './transcribe-tab';
import { ReportTab, type Template } from './report-tab';
import { cn } from '@/lib/shared/cn';
import { usePreferences } from '@/lib/preferences/preferences-context';

// Brand template interface for PDF/Word export styling
interface BrandTemplate {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  institutionName: string;
  institutionAddress: string;
  footerText: string;
  createdAt: string;
  updatedAt: string;
}

// Get user's default brand template from localStorage
function getDefaultBrandTemplate(userId: string | undefined): BrandTemplate | null {
  if (typeof window === 'undefined') return null;
  const key = userId ? `ai-rad-brand-templates-${userId}` : 'ai-rad-brand-templates';
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  try {
    const templates = JSON.parse(stored) as BrandTemplate[];
    return templates.find((t) => t.isDefault) || templates[0] || null;
  } catch {
    return null;
  }
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

  // Get user preferences for list styles
  const { preferences } = usePreferences();

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

  const handleExportPDF = async () => {
    if (!reportContent) return;

    // Dynamic import to keep jsPDF library out of initial bundle (~280KB)
    const { generatePDF } = await import('@/lib/export/pdf-generator');

    const brandTemplate = getDefaultBrandTemplate(undefined);
    const selectedTemplate = templates.find(t => t.id === effectiveTemplateId);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');

    await generatePDF(reportContent, `radiology-report-${timestamp}.pdf`, {
      templateName: selectedTemplate?.label,
      modality: selectedTemplate?.category,
      bodyPart: selectedTemplate?.bodyPart,
      brandTemplate: brandTemplate ? {
        primaryColor: brandTemplate.primaryColor,
        institutionName: brandTemplate.institutionName,
        institutionAddress: brandTemplate.institutionAddress,
        footerText: brandTemplate.footerText,
      } : null,
      listStylePreferences: preferences.listStylePreferences,
    });
  };

  const handleExportWord = async () => {
    if (!reportContent) return;

    // Dynamic import to keep docx library out of initial bundle (~350KB)
    const { generateWord } = await import('@/lib/export/word-generator');

    const brandTemplate = getDefaultBrandTemplate(undefined);
    const selectedTemplate = templates.find(t => t.id === effectiveTemplateId);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');

    await generateWord(reportContent, `radiology-report-${timestamp}.docx`, {
      templateName: selectedTemplate?.label,
      modality: selectedTemplate?.category,
      bodyPart: selectedTemplate?.bodyPart,
      brandTemplate: brandTemplate ? {
        institutionName: brandTemplate.institutionName,
        institutionAddress: brandTemplate.institutionAddress,
        footerText: brandTemplate.footerText,
      } : null,
      listStylePreferences: preferences.listStylePreferences,
    });
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

            {/* Download Word */}
            <button
              onClick={handleExportWord}
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
              <FileText className="h-4 w-4" />
              <span>Download Word</span>
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


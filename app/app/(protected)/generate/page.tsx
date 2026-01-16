'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth/auth-context';
import { usePreferences } from '@/lib/preferences/preferences-context';
import { saveDraft as saveToIndexedDB, getDraft as getFromIndexedDB, isOnline, onOnlineStatusChange, type Draft } from '@/lib/storage/indexeddb';

// Draft storage key
const GENERATE_DRAFT_KEY = 'ai-rad-generate-draft';
const INDEXEDDB_DRAFT_ID = 'generate-report-draft';

// Template interface
interface Template {
  id: string;
  name: string;
  modality: string;
  bodyPart: string;
  description: string;
  isGlobal: boolean;
  content?: string;
  createdAt: string;
  updatedAt: string;
}

// Plan limits (Free plan)
const REPORT_LIMIT = 10;

// Draft interface for generate page
interface GenerateDraft {
  templateId: string;
  findings: string;
  savedAt: string;
}

// Get user-specific draft key
function getDraftKey(userId: string | undefined): string {
  return userId ? `${GENERATE_DRAFT_KEY}-${userId}` : GENERATE_DRAFT_KEY;
}

// Save draft to localStorage
function saveDraft(draft: GenerateDraft, userId: string | undefined): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getDraftKey(userId), JSON.stringify(draft));
}

// Load draft from localStorage
function loadDraft(userId: string | undefined): GenerateDraft | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(getDraftKey(userId));
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// Clear draft from localStorage
function clearDraft(userId: string | undefined): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(getDraftKey(userId));
}

export default function GeneratePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { preferences } = usePreferences();
  const searchParams = useSearchParams();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [findings, setFindings] = useState('');
  const [generatedReport, setGeneratedReport] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [defaultApplied, setDefaultApplied] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  // Offline status state
  const [online, setOnline] = useState(true);
  const [offlineDraftSaved, setOfflineDraftSaved] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  // YOLO mode state
  const [yoloMode, setYoloMode] = useState(false);
  const [yoloModality, setYoloModality] = useState<string | null>(null);
  const [yoloAutoSelected, setYoloAutoSelected] = useState(false);

  // Section regeneration state
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);

  // Generation cancellation refs
  const generationCancelledRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Credits state
  const [creditsRemaining, setCreditsRemaining] = useState<number>(REPORT_LIMIT);
  const [noCreditsDialogOpen, setNoCreditsDialogOpen] = useState(false);

  // Track online/offline status
  useEffect(() => {
    setOnline(isOnline());
    const unsubscribe = onOnlineStatusChange((status) => {
      setOnline(status);
      if (status) {
        showToast('You are back online', 'success');
        setOfflineDraftSaved(false);
      } else {
        showToast('You are offline. Drafts will be saved locally.', 'warning');
      }
    });
    return unsubscribe;
  }, [showToast]);

  // Load credits from Supabase
  useEffect(() => {
    async function loadCredits() {
      if (!user?.id) return;

      try {
        const { createSupabaseBrowserClient } = await import('@/lib/supabase/client');
        const supabase = createSupabaseBrowserClient();

        // Get credits balance from credits_ledger
        const { data: ledger } = await supabase
          .from('credits_ledger')
          .select('delta')
          .eq('user_id', user.id);

        const totalCredits = ledger?.reduce((sum, entry) => sum + entry.delta, 0) || REPORT_LIMIT;
        setCreditsRemaining(Math.max(0, totalCredits));
      } catch (error) {
        console.error('Error loading credits:', error);
        setCreditsRemaining(REPORT_LIMIT); // Default to free plan limit
      }
    }

    loadCredits();

    // Reload on focus
    const handleFocus = () => loadCredits();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user?.id]);

  // Load draft from IndexedDB on mount
  useEffect(() => {
    async function loadIndexedDBDraft() {
      if (!user?.id) return;
      try {
        const draftId = `${INDEXEDDB_DRAFT_ID}-${user.id}`;
        const draft = await getFromIndexedDB(draftId);
        if (draft && draft.data) {
          const data = draft.data as { templateId?: string; findings?: string };
          if (data.findings && !findings) {
            setFindings(data.findings);
            if (data.templateId) {
              setSelectedTemplateId(data.templateId);
              setDefaultApplied(true);
            }
            setDraftRestored(true);
            setDraftSavedAt(draft.savedAt);
            if (draft.isOffline) {
              showToast('Offline draft recovered', 'info');
            }
          }
        }
      } catch (error) {
        console.error('Error loading IndexedDB draft:', error);
      }
    }
    loadIndexedDBDraft();
  }, [user?.id]);

  // Save to IndexedDB when offline
  const saveToIndexedDBDraft = useCallback(async () => {
    if (!user?.id || !findings.trim()) return;
    try {
      const draftId = `${INDEXEDDB_DRAFT_ID}-${user.id}`;
      const draft: Draft = {
        id: draftId,
        type: 'report',
        userId: user.id,
        data: {
          templateId: selectedTemplateId,
          findings,
        },
        savedAt: new Date().toISOString(),
        isOffline: !online,
      };
      await saveToIndexedDB(draft);
      if (!online) {
        setOfflineDraftSaved(true);
      }
    } catch (error) {
      console.error('Error saving to IndexedDB:', error);
    }
  }, [user?.id, findings, selectedTemplateId, online]);

  // Auto-save to IndexedDB when content changes (especially when offline)
  useEffect(() => {
    if (findings.trim()) {
      const timeoutId = setTimeout(saveToIndexedDBDraft, 1000);
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [findings, selectedTemplateId, saveToIndexedDBDraft]);

  // Load templates from Supabase on mount and when user changes
  useEffect(() => {
    async function loadTemplates() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { createSupabaseBrowserClient } = await import('@/lib/supabase/client');
        const supabase = createSupabaseBrowserClient();

        // Fetch personal templates
        const { data: personalTemplates } = await supabase
          .from('templates_personal')
          .select('*')
          .eq('user_id', user.id);

        // Fetch published global templates
        const { data: globalTemplates } = await supabase
          .from('templates_global')
          .select('*')
          .eq('is_published', true);

        // Convert to Template interface
        const personal: Template[] = (personalTemplates || []).map(t => ({
          id: t.id,
          name: t.name,
          modality: t.modality,
          bodyPart: t.body_part,
          description: t.description || '',
          isGlobal: false,
          content: t.content?.sections?.map((s: { name: string; content?: string }) =>
            `${s.name}:\n${s.content || ''}`
          ).join('\n\n') || '',
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        }));

        const global: Template[] = (globalTemplates || []).map(t => ({
          id: t.id,
          name: t.name,
          modality: t.modality,
          bodyPart: t.body_part,
          description: t.description || '',
          isGlobal: true,
          content: t.content?.sections?.map((s: { name: string; content?: string }) =>
            `${s.name}:\n${s.content || ''}`
          ).join('\n\n') || '',
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        }));

        setTemplates([...personal, ...global]);
      } catch (error) {
        console.error('Error loading templates:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadTemplates();
  }, [user?.id]);

  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft(user?.id);
    if (draft && draft.findings) {
      setFindings(draft.findings);
      if (draft.templateId) {
        setSelectedTemplateId(draft.templateId);
        setDefaultApplied(true); // Don't apply default if draft has template
      }
      setDraftRestored(true);
      setDraftSavedAt(draft.savedAt);
    }
  }, [user?.id]);

  // Check for YOLO mode URL parameters and transcript from transcribe page
  useEffect(() => {
    const modality = searchParams.get('modality');
    const isYolo = searchParams.get('yolo') === 'true';
    const fromTranscribe = searchParams.get('from_transcribe') === 'true';

    if (isYolo && modality) {
      setYoloMode(true);
      setYoloModality(modality);
    }

    // Check if navigating from transcription page with transcript data
    if (fromTranscribe && typeof window !== 'undefined') {
      const transcript = localStorage.getItem('ai-rad-transcribe-to-generate');
      if (transcript) {
        setFindings(transcript);
        setDraftRestored(true);
        setDraftSavedAt(new Date().toISOString());
        // Clear the transfer storage to avoid re-populating on page refresh
        localStorage.removeItem('ai-rad-transcribe-to-generate');
        showToast('Transcript loaded from transcription', 'success');
      }
    }
  }, [searchParams, showToast]);

  // YOLO Mode: Auto-select template based on modality
  useEffect(() => {
    if (yoloMode && yoloModality && !yoloAutoSelected && !isLoading && templates.length > 0) {
      // Find the best matching template for the detected modality
      const matchingTemplates = templates.filter(
        t => t.modality.toLowerCase() === yoloModality.toLowerCase()
      );

      if (matchingTemplates.length > 0) {
        // Prefer personal templates over global ones
        const personalMatch = matchingTemplates.find(t => !t.isGlobal);
        const bestMatch = personalMatch ?? matchingTemplates[0];

        if (bestMatch) {
          setSelectedTemplateId(bestMatch.id);
          setYoloAutoSelected(true);
          setDefaultApplied(true); // Prevent default template from overriding

          showToast(
            `YOLO: Auto-selected "${bestMatch.name}" for ${yoloModality}`,
            'success'
          );
        }
      } else {
        showToast(
          `No template found for ${yoloModality}. Please select manually.`,
          'warning'
        );
        setYoloAutoSelected(true);
      }
    }
  }, [yoloMode, yoloModality, yoloAutoSelected, isLoading, templates, showToast]);

  // Apply default template from preferences on initial load (only if no draft and not YOLO mode)
  useEffect(() => {
    if (!defaultApplied && !isLoading && templates.length > 0 && preferences.defaultTemplate && !yoloMode) {
      // Check if the default template exists in available templates
      const templateExists = templates.some(t => t.id === preferences.defaultTemplate);
      if (templateExists && selectedTemplateId === '') {
        setSelectedTemplateId(preferences.defaultTemplate);
      }
      setDefaultApplied(true);
    }
  }, [defaultApplied, isLoading, templates, preferences.defaultTemplate, selectedTemplateId, yoloMode]);

  // Save draft when form data changes (debounced)
  const saveCurrentDraft = useCallback(() => {
    // Only save if there's meaningful content
    if (findings.trim()) {
      const draft: GenerateDraft = {
        templateId: selectedTemplateId,
        findings,
        savedAt: new Date().toISOString(),
      };
      saveDraft(draft, user?.id);
    }
  }, [findings, selectedTemplateId, user?.id]);

  // Auto-save draft on form changes
  useEffect(() => {
    if (findings.trim()) {
      const timeoutId = setTimeout(saveCurrentDraft, 500); // Debounce 500ms
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [findings, selectedTemplateId, saveCurrentDraft]);

  // Clear draft handler
  const handleClearDraft = () => {
    clearDraft(user?.id);
    setFindings('');
    // Reset to default template or empty
    if (preferences.defaultTemplate) {
      setSelectedTemplateId(preferences.defaultTemplate);
    } else {
      setSelectedTemplateId('');
    }
    setDraftRestored(false);
    setDraftSavedAt(null);
    showToast('Draft cleared', 'info');
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const handleGenerate = async () => {
    if (!selectedTemplateId || !findings.trim()) return;

    // Check for remaining credits
    if (creditsRemaining <= 0) {
      setNoCreditsDialogOpen(true);
      return;
    }

    setIsGenerating(true);
    setGeneratedReport(''); // Clear previous report
    generationCancelledRef.current = false;

    // Create AbortController for cancellation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const template = templates.find(t => t.id === selectedTemplateId);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          findings,
          templateName: template?.name || 'Unknown',
          modality: template?.modality || 'Unknown',
          bodyPart: template?.bodyPart || 'Unknown',
          templateContent: template?.content,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Generation failed (${response.status})`);
      }

      // Read streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        // Check if cancelled
        if (generationCancelledRef.current) {
          reader.cancel();
          return;
        }

        // Decode and accumulate text
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setGeneratedReport(accumulated);
      }

      // Final update with complete report
      setGeneratedReport(accumulated);

      // Clear the draft after successful generation
      clearDraft(user?.id);
      setDraftRestored(false);
      setDraftSavedAt(null);

      // Decrement credits
      setCreditsRemaining(prev => Math.max(0, prev - 1));

      // Record usage in Supabase
      try {
        const { createSupabaseBrowserClient } = await import('@/lib/supabase/client');
        const supabase = createSupabaseBrowserClient();
        await supabase.from('credits_ledger').insert({
          user_id: user?.id,
          delta: -1,
          reason: 'debit',
          meta: { action: 'report_generation', template_id: selectedTemplateId },
          idempotency_key: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        });
      } catch (error) {
        console.error('Error recording credit usage:', error);
      }

    } catch (error) {
      // Handle AbortError gracefully (user cancelled)
      if (error instanceof Error && error.name === 'AbortError') {
        // Already handled by handleCancelGeneration
        return;
      }

      // Show error toast for other errors
      console.error('Generation error:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to generate report. Please try again.',
        'error'
      );
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelGeneration = () => {
    generationCancelledRef.current = true;
    // Abort the fetch request if in progress
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    showToast('Report generation cancelled', 'info');
  };

  // Parse report into sections
  const parseReportSections = (report: string): { name: string; content: string }[] => {
    const sections: { name: string; content: string }[] = [];
    const lines = report.split('\n');
    let currentSection = '';
    let currentContent: string[] = [];
    const headerSection: string[] = [];
    let inHeader = true;

    for (const line of lines) {
      // Check if this is a section header (all caps followed by colon)
      const sectionMatch = line.match(/^([A-Z][A-Z\s]+):$/);

      if (sectionMatch) {
        // Save previous section if exists
        if (currentSection && currentContent.length > 0) {
          sections.push({ name: currentSection, content: currentContent.join('\n').trim() });
        }

        // If we were in header, save it
        if (inHeader && headerSection.length > 0) {
          sections.push({ name: 'HEADER', content: headerSection.join('\n').trim() });
          inHeader = false;
        }

        currentSection = sectionMatch[1] ?? '';
        currentContent = [];
      } else if (line.startsWith('---')) {
        // Footer separator
        if (currentSection && currentContent.length > 0) {
          sections.push({ name: currentSection, content: currentContent.join('\n').trim() });
          currentSection = '';
          currentContent = [];
        }
        sections.push({ name: 'FOOTER', content: lines.slice(lines.indexOf(line)).join('\n').trim() });
        break;
      } else if (inHeader) {
        headerSection.push(line);
      } else {
        currentContent.push(line);
      }
    }

    // Add final section if exists
    if (currentSection && currentContent.length > 0) {
      sections.push({ name: currentSection, content: currentContent.join('\n').trim() });
    }

    return sections;
  };

  // Regenerate a specific section
  const handleRegenerateSection = async (sectionName: string) => {
    if (!generatedReport || regeneratingSection) return;

    setRegeneratingSection(sectionName);

    // Simulate AI regeneration (in production, this would call OpenAI with specific instructions)
    await new Promise(resolve => setTimeout(resolve, 1000));

    const sections = parseReportSections(generatedReport);
    const sectionIndex = sections.findIndex(s => s.name === sectionName);

    const section = sections[sectionIndex];
    if (sectionIndex !== -1 && section) {
      // Generate new content for the section
      let newContent = '';

      if (sectionName === 'FINDINGS') {
        newContent = 'The heart size is within normal limits. The lungs demonstrate no focal consolidation, effusion, or pneumothorax. The mediastinal contours are normal. No acute osseous abnormalities are identified.';
      } else if (sectionName === 'IMPRESSION') {
        newContent = 'No acute cardiopulmonary process. Stable examination compared to prior, if available.';
      } else if (sectionName === 'CLINICAL INDICATION') {
        newContent = findings.trim();
      } else if (sectionName === 'TECHNIQUE') {
        newContent = 'Standard radiographic technique was employed using appropriate exposure parameters.';
      } else {
        // Default regeneration
        newContent = section.content + ' [Regenerated]';
      }

      section.content = newContent;

      // Rebuild the report
      let newReport = '';
      for (const section of sections) {
        if (section.name === 'HEADER') {
          newReport += section.content + '\n\n';
        } else if (section.name === 'FOOTER') {
          newReport += section.content;
        } else {
          newReport += `${section.name}:\n${section.content}\n\n`;
        }
      }

      setGeneratedReport(newReport.trim());
      showToast(`${sectionName} section regenerated`, 'success');
    }

    setRegeneratingSection(null);
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedReport);
      showToast('Report copied to clipboard!', 'success');
    } catch {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  // Copy individual section to clipboard
  const handleCopySectionToClipboard = async (sectionName: string, sectionContent: string) => {
    try {
      // Format the section with its header for context
      const formattedContent = sectionName === 'HEADER' || sectionName === 'FOOTER'
        ? sectionContent
        : `${sectionName}:\n${sectionContent}`;
      await navigator.clipboard.writeText(formattedContent);
      showToast(`${sectionName} copied to clipboard!`, 'success');
    } catch {
      showToast('Failed to copy section to clipboard', 'error');
    }
  };

  const handleExportPDF = () => {
    if (!generatedReport) return;

    const template = templates.find(t => t.id === selectedTemplateId);
    const sections = parseReportSections(generatedReport);
    const generationDate = new Date();
    const formattedDate = generationDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = generationDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Create a printable HTML document
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Please allow popups to export PDF', 'error');
      return;
    }

    // Build sections HTML with professional styling
    const sectionsHtml = sections.map(section => {
      if (section.name === 'HEADER') {
        return ''; // Skip header section, we have custom header
      }
      if (section.name === 'FOOTER') {
        return ''; // Skip footer section, we have custom footer
      }
      return `
        <div class="report-section">
          <h3 class="section-header">${section.name}</h3>
          <div class="section-content">${section.content.replace(/\n/g, '<br>')}</div>
        </div>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Radiology Report - ${template?.name || 'Report'}</title>
          <style>
            /* Base document styling */
            * {
              box-sizing: border-box;
            }
            body {
              font-family: 'Times New Roman', 'Georgia', serif;
              max-width: 8.5in;
              margin: 0 auto;
              padding: 1in;
              line-height: 1.6;
              color: #000;
              background: #fff;
            }

            /* Header styling */
            .document-header {
              text-align: center;
              border-bottom: 3px double #000;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .document-header h1 {
              font-size: 28px;
              font-weight: bold;
              margin: 0 0 5px 0;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .document-header .subtitle {
              font-size: 16px;
              font-weight: normal;
              margin: 0 0 15px 0;
              color: #333;
            }

            /* Metadata table */
            .metadata {
              width: 100%;
              margin: 15px 0;
              border-collapse: collapse;
              font-size: 12px;
            }
            .metadata td {
              padding: 4px 10px;
              vertical-align: top;
            }
            .metadata .label {
              font-weight: bold;
              width: 120px;
              text-align: right;
              color: #333;
            }
            .metadata .value {
              text-align: left;
            }

            /* AI indicator badge */
            .ai-indicator {
              display: inline-block;
              background: #f0f0f0;
              border: 1px solid #ccc;
              border-radius: 4px;
              padding: 4px 12px;
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-top: 10px;
            }

            /* Report sections */
            .report-body {
              margin: 30px 0;
            }
            .report-section {
              margin-bottom: 24px;
              page-break-inside: avoid;
            }
            .section-header {
              font-size: 14px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin: 0 0 8px 0;
              padding-bottom: 4px;
              border-bottom: 1px solid #999;
            }
            .section-content {
              font-size: 13px;
              line-height: 1.8;
              margin-left: 0;
              text-align: justify;
            }

            /* Footer styling */
            .document-footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 2px solid #000;
            }
            .disclaimer {
              font-size: 11px;
              color: #333;
              text-align: center;
              font-style: italic;
              line-height: 1.6;
              margin: 0;
              padding: 15px 20px;
              background: #f9f9f9;
              border: 1px solid #ddd;
            }
            .footer-note {
              font-size: 10px;
              color: #666;
              text-align: center;
              margin-top: 15px;
            }

            /* Print optimization */
            @media print {
              body {
                margin: 0;
                padding: 0.75in;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .document-header {
                page-break-after: avoid;
              }
              .report-section {
                page-break-inside: avoid;
              }
              .section-header {
                page-break-after: avoid;
              }
              .document-footer {
                page-break-inside: avoid;
              }
              /* Remove any background colors for print */
              .ai-indicator {
                background: #f0f0f0 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .disclaimer {
                background: #f9f9f9 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }

            @page {
              margin: 0.5in;
              size: letter;
            }
          </style>
        </head>
        <body>
          <div class="document-header">
            <h1>Radiology Report</h1>
            <p class="subtitle">Medical Imaging Documentation</p>
            <table class="metadata">
              <tr>
                <td class="label">Template:</td>
                <td class="value">${template?.name || 'Standard Report'}</td>
                <td class="label">Date:</td>
                <td class="value">${formattedDate}</td>
              </tr>
              <tr>
                <td class="label">Modality:</td>
                <td class="value">${template?.modality || 'N/A'}</td>
                <td class="label">Time:</td>
                <td class="value">${formattedTime}</td>
              </tr>
              <tr>
                <td class="label">Body Part:</td>
                <td class="value">${template?.bodyPart || 'N/A'}</td>
                <td class="label"></td>
                <td class="value"></td>
              </tr>
            </table>
            <span class="ai-indicator">AI-Generated Report</span>
          </div>

          <div class="report-body">
            ${sectionsHtml}
          </div>

          <div class="document-footer">
            <p class="disclaimer">
              This report was generated using AI Radiologist software. All AI-generated findings
              and impressions should be reviewed and verified by a qualified radiologist before
              clinical use. This document is intended to assist, not replace, professional
              medical judgment.
            </p>
            <p class="footer-note">
              Generated by AI Radiologist &bull; ${formattedDate} at ${formattedTime}
            </p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      printWindow.print();
    };

    showToast('PDF export dialog opened', 'success');
  };

  const handleExportWord = async () => {
    if (!generatedReport) return;

    const template = templates.find(t => t.id === selectedTemplateId);

    try {
      // Parse the generated report into sections
      const lines = generatedReport.split('\n');
      const paragraphs: Paragraph[] = [];

      // Add header
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'AI Radiologist',
              bold: true,
              size: 48, // 24pt
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Medical Imaging Report',
              size: 28, // 14pt
              color: '666666',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Generated: ${new Date().toLocaleString()}`,
              size: 22, // 11pt
              color: '666666',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          border: {
            bottom: {
              color: '333333',
              size: 12,
              style: BorderStyle.SINGLE,
            },
          },
        })
      );

      // Add blank line after header
      paragraphs.push(new Paragraph({ text: '' }));

      // Process each line of the report
      for (const line of lines) {
        if (!line.trim()) {
          // Empty line - add spacing
          paragraphs.push(new Paragraph({ text: '' }));
        } else if (line.startsWith('RADIOLOGY REPORT') || line.startsWith('Template:') || line.startsWith('Modality:') || line.startsWith('Body Part:')) {
          // Metadata lines - bold
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  bold: true,
                  size: 24, // 12pt
                }),
              ],
              spacing: { after: 100 },
            })
          );
        } else if (line.match(/^[A-Z][A-Z\s]+:$/)) {
          // Section headers (e.g., "FINDINGS:", "IMPRESSION:")
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  bold: true,
                  size: 26, // 13pt
                  color: '0066CC',
                }),
              ],
              spacing: { before: 200, after: 100 },
            })
          );
        } else if (line.startsWith('---')) {
          // Separator line
          paragraphs.push(
            new Paragraph({
              text: '',
              border: {
                top: {
                  color: 'CCCCCC',
                  size: 6,
                  style: BorderStyle.SINGLE,
                },
              },
              spacing: { before: 200 },
            })
          );
        } else if (line.startsWith('Generated by')) {
          // Footer text
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  italics: true,
                  size: 22, // 11pt
                  color: '666666',
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 100 },
            })
          );
        } else {
          // Regular text
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  size: 24, // 12pt
                }),
              ],
              spacing: { after: 80 },
            })
          );
        }
      }

      // Add footer
      paragraphs.push(
        new Paragraph({ text: '' }),
        new Paragraph({
          border: {
            top: {
              color: 'CCCCCC',
              size: 6,
              style: BorderStyle.SINGLE,
            },
          },
          spacing: { before: 400 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'This report was generated using AI Radiologist software.',
              size: 20, // 10pt
              color: '666666',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Please review all findings with a qualified radiologist.',
              size: 20, // 10pt
              color: '666666',
            }),
          ],
          alignment: AlignmentType.CENTER,
        })
      );

      // Create the document
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      });

      // Generate and save the file
      const blob = await Packer.toBlob(doc);
      const fileName = `radiology-report-${template?.name?.replace(/\s+/g, '-').toLowerCase() || 'report'}-${Date.now()}.docx`;
      saveAs(blob, fileName);

      showToast('Word document exported successfully!', 'success');
    } catch (error) {
      console.error('Error exporting Word document:', error);
      showToast('Failed to export Word document', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">Loading...</div>
          <p className="text-text-secondary">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Generate Report</h1>
            <p className="mt-1 text-text-secondary">
              Select a template and provide findings to generate an AI-powered radiology report
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Credits Indicator */}
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm ${
                creditsRemaining === 0
                  ? 'bg-danger/20 text-danger'
                  : creditsRemaining <= 2
                  ? 'bg-warning/20 text-warning'
                  : 'bg-surface-muted text-text-secondary'
              }`}
              data-testid="credits-indicator"
            >
              <span className="font-medium">{creditsRemaining}/{REPORT_LIMIT}</span>
              <span>credits</span>
            </div>
            {/* Offline Indicator */}
            {!online && (
              <div
                className="flex items-center gap-2 rounded-full bg-warning/20 px-3 py-1 text-sm text-warning"
                data-testid="offline-indicator"
              >
                <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                Offline
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Offline Draft Saved Notice */}
      {offlineDraftSaved && !online && (
        <div
          className="mb-6 flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4"
          data-testid="offline-draft-notice"
        >
          <span className="text-warning text-lg">💾</span>
          <div>
            <p className="text-sm font-medium text-text-primary">Draft Saved to IndexedDB</p>
            <p className="text-xs text-text-secondary">
              Your changes are saved locally and will sync when you&apos;re back online.
            </p>
          </div>
        </div>
      )}

      {/* YOLO Mode Indicator */}
      {yoloMode && (
        <div
          className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-4"
          data-testid="yolo-mode-indicator"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚀</span>
              <div>
                <p className="font-semibold text-primary">YOLO Mode Active</p>
                <p className="text-sm text-text-secondary">
                  {yoloAutoSelected && selectedTemplateId ? (
                    <>Template auto-selected for <span className="font-medium text-text-primary">{yoloModality}</span></>
                  ) : (
                    <>Detected modality: <span className="font-medium text-text-primary">{yoloModality}</span></>
                  )}
                </p>
              </div>
            </div>
            <div className="text-xs text-text-muted" data-testid="yolo-override-hint">
              You can override the selection below
            </div>
          </div>
        </div>
      )}

      {/* Draft Restoration Notice */}
      {draftRestored && (
        <div
          className="mb-6 flex items-center justify-between rounded-lg border border-info/30 bg-info/10 p-4"
          data-testid="draft-restored-notice"
        >
          <div className="flex items-center gap-3">
            <span className="text-info text-lg">📝</span>
            <div>
              <p className="text-sm font-medium text-text-primary">Draft Restored</p>
              <p className="text-xs text-text-secondary">
                Your previous work was saved {draftSavedAt ? new Date(draftSavedAt).toLocaleString() : 'recently'}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearDraft}
            data-testid="clear-draft-button"
          >
            Clear Draft
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <div className="space-y-6">
          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle>1. Select Template</CardTitle>
              <CardDescription>Choose a report template to use</CardDescription>
            </CardHeader>
            <CardContent>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                data-testid="template-dropdown"
              >
                <option value="">Select a template...</option>
                <optgroup label="Personal Templates">
                  {templates.filter(t => !t.isGlobal).map(template => (
                    <option key={template.id} value={template.id} data-testid={`template-option-${template.id}`}>
                      {template.name} ({template.modality} - {template.bodyPart})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Global Templates">
                  {templates.filter(t => t.isGlobal).map(template => (
                    <option key={template.id} value={template.id} data-testid={`template-option-${template.id}`}>
                      {template.name} ({template.modality} - {template.bodyPart})
                    </option>
                  ))}
                </optgroup>
              </select>
              {selectedTemplate && (
                <p className="mt-2 text-sm text-text-secondary">
                  {selectedTemplate.description}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Findings Input */}
          <Card>
            <CardHeader>
              <CardTitle>2. Enter Findings</CardTitle>
              <CardDescription>Provide clinical findings or transcribed notes</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                placeholder="Enter clinical findings, observations, or paste transcribed notes..."
                rows={6}
                data-testid="findings-input"
              />
            </CardContent>
          </Card>

          {/* Generate Button */}
          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={!selectedTemplateId || !findings.trim() || isGenerating}
              className="flex-1"
              data-testid="generate-button"
            >
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </Button>
            {isGenerating && (
              <Button
                variant="outline"
                onClick={handleCancelGeneration}
                data-testid="cancel-generation-button"
              >
                ✕ Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Output Section */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Generated Report</CardTitle>
              <CardDescription>Your AI-generated radiology report will appear here</CardDescription>
            </CardHeader>
            <CardContent>
              {generatedReport ? (
                <div className="space-y-4">
                  {/* Section-by-section display with regenerate buttons */}
                  <div className="space-y-3" data-testid="report-sections">
                    {parseReportSections(generatedReport).map((section, index) => (
                      <div
                        key={`${section.name}-${index}`}
                        className={`rounded-md p-3 ${
                          section.name === 'HEADER' || section.name === 'FOOTER'
                            ? 'bg-surface-secondary/50'
                            : 'bg-surface-secondary border border-border/50'
                        }`}
                        data-testid={`section-${section.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {section.name !== 'HEADER' && section.name !== 'FOOTER' && (
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-text-primary">
                              {section.name}:
                            </span>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopySectionToClipboard(section.name, section.content)}
                                className="h-7 px-2 text-xs"
                                data-testid={`copy-${section.name.toLowerCase().replace(/\s+/g, '-')}`}
                              >
                                📋 Copy
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRegenerateSection(section.name)}
                                disabled={regeneratingSection !== null}
                                className="h-7 px-2 text-xs"
                                data-testid={`regenerate-${section.name.toLowerCase().replace(/\s+/g, '-')}`}
                              >
                                {regeneratingSection === section.name ? '⏳ Regenerating...' : '🔄 Regenerate'}
                              </Button>
                            </div>
                          </div>
                        )}
                        <pre className="whitespace-pre-wrap text-sm text-text-primary font-mono">
                          {section.name === 'HEADER' || section.name === 'FOOTER'
                            ? section.content
                            : section.content}
                        </pre>
                      </div>
                    ))}
                  </div>

                  {/* Full report view toggle */}
                  <details className="text-sm">
                    <summary className="cursor-pointer text-text-secondary hover:text-text-primary">
                      View raw report
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap rounded-md bg-surface-secondary p-4 text-sm text-text-primary font-mono" data-testid="generated-report">
                      {generatedReport}
                    </pre>
                  </details>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyToClipboard} data-testid="copy-button">
                      Copy to Clipboard
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportPDF} data-testid="export-pdf-button">
                      Export PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportWord} data-testid="export-word-button">
                      Export Word
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center text-center">
                  <div className="mb-4 text-5xl">📄</div>
                  <p className="text-text-secondary">
                    Select a template and enter findings to generate a report
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* No Credits Dialog */}
      <Dialog open={noCreditsDialogOpen} onOpenChange={setNoCreditsDialogOpen}>
        <DialogContent data-testid="no-credits-dialog">
          <DialogHeader>
            <DialogTitle>No Credits Remaining</DialogTitle>
            <DialogDescription>
              You have used all your report credits for this billing period. Upgrade your plan to continue generating reports.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-center">
              <div className="text-4xl mb-2">⚠️</div>
              <p className="font-medium text-text-primary">0 / {REPORT_LIMIT} credits remaining</p>
              <p className="text-sm text-text-secondary mt-1">
                Your Free plan includes {REPORT_LIMIT} reports per month
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="ghost"
              onClick={() => setNoCreditsDialogOpen(false)}
              data-testid="no-credits-cancel"
            >
              Cancel
            </Button>
            <Button asChild data-testid="no-credits-upgrade">
              <Link href="/billing">
                Upgrade Plan →
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

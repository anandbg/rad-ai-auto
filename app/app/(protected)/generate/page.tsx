'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth/auth-context';
import { usePreferences } from '@/lib/preferences/preferences-context';
import { saveDraft as saveToIndexedDB, getDraft as getFromIndexedDB, deleteDraft as deleteFromIndexedDB, isOnline, onOnlineStatusChange, type Draft } from '@/lib/storage/indexeddb';

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

// Mock templates for development (same as templates page)
const mockTemplates: Template[] = [
  {
    id: 'tpl-001',
    name: 'Chest X-Ray Standard',
    modality: 'X-Ray',
    bodyPart: 'Chest',
    description: 'Standard chest X-ray report template with PA and lateral views',
    isGlobal: true,
    content: 'FINDINGS:\n\nThe heart size is normal. The lungs are clear without focal consolidation, pleural effusion, or pneumothorax.\n\nIMPRESSION:\n\nNo acute cardiopulmonary findings.',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
  },
  {
    id: 'tpl-002',
    name: 'CT Abdomen',
    modality: 'CT',
    bodyPart: 'Abdomen',
    description: 'CT scan of abdomen and pelvis with and without contrast',
    isGlobal: true,
    content: 'TECHNIQUE:\n\nCT of the abdomen and pelvis was performed with oral and IV contrast.\n\nFINDINGS:\n\nLiver, spleen, pancreas, and adrenal glands are unremarkable.\n\nIMPRESSION:\n\nNo acute findings.',
    createdAt: '2024-01-12T14:30:00Z',
    updatedAt: '2024-01-12T14:30:00Z',
  },
  {
    id: 'tpl-003',
    name: 'MRI Brain',
    modality: 'MRI',
    bodyPart: 'Head',
    description: 'Standard brain MRI with diffusion-weighted imaging',
    isGlobal: false,
    content: 'TECHNIQUE:\n\nMRI of the brain was performed without contrast.\n\nFINDINGS:\n\nNo acute intracranial abnormality.\n\nIMPRESSION:\n\nUnremarkable MRI of the brain.',
    createdAt: '2024-01-14T09:15:00Z',
    updatedAt: '2024-01-14T09:15:00Z',
  },
];

// Helper to get user-specific storage key
function getStorageKey(userId: string | undefined): string {
  return userId ? `ai-rad-templates-${userId}` : 'ai-rad-templates';
}

// Helper to get templates from localStorage
function getStoredTemplates(userId: string | undefined): Template[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(getStorageKey(userId));
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Helper to get and update usage stats
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

function incrementReportCount() {
  const stats = getUsageStats();
  stats.reportsGenerated += 1;
  localStorage.setItem('ai-rad-usage', JSON.stringify(stats));
}

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
  }, [findings, selectedTemplateId, saveToIndexedDBDraft]);

  // Load templates on mount and when user changes
  useEffect(() => {
    const storedTemplates = getStoredTemplates(user?.id);
    // Combine mock templates with stored ones (stored take precedence by ID)
    const storedIds = new Set(storedTemplates.map(t => t.id));
    const combinedTemplates = [
      ...storedTemplates,
      ...mockTemplates.filter(t => !storedIds.has(t.id)),
    ];
    setTemplates(combinedTemplates);
    setIsLoading(false);
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

  // Check for YOLO mode URL parameters
  useEffect(() => {
    const modality = searchParams.get('modality');
    const isYolo = searchParams.get('yolo') === 'true';

    if (isYolo && modality) {
      setYoloMode(true);
      setYoloModality(modality);
    }
  }, [searchParams]);

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
        const bestMatch = personalMatch || matchingTemplates[0];

        setSelectedTemplateId(bestMatch.id);
        setYoloAutoSelected(true);
        setDefaultApplied(true); // Prevent default template from overriding

        showToast(
          `YOLO: Auto-selected "${bestMatch.name}" for ${yoloModality}`,
          'success'
        );
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

    setIsGenerating(true);

    // Simulate AI generation (in production, this would call OpenAI)
    await new Promise(resolve => setTimeout(resolve, 1500));

    const template = templates.find(t => t.id === selectedTemplateId);
    const report = `RADIOLOGY REPORT

Template: ${template?.name || 'Unknown'}
Modality: ${template?.modality || 'Unknown'}
Body Part: ${template?.bodyPart || 'Unknown'}

CLINICAL INDICATION:
${findings}

${template?.content || 'No template content available.'}

---
Generated by AI Radiologist`;

    setGeneratedReport(report);
    setIsGenerating(false);

    // Clear the draft after successful generation
    clearDraft(user?.id);
    setDraftRestored(false);
    setDraftSavedAt(null);

    // Increment the report count in usage stats
    incrementReportCount();
  };

  // Parse report into sections
  const parseReportSections = (report: string): { name: string; content: string }[] => {
    const sections: { name: string; content: string }[] = [];
    const lines = report.split('\n');
    let currentSection = '';
    let currentContent: string[] = [];
    let headerSection: string[] = [];
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

        currentSection = sectionMatch[1];
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

    if (sectionIndex !== -1) {
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
        newContent = sections[sectionIndex].content + ' [Regenerated]';
      }

      sections[sectionIndex].content = newContent;

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

  const handleExportPDF = () => {
    if (!generatedReport) return;

    const template = templates.find(t => t.id === selectedTemplateId);

    // Create a printable HTML document
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Please allow popups to export PDF', 'error');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Radiology Report - ${template?.name || 'Report'}</title>
          <style>
            body {
              font-family: 'Times New Roman', serif;
              max-width: 800px;
              margin: 40px auto;
              padding: 20px;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              font-size: 24px;
              margin: 0;
              color: #333;
            }
            .header p {
              margin: 5px 0;
              color: #666;
            }
            .report-content {
              white-space: pre-wrap;
              font-size: 14px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ccc;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            @media print {
              body { margin: 0; padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>AI Radiologist</h1>
            <p>Medical Imaging Report</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>
          <div class="report-content">${generatedReport.replace(/\n/g, '<br>')}</div>
          <div class="footer">
            <p>This report was generated using AI Radiologist software.</p>
            <p>Please review all findings with a qualified radiologist.</p>
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
          <Button
            onClick={handleGenerate}
            disabled={!selectedTemplateId || !findings.trim() || isGenerating}
            className="w-full"
            data-testid="generate-button"
          >
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </Button>
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
    </div>
  );
}

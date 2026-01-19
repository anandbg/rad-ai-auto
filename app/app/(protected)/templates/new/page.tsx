'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/ui/toast';
import { useCsrf } from '@/lib/hooks/use-csrf';
import { TemplatePreview } from '@/components/template-builder/template-preview';
import { SectionList } from '@/components/template-builder/section-list';
import { CreationPathwayModal, PathwayType } from '@/components/template-builder/creation-pathway-modal';
import { AIGenerationDialog } from '@/components/template-builder/ai-generation-dialog';
import { templateFormSchema, formatZodErrors, type TemplateSection, type AIGeneratedTemplate } from '@/lib/validation/template-schema';

// Form draft storage key
const FORM_DRAFT_KEY = 'ai-rad-template-draft';

// Modality options
const modalityOptions = [
  'X-Ray',
  'CT',
  'MRI',
  'Ultrasound',
  'PET',
  'Mammography',
  'Fluoroscopy',
  'Nuclear Medicine',
  'Other',
];

// Body part options
const bodyPartOptions = [
  'Head',
  'Neck',
  'Chest',
  'Abdomen',
  'Pelvis',
  'Spine',
  'Upper Extremity',
  'Lower Extremity',
  'Whole Body',
  'Other',
];

// Draft data interface
interface FormDraft {
  formData: {
    name: string;
    modality: string;
    bodyPart: string;
    description: string;
    content: string;
  };
  sections: TemplateSection[];
  savedAt: string;
}

// Get user-specific draft key
function getDraftKey(userId: string | undefined): string {
  return userId ? `${FORM_DRAFT_KEY}-${userId}` : FORM_DRAFT_KEY;
}

// Save draft to localStorage
function saveDraft(draft: FormDraft, userId: string | undefined): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getDraftKey(userId), JSON.stringify(draft));
  console.log('[Form Draft] Saved draft at', draft.savedAt);
}

// Load draft from localStorage
function loadDraft(userId: string | undefined): FormDraft | null {
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
  console.log('[Form Draft] Draft cleared');
}

export default function NewTemplatePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { CsrfInput, validateToken } = useCsrf();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    modality: '',
    bodyPart: '',
    description: '',
    content: '',
  });

  // Sections state
  const [sections, setSections] = useState<TemplateSection[]>([]);
  const [newSectionName, setNewSectionName] = useState('');

  // Pathway modal state
  const [showPathwayModal, setShowPathwayModal] = useState(true); // Show on mount
  const [selectedPathway, setSelectedPathway] = useState<PathwayType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAIDialog, setShowAIDialog] = useState(false);

  // AI Suggestions state
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsAbortRef = useRef<AbortController | null>(null);

  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft(user?.id);
    if (draft) {
      // Check if draft has any meaningful data
      const hasData = draft.formData.name || draft.formData.modality ||
                      draft.formData.bodyPart || draft.formData.description ||
                      draft.formData.content || draft.sections.length > 0;

      if (hasData) {
        setFormData(draft.formData);
        setSections(draft.sections);
        setDraftRestored(true);
        setDraftSavedAt(draft.savedAt);
        console.log('[Form Draft] Restored draft from', draft.savedAt);
      }
    }
  }, [user?.id]);

  // Save draft when form data changes (debounced)
  const saveCurrentDraft = useCallback(() => {
    const draft: FormDraft = {
      formData,
      sections,
      savedAt: new Date().toISOString(),
    };
    saveDraft(draft, user?.id);
  }, [formData, sections, user?.id]);

  // Auto-save draft on form changes
  useEffect(() => {
    // Don't save empty forms
    const hasData = formData.name || formData.modality ||
                    formData.bodyPart || formData.description ||
                    formData.content || sections.length > 0;

    if (hasData) {
      const timeoutId = setTimeout(saveCurrentDraft, 500); // Debounce 500ms
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [formData, sections, saveCurrentDraft]);

  // Clear draft handler
  const handleClearDraft = () => {
    clearDraft(user?.id);
    setFormData({
      name: '',
      modality: '',
      bodyPart: '',
      description: '',
      content: '',
    });
    setSections([]);
    setDraftRestored(false);
    setDraftSavedAt(null);
    showToast('Draft cleared', 'info');
  };

  // Add a new section
  const handleAddSection = () => {
    if (!newSectionName.trim()) return;

    const newSection: TemplateSection = {
      id: Math.random().toString(36).substring(2, 9),
      name: newSectionName.trim(),
      content: '',
    };

    setSections([...sections, newSection]);
    setNewSectionName('');
  };

  // Handle pathway selection
  const handlePathwaySelect = (pathway: PathwayType) => {
    setSelectedPathway(pathway);
    setShowPathwayModal(false);

    switch (pathway) {
      case 'ai':
        setShowAIDialog(true);
        break;
      case 'import':
        fileInputRef.current?.click();
        break;
      case 'clone':
        // Navigate to templates list with clone mode
        router.push('/templates?action=clone');
        break;
      case 'manual':
        // Default, just close modal
        break;
    }
  };

  // Handle AI generation
  const handleAIGenerated = (data: AIGeneratedTemplate) => {
    setFormData({
      name: data.name,
      modality: data.modality,
      bodyPart: data.bodyPart,
      description: data.description,
      content: '',
    });
    setSections(data.sections);
    showToast('Template generated! Review and customize below.', 'success');
  };

  // Handle JSON import
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate against schema
      const result = templateFormSchema.safeParse(data);
      if (!result.success) {
        const errors = formatZodErrors(result.error);
        const firstError = Object.values(errors)[0];
        showToast(`Invalid template format: ${firstError}`, 'error');
        return;
      }

      // Populate form with validated data
      setFormData({
        name: result.data.name,
        modality: result.data.modality,
        bodyPart: result.data.bodyPart,
        description: result.data.description,
        content: result.data.content || '',
      });
      if (result.data.sections) {
        setSections(result.data.sections);
      }
      showToast('Template imported successfully', 'success');
    } catch (error) {
      showToast('Failed to parse JSON file', 'error');
    }

    // Reset file input
    e.target.value = '';
  };

  // Handle getting AI suggestions
  const handleGetSuggestions = async (requestType: 'sections' | 'improvements' | 'normalFindings') => {
    // Abort any existing request
    if (suggestionsAbortRef.current) {
      suggestionsAbortRef.current.abort();
    }

    const abortController = new AbortController();
    suggestionsAbortRef.current = abortController;

    setIsLoadingSuggestions(true);
    setSuggestions('');
    setShowSuggestions(true);

    try {
      const response = await fetch('/api/templates/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modality: formData.modality,
          bodyPart: formData.bodyPart,
          description: formData.description,
          existingSections: sections,
          requestType,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to get suggestions');
      }

      // Stream the response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        setSuggestions(prev => prev + text);
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        showToast(error instanceof Error ? error.message : 'Failed to get suggestions', 'error');
      }
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Use Zod schema for validation
    const validationData = {
      name: formData.name.trim(),
      modality: formData.modality,
      bodyPart: formData.bodyPart,
      description: formData.description.trim(),
      content: formData.content,
      sections: sections,
    };

    const result = templateFormSchema.safeParse(validationData);

    if (!result.success) {
      // Extract Zod validation errors
      result.error.errors.forEach((error) => {
        const field = error.path[0] as string;
        // Use friendly error messages from Zod schema
        newErrors[field] = error.message;
      });
    }

    // Note: Duplicate name check is handled server-side

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate CSRF token
    const formDataObj = new FormData(e.currentTarget);
    const csrfToken = formDataObj.get('_csrf') as string;

    if (!validateToken(csrfToken)) {
      showToast('Security validation failed. Please refresh and try again.', 'error');
      console.error('[CSRF] Token validation failed on form submission');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          modality: formData.modality,
          bodyPart: formData.bodyPart,
          description: formData.description.trim(),
          content: formData.content,
          sections: sections.length > 0 ? sections : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.validationErrors) {
          setErrors(data.validationErrors);
          return;
        }
        throw new Error(data.message || 'Failed to create template');
      }

      const { data: newTemplate } = await response.json();

      // Clear draft on successful submission
      clearDraft(user?.id);

      // Show success toast
      showToast(`Template "${newTemplate.name}" created successfully!`, 'success');

      // Redirect to templates list
      router.push('/templates');
    } catch (error) {
      console.error('Error creating template:', error);
      showToast(error instanceof Error ? error.message : 'Failed to create template', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 border-b border-border bg-surface px-6 py-3 text-sm text-text-secondary">
        <Link href="/templates" className="hover:text-text-primary">
          Templates
        </Link>
        <span>/</span>
        <span className="text-text-primary">New Template</span>
      </div>

      {/* Split-pane layout */}
      <Group id="template-builder-layout" orientation="horizontal" className="flex-1">
        {/* Left panel: Editor form */}
        <Panel defaultSize={60} minSize={40}>
          <div className="h-full overflow-y-auto p-6">
            {/* Draft Restoration Notice */}
            {draftRestored && (
              <div
                className="mb-4 flex items-center justify-between rounded-lg border border-info/30 bg-info/10 p-4"
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

            {/* Hidden file input for JSON import */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />

            <form onSubmit={handleSubmit}>
        {/* CSRF Token */}
        <CsrfInput />
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Create New Template</CardTitle>
                <CardDescription>
                  Create a new radiology report template for your personal use
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPathwayModal(true)}
              >
                Change Creation Method
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Template Name */}
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-text-primary">
                Template Name <span className="text-error">*</span>
              </label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., CT Chest Protocol"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                data-testid="template-name-input"
                className={errors.name ? 'border-error' : ''}
                aria-invalid={errors.name ? 'true' : undefined}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" role="alert" className="mt-1 text-sm text-error">{errors.name}</p>
              )}
            </div>

            {/* Modality and Body Part */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="modality" className="mb-2 block text-sm font-medium text-text-primary">
                  Modality <span className="text-error">*</span>
                </label>
                <select
                  id="modality"
                  value={formData.modality}
                  onChange={(e) => handleChange('modality', e.target.value)}
                  data-testid="template-modality-select"
                  className={`w-full rounded-lg border ${errors.modality ? 'border-error' : 'border-border'} bg-surface px-4 py-2.5 text-text-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20`}
                  aria-invalid={errors.modality ? 'true' : undefined}
                  aria-describedby={errors.modality ? 'modality-error' : undefined}
                >
                  <option value="">Select modality</option>
                  {modalityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.modality && (
                  <p id="modality-error" role="alert" className="mt-1 text-sm text-error">{errors.modality}</p>
                )}
              </div>

              <div>
                <label htmlFor="bodyPart" className="mb-2 block text-sm font-medium text-text-primary">
                  Body Part <span className="text-error">*</span>
                </label>
                <select
                  id="bodyPart"
                  value={formData.bodyPart}
                  onChange={(e) => handleChange('bodyPart', e.target.value)}
                  data-testid="template-bodypart-select"
                  className={`w-full rounded-lg border ${errors.bodyPart ? 'border-error' : 'border-border'} bg-surface px-4 py-2.5 text-text-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20`}
                  aria-invalid={errors.bodyPart ? 'true' : undefined}
                  aria-describedby={errors.bodyPart ? 'bodypart-error' : undefined}
                >
                  <option value="">Select body part</option>
                  {bodyPartOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.bodyPart && (
                  <p id="bodypart-error" role="alert" className="mt-1 text-sm text-error">{errors.bodyPart}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-medium text-text-primary">
                Description <span className="text-error">*</span>
              </label>
              <Textarea
                id="description"
                placeholder="Describe when this template should be used..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                data-testid="template-description-input"
                rows={3}
                className={errors.description ? 'border-error' : ''}
                aria-invalid={errors.description ? 'true' : undefined}
                aria-describedby={errors.description ? 'description-error' : undefined}
              />
              {errors.description && (
                <p id="description-error" role="alert" className="mt-1 text-sm text-error">{errors.description}</p>
              )}
            </div>

            {/* Template Sections */}
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                Template Sections
              </label>
              <p className="mb-3 text-xs text-text-secondary">
                Add sections to organize your template (e.g., Findings, Impression, Technique)
              </p>

              {/* Add new section */}
              <div className="flex gap-2 mb-4">
                <Input
                  type="text"
                  placeholder="Section name (e.g., Findings)"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSection();
                    }
                  }}
                  data-testid="section-name-input"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddSection}
                  data-testid="add-section-button"
                >
                  Add Section
                </Button>
              </div>

              {/* Sections list */}
              {sections.length > 0 ? (
                <div data-testid="sections-list">
                  <SectionList
                    sections={sections}
                    onReorder={setSections}
                    onUpdateSection={(id, field, value) => {
                      setSections(sections.map(s =>
                        s.id === id ? { ...s, [field]: value } : s
                      ));
                    }}
                    onRemoveSection={(id) => {
                      setSections(sections.filter(s => s.id !== id));
                    }}
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-text-secondary">
                  No sections added yet. Add sections to organize your template.
                </div>
              )}

              {/* AI Suggestions Buttons */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-medium text-text-primary">AI Suggestions</h4>
                    <p className="text-xs text-text-muted">Get AI-powered suggestions for your template</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleGetSuggestions('sections')}
                    disabled={isLoadingSuggestions || !formData.modality || !formData.bodyPart}
                    data-testid="suggest-sections-btn"
                  >
                    {isLoadingSuggestions ? 'Getting Suggestions...' : 'Suggest Sections'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleGetSuggestions('improvements')}
                    disabled={isLoadingSuggestions || !formData.modality || !formData.bodyPart || sections.length === 0}
                    data-testid="suggest-improvements-btn"
                  >
                    Suggest Improvements
                  </Button>
                </div>

                {/* Suggestions Panel */}
                {showSuggestions && (
                  <div className="mt-4 p-4 rounded-lg border border-brand/30 bg-brand/5" data-testid="suggestions-panel">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-text-primary">AI Suggestions</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowSuggestions(false);
                          setSuggestions('');
                          if (suggestionsAbortRef.current) {
                            suggestionsAbortRef.current.abort();
                          }
                        }}
                        data-testid="close-suggestions-btn"
                      >
                        Close
                      </Button>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-mono text-sm text-text-secondary bg-surface-muted p-3 rounded">
                        {suggestions || 'Generating suggestions...'}
                      </pre>
                    </div>
                    {!isLoadingSuggestions && suggestions && (
                      <p className="mt-2 text-xs text-text-muted">
                        Copy relevant suggestions and paste into your template sections above.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Template Content (Legacy/General) */}
            <div>
              <label htmlFor="content" className="mb-2 block text-sm font-medium text-text-primary">
                Additional Template Content
              </label>
              <Textarea
                id="content"
                placeholder="Enter any additional template content with placeholders like {{PATIENT_NAME}}, {{DATE}}, etc."
                value={formData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                data-testid="template-content-input"
                rows={6}
                className="font-mono text-sm"
              />
              <p className="mt-1 text-xs text-text-secondary">
                Use placeholders for dynamic content: {'{{PATIENT_NAME}}'}, {'{{STUDY_DATE}}'}, {'{{FINDINGS}}'}, etc.
              </p>
            </div>

            {/* Note: Global template creation is an admin feature handled in Phase 10 */}
          </CardContent>
          <CardFooter className="flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button variant="ghost" asChild className="w-full sm:w-auto">
              <Link href="/templates">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              data-testid="create-template-submit"
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Creating...' : 'Create Template'}
            </Button>
          </CardFooter>
        </Card>
      </form>
          </div>
        </Panel>

        {/* Resize handle */}
        <Separator className="w-1.5 bg-border hover:bg-brand transition-colors cursor-col-resize" />

        {/* Right panel: Preview */}
        <Panel defaultSize={40} minSize={25}>
          <div className="h-full overflow-y-auto bg-surface-muted">
            <TemplatePreview
              name={formData.name}
              description={formData.description}
              sections={sections}
            />
          </div>
        </Panel>
      </Group>

      {/* Creation Pathway Modal */}
      <CreationPathwayModal
        open={showPathwayModal}
        onOpenChange={setShowPathwayModal}
        onSelect={handlePathwaySelect}
      />

      {/* AI Generation Dialog */}
      <AIGenerationDialog
        open={showAIDialog}
        onOpenChange={setShowAIDialog}
        onGenerated={handleAIGenerated}
        initialModality={formData.modality}
        initialBodyPart={formData.bodyPart}
      />
    </div>
  );
}

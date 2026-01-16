'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/ui/toast';
import { useCsrf } from '@/lib/hooks/use-csrf';

// Zod schema for template validation
const templateSectionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Section name is required'),
  content: z.string(),
});

const templateFormSchema = z.object({
  name: z.string()
    .min(1, 'Template name is required')
    .min(3, 'Template name must be at least 3 characters')
    .max(100, 'Template name must be less than 100 characters')
    .refine(
      (val) => val.length === 0 || /^[a-zA-Z0-9\s\-_]+$/.test(val),
      'Template name can only contain letters, numbers, spaces, hyphens, and underscores'
    ),
  modality: z.string().min(1, 'Please select a modality'),
  bodyPart: z.string().min(1, 'Please select a body part'),
  description: z.string()
    .min(1, 'Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  content: z.string().max(10000, 'Template content must be less than 10,000 characters').optional(),
  sections: z.array(templateSectionSchema).optional(),
});

export type TemplateFormData = z.infer<typeof templateFormSchema>;

// Form draft storage key
const FORM_DRAFT_KEY = 'ai-rad-template-draft';

// Section interface for template sections
interface TemplateSection {
  id: string;
  name: string;
  content: string;
}

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

  // Remove a section
  const handleRemoveSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  // Update section content
  const handleUpdateSectionContent = (id: string, content: string) => {
    setSections(sections.map(s =>
      s.id === id ? { ...s, content } : s
    ));
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
    <div className="mx-auto max-w-3xl p-6">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-text-secondary">
        <Link href="/templates" className="hover:text-text-primary">
          Templates
        </Link>
        <span>/</span>
        <span className="text-text-primary">New Template</span>
      </div>

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

      <form onSubmit={handleSubmit}>
        {/* CSRF Token */}
        <CsrfInput />
        <Card>
          <CardHeader>
            <CardTitle>Create New Template</CardTitle>
            <CardDescription>
              Create a new radiology report template for your personal use
            </CardDescription>
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
              {sections.length > 0 && (
                <div className="space-y-4" data-testid="sections-list">
                  {sections.map((section, index) => (
                    <div
                      key={section.id}
                      className="rounded-lg border border-border bg-surface-muted p-4"
                      data-testid={`section-${index}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-text-primary">{section.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSection(section.id)}
                          className="text-sm text-error hover:underline"
                          data-testid={`remove-section-${index}`}
                        >
                          Remove
                        </button>
                      </div>
                      <Textarea
                        placeholder={`Enter content for ${section.name}...`}
                        value={section.content}
                        onChange={(e) => handleUpdateSectionContent(section.id, e.target.value)}
                        rows={3}
                        className="font-mono text-sm"
                        data-testid={`section-content-${index}`}
                      />
                    </div>
                  ))}
                </div>
              )}

              {sections.length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-text-secondary">
                  No sections added yet. Add sections to organize your template.
                </div>
              )}
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
  );
}

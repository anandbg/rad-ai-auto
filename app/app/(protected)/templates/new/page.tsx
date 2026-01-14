'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/ui/toast';

// Section interface for template sections
interface TemplateSection {
  id: string;
  name: string;
  content: string;
}

// Template interface - must match the one in the list page
interface Template {
  id: string;
  name: string;
  modality: string;
  bodyPart: string;
  description: string;
  isGlobal: boolean;
  createdAt: string;
  updatedAt: string;
  sections?: TemplateSection[];
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

// Helper to get user-specific storage key
function getStorageKey(userId: string | undefined): string {
  return userId ? `ai-rad-templates-${userId}` : 'ai-rad-templates';
}

// Helper to get templates from localStorage (user-specific)
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

// Helper to save templates to localStorage (user-specific)
function saveTemplates(templates: Template[], userId: string | undefined) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getStorageKey(userId), JSON.stringify(templates));
}

// Global templates storage key (shared across all users)
const GLOBAL_TEMPLATES_KEY = 'ai-rad-global-templates';

// Helper to get global templates from localStorage
function getGlobalTemplates(): Template[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(GLOBAL_TEMPLATES_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Helper to save global templates to localStorage
function saveGlobalTemplates(templates: Template[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GLOBAL_TEMPLATES_KEY, JSON.stringify(templates));
}

// Generate unique ID
function generateId(): string {
  return 'tpl-' + Math.random().toString(36).substring(2, 9);
}

export default function NewTemplatePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    modality: '',
    bodyPart: '',
    description: '',
    content: '',
  });
  const [isGlobal, setIsGlobal] = useState(false);

  // Sections state
  const [sections, setSections] = useState<TemplateSection[]>([]);
  const [newSectionName, setNewSectionName] = useState('');

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

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

    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Template name must be at least 3 characters';
    }

    if (!formData.modality) {
      newErrors.modality = 'Please select a modality';
    }

    if (!formData.bodyPart) {
      newErrors.bodyPart = 'Please select a body part';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Create new template with sections
    const newTemplate: Template = {
      id: generateId(),
      name: formData.name.trim(),
      modality: formData.modality,
      bodyPart: formData.bodyPart,
      description: formData.description.trim(),
      isGlobal: isAdmin && isGlobal, // Only admins can create global templates
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sections: sections.length > 0 ? sections : undefined,
    };

    // Save to appropriate storage
    if (newTemplate.isGlobal) {
      // Save to global templates storage
      const existingGlobalTemplates = getGlobalTemplates();
      saveGlobalTemplates([newTemplate, ...existingGlobalTemplates]);
    } else {
      // Save to user-specific storage
      const existingTemplates = getStoredTemplates(user?.id);
      saveTemplates([newTemplate, ...existingTemplates], user?.id);
    }

    // Show success toast
    showToast(`Template "${newTemplate.name}" created successfully!`, 'success');

    // Redirect to templates list
    router.push('/templates');
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

      <form onSubmit={handleSubmit}>
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
              />
              {errors.name && (
                <p className="mt-1 text-sm text-error">{errors.name}</p>
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
                >
                  <option value="">Select modality</option>
                  {modalityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.modality && (
                  <p className="mt-1 text-sm text-error">{errors.modality}</p>
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
                >
                  <option value="">Select body part</option>
                  {bodyPartOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.bodyPart && (
                  <p className="mt-1 text-sm text-error">{errors.bodyPart}</p>
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
              />
              {errors.description && (
                <p className="mt-1 text-sm text-error">{errors.description}</p>
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

            {/* Global Template Option (Admin only) */}
            {isAdmin && (
              <div className="flex items-center gap-3 rounded-lg border border-brand/20 bg-brand/5 p-4">
                <input
                  type="checkbox"
                  id="isGlobal"
                  checked={isGlobal}
                  onChange={(e) => setIsGlobal(e.target.checked)}
                  data-testid="template-global-checkbox"
                  className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
                />
                <div>
                  <label htmlFor="isGlobal" className="text-sm font-medium text-text-primary cursor-pointer">
                    Publish as Global Template
                  </label>
                  <p className="text-xs text-text-secondary">
                    Global templates are visible to all users in the system
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="ghost" asChild>
              <Link href="/templates">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              data-testid="create-template-submit"
            >
              {isSubmitting ? 'Creating...' : 'Create Template'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

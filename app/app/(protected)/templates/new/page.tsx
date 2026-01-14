'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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

// Helper to get templates from localStorage
function getStoredTemplates(): Template[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('ai-rad-templates');
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Helper to save templates to localStorage
function saveTemplates(templates: Template[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('ai-rad-templates', JSON.stringify(templates));
}

// Generate unique ID
function generateId(): string {
  return 'tpl-' + Math.random().toString(36).substring(2, 9);
}

export default function NewTemplatePage() {
  const router = useRouter();
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

    // Create new template
    const newTemplate: Template = {
      id: generateId(),
      name: formData.name.trim(),
      modality: formData.modality,
      bodyPart: formData.bodyPart,
      description: formData.description.trim(),
      isGlobal: false, // User-created templates are personal
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to localStorage
    const existingTemplates = getStoredTemplates();
    saveTemplates([newTemplate, ...existingTemplates]);

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

            {/* Template Content */}
            <div>
              <label htmlFor="content" className="mb-2 block text-sm font-medium text-text-primary">
                Template Content
              </label>
              <Textarea
                id="content"
                placeholder="Enter the template content with placeholders like {{PATIENT_NAME}}, {{DATE}}, etc."
                value={formData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                data-testid="template-content-input"
                rows={10}
                className="font-mono text-sm"
              />
              <p className="mt-1 text-xs text-text-secondary">
                Use placeholders for dynamic content: {'{{PATIENT_NAME}}'}, {'{{STUDY_DATE}}'}, {'{{FINDINGS}}'}, etc.
              </p>
            </div>
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

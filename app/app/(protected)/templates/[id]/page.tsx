'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth/auth-context';

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
  content?: string;
}

// Mock templates for development (Global templates)
const mockTemplates: Template[] = [
  {
    id: 'tpl-001',
    name: 'Chest X-Ray Standard',
    modality: 'X-Ray',
    bodyPart: 'Chest',
    description: 'Standard chest X-ray report template with PA and lateral views',
    isGlobal: true,
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
    content: 'CHEST X-RAY PA AND LATERAL\n\nCLINICAL INDICATION:\n{{INDICATION}}\n\nFINDINGS:\n{{FINDINGS}}\n\nIMPRESSION:\n{{IMPRESSION}}',
  },
  {
    id: 'tpl-002',
    name: 'CT Abdomen',
    modality: 'CT',
    bodyPart: 'Abdomen',
    description: 'CT scan of abdomen and pelvis with and without contrast',
    isGlobal: true,
    createdAt: '2024-01-12T14:30:00Z',
    updatedAt: '2024-01-12T14:30:00Z',
    content: 'CT ABDOMEN AND PELVIS WITH CONTRAST\n\nCLINICAL INDICATION:\n{{INDICATION}}\n\nTECHNIQUE:\n{{TECHNIQUE}}\n\nFINDINGS:\n{{FINDINGS}}\n\nIMPRESSION:\n{{IMPRESSION}}',
  },
];

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

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    modality: '',
    bodyPart: '',
    description: '',
    content: '',
  });

  // Load template on mount and when user changes
  useEffect(() => {
    const storedTemplates = getStoredTemplates(user?.id);
    const allTemplates = [...storedTemplates, ...mockTemplates.filter(m => !storedTemplates.some(s => s.id === m.id))];
    const foundTemplate = allTemplates.find(t => t.id === id);

    if (foundTemplate) {
      setTemplate(foundTemplate);
      setFormData({
        name: foundTemplate.name,
        modality: foundTemplate.modality,
        bodyPart: foundTemplate.bodyPart,
        description: foundTemplate.description,
        content: foundTemplate.content || '',
      });
    }
    setIsLoading(false);
  }, [id, user?.id]);

  const handleSave = () => {
    if (!template) return;

    setIsSaving(true);

    const updatedTemplate: Template = {
      ...template,
      name: formData.name,
      modality: formData.modality,
      bodyPart: formData.bodyPart,
      description: formData.description,
      content: formData.content,
      updatedAt: new Date().toISOString(),
    };

    // Update in localStorage (user-specific)
    const storedTemplates = getStoredTemplates(user?.id);
    const existingIndex = storedTemplates.findIndex(t => t.id === id);

    if (existingIndex >= 0) {
      storedTemplates[existingIndex] = updatedTemplate;
    } else {
      storedTemplates.push(updatedTemplate);
    }

    saveTemplates(storedTemplates, user?.id);
    setTemplate(updatedTemplate);
    setIsEditing(false);
    setIsSaving(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">Loading...</div>
          <p className="text-text-secondary">Loading template...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
          <div className="mb-4 text-5xl">404</div>
          <h3 className="mb-2 text-lg font-semibold text-text-primary">Template Not Found</h3>
          <p className="mb-4 text-sm text-text-secondary">
            The template you're looking for doesn't exist.
          </p>
          <Button asChild>
            <Link href="/templates">Back to Templates</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isGlobal = template.isGlobal;
  const canEdit = !isGlobal;

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-text-secondary">
        <Link href="/templates" className="hover:text-text-primary">
          Templates
        </Link>
        <span>/</span>
        <span className="text-text-primary" data-testid="template-detail-name">{template.name}</span>
      </div>

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{template.name}</h1>
          <p className="mt-1 text-text-secondary">
            {template.modality} - {template.bodyPart}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isGlobal && (
            <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand">
              Global Template
            </span>
          )}
          {canEdit && !isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              Edit Template
            </Button>
          )}
        </div>
      </div>

      {isEditing ? (
        /* Edit Mode */
        <Card>
          <CardHeader>
            <CardTitle>Edit Template</CardTitle>
            <CardDescription>Update template details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Template Name */}
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-text-primary">
                Template Name
              </label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                data-testid="edit-template-name"
              />
            </div>

            {/* Modality and Body Part */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="modality" className="mb-2 block text-sm font-medium text-text-primary">
                  Modality
                </label>
                <select
                  id="modality"
                  value={formData.modality}
                  onChange={(e) => handleChange('modality', e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                >
                  {modalityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="bodyPart" className="mb-2 block text-sm font-medium text-text-primary">
                  Body Part
                </label>
                <select
                  id="bodyPart"
                  value={formData.bodyPart}
                  onChange={(e) => handleChange('bodyPart', e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                >
                  {bodyPartOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-medium text-text-primary">
                Description
              </label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
              />
            </div>

            {/* Template Content */}
            <div>
              <label htmlFor="content" className="mb-2 block text-sm font-medium text-text-primary">
                Template Content
              </label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        /* View Mode */
        <div className="space-y-6">
          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-text-secondary">Modality</dt>
                  <dd className="mt-1 text-text-primary" data-testid="template-detail-modality">{template.modality}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-text-secondary">Body Part</dt>
                  <dd className="mt-1 text-text-primary" data-testid="template-detail-bodypart">{template.bodyPart}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-text-secondary">Description</dt>
                  <dd className="mt-1 text-text-primary" data-testid="template-detail-description">{template.description}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-text-secondary">Created</dt>
                  <dd className="mt-1 text-text-primary" data-testid="template-created-at">
                    {new Date(template.createdAt).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-text-secondary">Last Updated</dt>
                  <dd className="mt-1 text-text-primary" data-testid="template-updated-at">
                    {new Date(template.updatedAt).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Content Card */}
          <Card>
            <CardHeader>
              <CardTitle>Template Content</CardTitle>
              <CardDescription>Report template with placeholders</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap rounded-lg bg-surface-muted p-4 font-mono text-sm text-text-primary">
                {template.content || 'No content defined yet.'}
              </pre>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-border pt-6">
            <Button variant="ghost" asChild>
              <Link href="/templates">Back to Templates</Link>
            </Button>
            {isGlobal && (
              <Button variant="outline">Clone to Personal</Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

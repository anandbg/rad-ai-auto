'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/ui/toast';
import { useUnsavedChanges } from '@/lib/hooks/use-unsaved-changes';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';

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
  content?: string;
  sections?: TemplateSection[];
  version?: number;
}

// Template version interface for version history
interface TemplateVersion {
  id: string;
  templateId: string;
  version: number;
  name: string;
  modality: string;
  bodyPart: string;
  description: string;
  content?: string;
  sections?: TemplateSection[];
  createdAt: string;
  createdBy?: string;
}

// Global templates storage key (shared across all users)
const GLOBAL_TEMPLATES_KEY = 'ai-rad-global-templates';

// Template versions storage key
const TEMPLATE_VERSIONS_KEY = 'ai-rad-template-versions';

// Helper to get template versions from localStorage
function getTemplateVersions(templateId: string): TemplateVersion[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(TEMPLATE_VERSIONS_KEY);
  if (!stored) return [];
  try {
    const allVersions: TemplateVersion[] = JSON.parse(stored);
    return allVersions.filter(v => v.templateId === templateId).sort((a, b) => b.version - a.version);
  } catch {
    return [];
  }
}

// Helper to save a new template version
function saveTemplateVersion(template: Template, userId?: string): TemplateVersion {
  if (typeof window === 'undefined') throw new Error('Window not available');

  const stored = localStorage.getItem(TEMPLATE_VERSIONS_KEY);
  const allVersions: TemplateVersion[] = stored ? JSON.parse(stored) : [];

  // Get the current highest version number for this template
  const existingVersions = allVersions.filter(v => v.templateId === template.id);
  const maxVersion = existingVersions.length > 0
    ? Math.max(...existingVersions.map(v => v.version))
    : 0;

  // Create new version record
  const newVersion: TemplateVersion = {
    id: `ver-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    templateId: template.id,
    version: maxVersion + 1,
    name: template.name,
    modality: template.modality,
    bodyPart: template.bodyPart,
    description: template.description,
    content: template.content,
    sections: template.sections,
    createdAt: new Date().toISOString(),
    createdBy: userId,
  };

  allVersions.push(newVersion);
  localStorage.setItem(TEMPLATE_VERSIONS_KEY, JSON.stringify(allVersions));

  // Log for verification
  console.log(`[Template Versions API] Created version ${newVersion.version} for template ${template.id}`);

  return newVersion;
}

// Seed global templates (only used if no global templates exist in storage)
const seedGlobalTemplates: Template[] = [
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

// Helper to get global templates from localStorage
function getGlobalTemplates(): Template[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(GLOBAL_TEMPLATES_KEY);
  if (!stored) {
    // Initialize with seed templates if nothing exists
    localStorage.setItem(GLOBAL_TEMPLATES_KEY, JSON.stringify(seedGlobalTemplates));
    return seedGlobalTemplates;
  }
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
  const { showToast } = useToast();
  const id = params.id as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [showDiffView, setShowDiffView] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    modality: '',
    bodyPart: '',
    description: '',
    content: '',
  });
  const [originalFormData, setOriginalFormData] = useState({
    name: '',
    modality: '',
    bodyPart: '',
    description: '',
    content: '',
  });

  // Check if form has unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!isEditing) return false;
    return (
      formData.name !== originalFormData.name ||
      formData.modality !== originalFormData.modality ||
      formData.bodyPart !== originalFormData.bodyPart ||
      formData.description !== originalFormData.description ||
      formData.content !== originalFormData.content
    );
  }, [isEditing, formData, originalFormData]);

  // Unsaved changes warning
  const {
    showDialog: showUnsavedDialog,
    handleStay,
    handleLeave,
  } = useUnsavedChanges({
    isDirty: hasUnsavedChanges,
    message: 'You have unsaved changes. Are you sure you want to leave?',
  });

  // Load template on mount and when user changes
  useEffect(() => {
    const storedTemplates = getStoredTemplates(user?.id);
    const globalTemplates = getGlobalTemplates();
    const allTemplates = [...storedTemplates, ...globalTemplates.filter(g => !storedTemplates.some(s => s.id === g.id))];
    const foundTemplate = allTemplates.find(t => t.id === id);

    if (foundTemplate) {
      setTemplate(foundTemplate);
      const initialData = {
        name: foundTemplate.name,
        modality: foundTemplate.modality,
        bodyPart: foundTemplate.bodyPart,
        description: foundTemplate.description,
        content: foundTemplate.content || '',
      };
      setFormData(initialData);
      setOriginalFormData(initialData);
      // Load version history for this template
      const templateVersions = getTemplateVersions(id);
      setVersions(templateVersions);
    }
    setIsLoading(false);
  }, [id, user?.id]);

  const handleSave = () => {
    if (!template) return;

    setIsSaving(true);

    // Save the current state as a version BEFORE updating
    const newVersion = saveTemplateVersion(template, user?.id);

    // Get current version number for the template
    const currentVersion = (template.version || 0) + 1;

    const updatedTemplate: Template = {
      ...template,
      name: formData.name,
      modality: formData.modality,
      bodyPart: formData.bodyPart,
      description: formData.description,
      content: formData.content,
      updatedAt: new Date().toISOString(),
      version: currentVersion,
    };

    // Update in appropriate localStorage storage
    if (updatedTemplate.isGlobal) {
      // Admin editing a global template
      const globalTemplates = getGlobalTemplates();
      const existingIndex = globalTemplates.findIndex(t => t.id === id);
      if (existingIndex >= 0) {
        globalTemplates[existingIndex] = updatedTemplate;
      } else {
        globalTemplates.push(updatedTemplate);
      }
      saveGlobalTemplates(globalTemplates);
    } else {
      // User editing personal template
      const storedTemplates = getStoredTemplates(user?.id);
      const existingIndex = storedTemplates.findIndex(t => t.id === id);
      if (existingIndex >= 0) {
        storedTemplates[existingIndex] = updatedTemplate;
      } else {
        storedTemplates.push(updatedTemplate);
      }
      saveTemplates(storedTemplates, user?.id);
    }

    setTemplate(updatedTemplate);
    // Update versions list with the new version
    setVersions(prev => [newVersion, ...prev]);
    // Reset original form data to match saved state (clears dirty flag)
    setOriginalFormData({ ...formData });
    setIsEditing(false);
    setIsSaving(false);

    // Show success toast
    showToast(`Template "${updatedTemplate.name}" updated successfully! (Version ${newVersion.version} saved)`, 'success');
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle version selection for comparison
  const handleVersionSelect = (versionId: string) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId);
      }
      if (prev.length < 2) {
        return [...prev, versionId];
      }
      // Replace the oldest selection
      return [prev[1], versionId];
    });
  };

  // Get diff between two versions
  const getVersionDiff = (v1: TemplateVersion, v2: TemplateVersion) => {
    const diffs: { field: string; oldValue: string; newValue: string }[] = [];

    if (v1.name !== v2.name) {
      diffs.push({ field: 'Name', oldValue: v1.name, newValue: v2.name });
    }
    if (v1.modality !== v2.modality) {
      diffs.push({ field: 'Modality', oldValue: v1.modality, newValue: v2.modality });
    }
    if (v1.bodyPart !== v2.bodyPart) {
      diffs.push({ field: 'Body Part', oldValue: v1.bodyPart, newValue: v2.bodyPart });
    }
    if (v1.description !== v2.description) {
      diffs.push({ field: 'Description', oldValue: v1.description, newValue: v2.description });
    }
    if ((v1.content || '') !== (v2.content || '')) {
      diffs.push({ field: 'Content', oldValue: v1.content || '', newValue: v2.content || '' });
    }

    return diffs;
  };

  // Get selected versions for comparison (sorted by version number)
  const getSelectedVersionsForComparison = () => {
    const selected = versions.filter(v => selectedVersions.includes(v.id));
    return selected.sort((a, b) => a.version - b.version);
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
  const isAdmin = user?.role === 'admin';
  const canEdit = !isGlobal || isAdmin; // Admins can edit global templates

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onStay={handleStay}
        onLeave={handleLeave}
      />

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

          {/* Sections Card */}
          {template.sections && template.sections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Template Sections</CardTitle>
                <CardDescription>Organized sections of the report template</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4" data-testid="template-sections">
                  {template.sections.map((section, index) => (
                    <div
                      key={section.id}
                      className="rounded-lg border border-border bg-surface-muted p-4"
                      data-testid={`template-section-${index}`}
                    >
                      <h4 className="font-medium text-text-primary mb-2">{section.name}</h4>
                      <pre className="whitespace-pre-wrap font-mono text-sm text-text-secondary">
                        {section.content || 'No content'}
                      </pre>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content Card */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Template Content</CardTitle>
              <CardDescription>Report template with placeholders</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap rounded-lg bg-surface-muted p-4 font-mono text-sm text-text-primary">
                {template.content || 'No additional content defined.'}
              </pre>
            </CardContent>
          </Card>

          {/* Version History Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Version History</CardTitle>
                <CardDescription>
                  {versions.length > 0
                    ? `${versions.length} version${versions.length !== 1 ? 's' : ''} saved`
                    : 'No version history yet. Edit and save to create a version.'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {versions.length >= 2 && selectedVersions.length === 2 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowDiffView(!showDiffView)}
                    data-testid="compare-versions-btn"
                  >
                    {showDiffView ? 'Hide' : 'Compare'} Versions
                  </Button>
                )}
                {versions.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVersionHistory(!showVersionHistory)}
                    data-testid="toggle-version-history"
                  >
                    {showVersionHistory ? 'Hide' : 'Show'} History
                  </Button>
                )}
              </div>
            </CardHeader>

            {/* Version Diff View */}
            {showDiffView && selectedVersions.length === 2 && (
              <CardContent className="border-b border-border pb-4">
                {(() => {
                  const [v1, v2] = getSelectedVersionsForComparison();
                  const diffs = getVersionDiff(v1, v2);
                  return (
                    <div data-testid="version-diff-view">
                      <div className="mb-4 flex items-center gap-2 text-sm text-text-secondary">
                        <span>Comparing:</span>
                        <span className="font-medium text-text-primary">Version {v1.version}</span>
                        <span>→</span>
                        <span className="font-medium text-text-primary">Version {v2.version}</span>
                      </div>
                      {diffs.length === 0 ? (
                        <p className="text-text-muted text-sm">No differences found between selected versions.</p>
                      ) : (
                        <div className="space-y-4">
                          {diffs.map((diff, index) => (
                            <div key={index} className="rounded-lg border border-border p-3" data-testid={`diff-field-${diff.field.toLowerCase().replace(' ', '-')}`}>
                              <h4 className="font-medium text-text-primary mb-2">{diff.field}</h4>
                              <div className="grid gap-2">
                                <div className="rounded bg-danger/10 p-2 border-l-4 border-danger" data-testid="diff-deletion">
                                  <span className="text-xs font-medium text-danger">- Removed (v{v1.version})</span>
                                  <p className="text-sm text-text-primary mt-1 whitespace-pre-wrap">{diff.oldValue || '(empty)'}</p>
                                </div>
                                <div className="rounded bg-success/10 p-2 border-l-4 border-success" data-testid="diff-addition">
                                  <span className="text-xs font-medium text-success">+ Added (v{v2.version})</span>
                                  <p className="text-sm text-text-primary mt-1 whitespace-pre-wrap">{diff.newValue || '(empty)'}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            )}

            {showVersionHistory && versions.length > 0 && (
              <CardContent>
                {versions.length >= 2 && (
                  <p className="text-sm text-text-muted mb-3">
                    Select 2 versions to compare ({selectedVersions.length}/2 selected)
                  </p>
                )}
                <div className="space-y-3" data-testid="version-history-list">
                  {versions.map((version, index) => (
                    <div
                      key={version.id}
                      className={`rounded-lg border p-4 cursor-pointer transition-colors ${
                        selectedVersions.includes(version.id)
                          ? 'border-brand bg-brand/5'
                          : 'border-border bg-surface-muted hover:border-brand/50'
                      }`}
                      data-testid={`version-entry-${version.version}`}
                      onClick={() => handleVersionSelect(version.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedVersions.includes(version.id)}
                            onChange={() => handleVersionSelect(version.id)}
                            className="w-4 h-4 rounded border-border text-brand focus:ring-brand"
                            data-testid={`version-checkbox-${version.version}`}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="font-medium text-text-primary">
                            Version {version.version}
                            {index === 0 && (
                              <span className="ml-2 text-xs bg-brand/10 text-brand px-2 py-0.5 rounded-full">
                                Latest
                              </span>
                            )}
                          </span>
                        </div>
                        <span className="text-sm text-text-muted" data-testid={`version-timestamp-${version.version}`}>
                          {new Date(version.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-text-secondary ml-7">
                        <p><strong>Name:</strong> {version.name}</p>
                        <p><strong>Modality:</strong> {version.modality} - {version.bodyPart}</p>
                        {version.description && (
                          <p className="truncate"><strong>Description:</strong> {version.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
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

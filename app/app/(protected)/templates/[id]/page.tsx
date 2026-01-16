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

// Editor tab type
type EditorTab = 'sections' | 'settings' | 'normalFindings';

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

// Template versions storage key (local-only version history)
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
  const [rollbackVersion, setRollbackVersion] = useState<TemplateVersion | null>(null);
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    modality: '',
    bodyPart: '',
    description: '',
    content: '',
    normalFindings: '',
  });
  const [originalFormData, setOriginalFormData] = useState({
    name: '',
    modality: '',
    bodyPart: '',
    description: '',
    content: '',
    normalFindings: '',
  });
  const [editorTab, setEditorTab] = useState<EditorTab>('sections');
  const [editSections, setEditSections] = useState<TemplateSection[]>([]);
  const [isCloning, setIsCloning] = useState(false);

  // Check if form has unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!isEditing) return false;
    return (
      formData.name !== originalFormData.name ||
      formData.modality !== originalFormData.modality ||
      formData.bodyPart !== originalFormData.bodyPart ||
      formData.description !== originalFormData.description ||
      formData.content !== originalFormData.content ||
      formData.normalFindings !== originalFormData.normalFindings ||
      JSON.stringify(editSections) !== JSON.stringify(template?.sections || [])
    );
  }, [isEditing, formData, originalFormData, editSections, template?.sections]);

  // Unsaved changes warning
  const {
    showDialog: showUnsavedDialog,
    handleStay,
    handleLeave,
  } = useUnsavedChanges({
    isDirty: hasUnsavedChanges,
    message: 'You have unsaved changes. Are you sure you want to leave?',
  });

  // Track if template is loading
  const [error, setError] = useState<string | null>(null);

  // Load template on mount via API
  useEffect(() => {
    const loadTemplate = async () => {
      if (!id) {
        setError('Template ID not found');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/templates/${id}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Template not found');
          } else if (response.status === 401) {
            setError('Please sign in to view this template');
          } else {
            setError('Failed to load template');
          }
          setIsLoading(false);
          return;
        }

        const { data: templateData } = await response.json();

        // Map API response to Template interface
        const foundTemplate: Template = {
          id: templateData.id,
          name: templateData.name,
          modality: templateData.modality,
          bodyPart: templateData.bodyPart,
          description: templateData.description || '',
          isGlobal: templateData.isGlobal,
          createdAt: templateData.createdAt,
          updatedAt: templateData.updatedAt,
          content: templateData.content?.rawContent || '',
          sections: templateData.content?.sections || [],
        };

        setTemplate(foundTemplate);
        const initialData = {
          name: foundTemplate.name,
          modality: foundTemplate.modality,
          bodyPart: foundTemplate.bodyPart,
          description: foundTemplate.description,
          content: foundTemplate.content || '',
          normalFindings: '',
        };
        setFormData(initialData);
        setOriginalFormData(initialData);
        setEditSections(foundTemplate.sections || []);

        // Load version history for this template (local-only for now)
        const templateVersions = getTemplateVersions(id);
        setVersions(templateVersions);
      } catch (err) {
        console.error('Error loading template:', err);
        setError('Failed to load template');
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplate();
  }, [id]);

  const handleSave = async () => {
    if (!template) return;

    // Global templates cannot be edited - must clone first
    if (template.isGlobal) {
      showToast('Global templates are read-only. Clone to your personal templates to edit.', 'error');
      return;
    }

    setIsSaving(true);

    // Optimistic update: immediately update the UI
    const previousTemplate = { ...template };

    // Get current version number for the template
    const currentVersion = (template.version || 0) + 1;

    const updatedTemplate: Template = {
      ...template,
      name: formData.name,
      modality: formData.modality,
      bodyPart: formData.bodyPart,
      description: formData.description,
      content: formData.content,
      sections: editSections,
      updatedAt: new Date().toISOString(),
      version: currentVersion,
    };

    // Optimistically update UI immediately
    setTemplate(updatedTemplate);

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          modality: formData.modality,
          bodyPart: formData.bodyPart,
          description: formData.description.trim(),
          content: formData.content,
          sections: editSections.length > 0 ? editSections : undefined,
        }),
      });

      if (!response.ok) {
        // ROLLBACK: Revert to original state
        setTemplate(previousTemplate);
        const data = await response.json();
        throw new Error(data.message || 'Failed to update template');
      }

      const { data: savedTemplate } = await response.json();

      // Save the current state as a version (local version history)
      const newVersion = saveTemplateVersion(previousTemplate, user?.id);

      // Update versions list with the new version
      setVersions(prev => [newVersion, ...prev]);

      // Update template with response data
      setTemplate({
        ...updatedTemplate,
        updatedAt: savedTemplate.updatedAt,
      });

      // Reset original form data to match saved state (clears dirty flag)
      setOriginalFormData({ ...formData });
      setIsEditing(false);

      // Show success toast
      showToast(`Template "${savedTemplate.name}" updated successfully!`, 'success');
    } catch (error) {
      // ROLLBACK: Revert to original state
      setTemplate(previousTemplate);
      console.error('Error saving template:', error);
      showToast(error instanceof Error ? error.message : 'Failed to save template', 'error');
    } finally {
      setIsSaving(false);
    }
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

  // Handle rollback to a previous version
  const handleRollback = (version: TemplateVersion) => {
    setRollbackVersion(version);
    setShowRollbackConfirm(true);
  };

  // Confirm and execute rollback
  const confirmRollback = async () => {
    if (!rollbackVersion || !template) return;

    // Global templates cannot be rolled back
    if (template.isGlobal) {
      showToast('Global templates are read-only and cannot be rolled back.', 'error');
      setShowRollbackConfirm(false);
      setRollbackVersion(null);
      return;
    }

    try {
      // Save current state as a new version before rollback (local)
      const newVersion = saveTemplateVersion(template, user?.id);

      // Update template with the rollback version's content via API
      const response = await fetch(`/api/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: rollbackVersion.name,
          modality: rollbackVersion.modality,
          bodyPart: rollbackVersion.bodyPart,
          description: rollbackVersion.description,
          content: rollbackVersion.content || '',
          sections: rollbackVersion.sections || [],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to rollback template');
      }

      const { data: savedTemplate } = await response.json();

      // Update template with the rollback version's content
      const rolledBackTemplate: Template = {
        ...template,
        name: savedTemplate.name,
        modality: savedTemplate.modality,
        bodyPart: savedTemplate.bodyPart,
        description: savedTemplate.description,
        content: savedTemplate.content?.rawContent || '',
        sections: savedTemplate.content?.sections || [],
        updatedAt: savedTemplate.updatedAt,
        version: (template.version || 0) + 1,
      };

      // Update local state
      setTemplate(rolledBackTemplate);
      setVersions(prev => [newVersion, ...prev]);
      setFormData({
        name: rolledBackTemplate.name,
        modality: rolledBackTemplate.modality,
        bodyPart: rolledBackTemplate.bodyPart,
        description: rolledBackTemplate.description,
        content: rolledBackTemplate.content || '',
        normalFindings: '',
      });
      setOriginalFormData({
        name: rolledBackTemplate.name,
        modality: rolledBackTemplate.modality,
        bodyPart: rolledBackTemplate.bodyPart,
        description: rolledBackTemplate.description,
        content: rolledBackTemplate.content || '',
        normalFindings: '',
      });

      // Clean up
      setShowRollbackConfirm(false);
      setRollbackVersion(null);

      showToast(`Template rolled back to Version ${rollbackVersion.version} successfully!`, 'success');
    } catch (error) {
      console.error('Error rolling back template:', error);
      showToast(error instanceof Error ? error.message : 'Failed to rollback template', 'error');
      setShowRollbackConfirm(false);
      setRollbackVersion(null);
    }
  };

  // Clone global template to personal collection
  const handleCloneToPersonal = async () => {
    if (!template || !template.isGlobal) return;

    setIsCloning(true);

    try {
      const response = await fetch('/api/templates/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          globalTemplateId: template.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to clone template');
      }

      const { data: clonedTemplate } = await response.json();

      showToast(`Template cloned as "${clonedTemplate.name}"!`, 'success');

      // Redirect to the cloned template
      router.push(`/templates/${clonedTemplate.id}`);
    } catch (error) {
      console.error('Error cloning template:', error);
      showToast(error instanceof Error ? error.message : 'Failed to clone template', 'error');
    } finally {
      setIsCloning(false);
    }
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

  if (error || !template) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
          <div className="mb-4 text-5xl">404</div>
          <h3 className="mb-2 text-lg font-semibold text-text-primary">
            {error || 'Template Not Found'}
          </h3>
          <p className="mb-4 text-sm text-text-secondary">
            The template you're looking for doesn't exist or you don't have access.
          </p>
          <Button asChild>
            <Link href="/templates">Back to Templates</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isGlobal = template.isGlobal;
  // Global templates are read-only for everyone (admin editing of globals is Phase 10)
  const canEdit = !isGlobal;

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onStay={handleStay}
        onLeave={handleLeave}
      />

      {/* Rollback Confirmation Dialog */}
      {showRollbackConfirm && rollbackVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" data-testid="rollback-confirm-dialog">
          <div className="mx-4 w-full max-w-md rounded-lg bg-surface p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Confirm Rollback</h3>
            <p className="text-text-secondary mb-4">
              Are you sure you want to rollback to <strong>Version {rollbackVersion.version}</strong>?
            </p>
            <p className="text-sm text-text-muted mb-4">
              This will restore the template to its state from {new Date(rollbackVersion.createdAt).toLocaleString()}.
              The current state will be saved as a new version.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowRollbackConfirm(false);
                  setRollbackVersion(null);
                }}
                data-testid="rollback-cancel-btn"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmRollback}
                data-testid="rollback-confirm-btn"
              >
                Rollback
              </Button>
            </div>
          </div>
        </div>
      )}

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
              Global Template (Read-only)
            </span>
          )}
          {canEdit && !isEditing && (
            <Button onClick={() => setIsEditing(true)} data-testid="edit-template-btn">
              Edit Template
            </Button>
          )}
          {isGlobal && !isEditing && (
            <Button
              variant="outline"
              onClick={handleCloneToPersonal}
              disabled={isCloning}
              data-testid="clone-to-edit-btn"
            >
              {isCloning ? 'Cloning...' : 'Clone to Edit'}
            </Button>
          )}
        </div>
      </div>

      {isEditing ? (
        /* Edit Mode with Tabs */
        <Card>
          <CardHeader>
            <CardTitle>Edit Template</CardTitle>
            <CardDescription>Update template details using the tabs below</CardDescription>
          </CardHeader>

          {/* Tab Navigation */}
          <div className="border-b border-border px-6">
            <nav className="flex gap-4" data-testid="editor-tabs">
              <button
                type="button"
                onClick={() => setEditorTab('sections')}
                className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  editorTab === 'sections'
                    ? 'border-brand text-brand'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                }`}
                data-testid="tab-sections"
              >
                Sections
              </button>
              <button
                type="button"
                onClick={() => setEditorTab('settings')}
                className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  editorTab === 'settings'
                    ? 'border-brand text-brand'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                }`}
                data-testid="tab-settings"
              >
                Settings
              </button>
              <button
                type="button"
                onClick={() => setEditorTab('normalFindings')}
                className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  editorTab === 'normalFindings'
                    ? 'border-brand text-brand'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                }`}
                data-testid="tab-normal-findings"
              >
                Normal Findings
              </button>
            </nav>
          </div>

          <CardContent className="space-y-6 pt-6">
            {/* Sections Tab */}
            {editorTab === 'sections' && (
              <div data-testid="sections-tab-content">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-text-primary">Template Sections</h3>
                    <p className="text-sm text-text-secondary">Define the sections of your report template</p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      const newSection: TemplateSection = {
                        id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                        name: '',
                        content: '',
                      };
                      setEditSections(prev => [...prev, newSection]);
                    }}
                    data-testid="add-section-btn"
                  >
                    + Add Section
                  </Button>
                </div>

                {editSections.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center">
                    <p className="text-text-muted">No sections defined. Click "Add Section" to create one.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {editSections.map((section, index) => (
                      <div
                        key={section.id}
                        className="rounded-lg border border-border bg-surface-muted p-4"
                        data-testid={`edit-section-${index}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <Input
                            value={section.name}
                            onChange={(e) => {
                              const updated = [...editSections];
                              updated[index] = { ...section, name: e.target.value };
                              setEditSections(updated);
                            }}
                            placeholder="Section name (e.g., FINDINGS, IMPRESSION)"
                            className="flex-1 mr-2 font-medium"
                            data-testid={`section-name-${index}`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditSections(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="text-danger hover:text-danger"
                            data-testid={`remove-section-${index}`}
                          >
                            Remove
                          </Button>
                        </div>
                        <Textarea
                          value={section.content}
                          onChange={(e) => {
                            const updated = [...editSections];
                            updated[index] = { ...section, content: e.target.value };
                            setEditSections(updated);
                          }}
                          placeholder="Section content or template text..."
                          rows={4}
                          className="font-mono text-sm"
                          data-testid={`section-content-${index}`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Additional Template Content */}
                <div className="mt-6 pt-6 border-t border-border">
                  <label htmlFor="content" className="mb-2 block text-sm font-medium text-text-primary">
                    Additional Template Content
                  </label>
                  <p className="text-xs text-text-muted mb-2">
                    Raw template content with placeholders (e.g., {'{{FINDINGS}}'}, {'{{IMPRESSION}}'})
                  </p>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => handleChange('content', e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                    data-testid="template-content-editor"
                  />
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {editorTab === 'settings' && (
              <div data-testid="settings-tab-content" className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-text-primary mb-1">Template Settings</h3>
                  <p className="text-sm text-text-secondary">Configure basic template information</p>
                </div>

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
                      data-testid="edit-template-modality"
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
                      data-testid="edit-template-bodypart"
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
                    data-testid="edit-template-description"
                  />
                </div>
              </div>
            )}

            {/* Normal Findings Tab */}
            {editorTab === 'normalFindings' && (
              <div data-testid="normal-findings-tab-content">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-text-primary mb-1">Normal Findings</h3>
                  <p className="text-sm text-text-secondary">
                    Define standard normal findings text that can be quickly inserted into reports.
                    This helps speed up reporting for studies with no significant abnormalities.
                  </p>
                </div>

                <Textarea
                  id="normalFindings"
                  value={formData.normalFindings}
                  onChange={(e) => handleChange('normalFindings', e.target.value)}
                  rows={12}
                  placeholder="Enter normal findings template text...

Example for Chest X-Ray:
The lungs are clear. No focal consolidation, pleural effusion, or pneumothorax. The cardiac silhouette is normal in size. The mediastinal contours are unremarkable. No acute osseous abnormality."
                  className="font-mono text-sm"
                  data-testid="normal-findings-editor"
                />

                <div className="mt-4 p-4 rounded-lg bg-surface-muted border border-border">
                  <h4 className="text-sm font-medium text-text-primary mb-2">💡 Tips</h4>
                  <ul className="text-sm text-text-secondary space-y-1">
                    <li>• Use clear, concise language that accurately describes normal anatomy</li>
                    <li>• Include all relevant structures for the study type</li>
                    <li>• This text can be inserted with one click during report generation</li>
                  </ul>
                </div>
              </div>
            )}
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
                      {/* Rollback button - only for non-latest versions */}
                      {index > 0 && canEdit && (
                        <div className="mt-3 ml-7">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRollback(version);
                            }}
                            data-testid={`rollback-btn-${version.version}`}
                          >
                            Rollback to this version
                          </Button>
                        </div>
                      )}
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
              <Button
                variant="outline"
                onClick={handleCloneToPersonal}
                disabled={isCloning}
                data-testid="clone-to-personal-btn"
              >
                {isCloning ? 'Cloning...' : 'Clone to Personal'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

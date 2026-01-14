'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/ui/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

// Template interface
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
  },
];

// Global templates storage key (shared across all users)
const GLOBAL_TEMPLATES_KEY = 'ai-rad-global-templates';

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

export default function TemplatesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModality, setSelectedModality] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'date-asc' | 'date-desc'>('name-asc');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [templateToClone, setTemplateToClone] = useState<Template | null>(null);
  const [cloneName, setCloneName] = useState('');

  // Load templates on mount and when user changes
  useEffect(() => {
    const storedTemplates = getStoredTemplates(user?.id);
    const globalTemplates = getGlobalTemplates();
    // Combine user's personal templates with global templates
    const globalIds = new Set(globalTemplates.map(t => t.id));
    const combinedTemplates = [
      ...storedTemplates.filter(t => !globalIds.has(t.id)), // personal templates only
      ...globalTemplates,
    ];
    setTemplates(combinedTemplates);
    setIsLoading(false);
  }, [user?.id]);

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.bodyPart.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModality = selectedModality === 'all' || template.modality === selectedModality;
    return matchesSearch && matchesModality;
  });

  // Sort templates
  const sortTemplates = (templatesArray: Template[]) => {
    return [...templatesArray].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });
  };

  // Get unique modalities for filter
  const modalities = ['all', ...new Set(templates.map(t => t.modality))];

  // Personal vs Global templates (sorted)
  const personalTemplates = sortTemplates(filteredTemplates.filter(t => !t.isGlobal));
  const globalTemplates = sortTemplates(filteredTemplates.filter(t => t.isGlobal));

  const handleDelete = (id: string) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;

    // Open confirmation dialog
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!templateToDelete) return;

    const updatedTemplates = templates.filter(t => t.id !== templateToDelete.id);
    setTemplates(updatedTemplates);

    if (templateToDelete.isGlobal) {
      // Admin deleting a global template
      saveGlobalTemplates(updatedTemplates.filter(t => t.isGlobal));
    } else {
      // User deleting personal template
      saveTemplates(updatedTemplates.filter(t => !t.isGlobal), user?.id);
    }

    // Show success toast
    showToast(`Template "${templateToDelete.name}" deleted successfully!`, 'success');

    // Close dialog
    setDeleteDialogOpen(false);
    setTemplateToDelete(null);
  };

  const handleClone = (id: string) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;

    // Open clone dialog
    setTemplateToClone(template);
    setCloneName(`${template.name} (Copy)`);
    setCloneDialogOpen(true);
  };

  const confirmClone = () => {
    if (!templateToClone) return;

    // Create a new personal copy of the template
    const clonedTemplate: Template = {
      ...templateToClone,
      id: 'tpl-' + Math.random().toString(36).substring(2, 9),
      name: cloneName.trim() || `${templateToClone.name} (Copy)`,
      isGlobal: false, // Cloned template is always personal
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to personal templates
    const currentPersonalTemplates = getStoredTemplates(user?.id);
    saveTemplates([clonedTemplate, ...currentPersonalTemplates], user?.id);

    // Update local state
    setTemplates([clonedTemplate, ...templates]);

    // Show success toast
    showToast(`Template "${clonedTemplate.name}" cloned successfully!`, 'success');

    // Close dialog
    setCloneDialogOpen(false);
    setTemplateToClone(null);
    setCloneName('');
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
    <div className="mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Report Templates</h1>
          <p className="mt-1 text-text-secondary">
            Manage your radiology report templates
          </p>
        </div>
        <Button asChild data-testid="create-template-button">
          <Link href="/templates/new">
            + Create Template
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="template-search"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="h-9 rounded-xl border border-border bg-surface px-3 py-1 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
            data-testid="template-sort"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="date-asc">Date (Oldest)</option>
            <option value="date-desc">Date (Newest)</option>
          </select>
        </div>
        <div className="flex gap-2">
          {modalities.map((modality) => (
            <Button
              key={modality}
              variant={selectedModality === modality ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedModality(modality)}
            >
              {modality === 'all' ? 'All' : modality}
            </Button>
          ))}
        </div>
      </div>

      {/* Personal Templates */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Personal Templates ({personalTemplates.length})
        </h2>
        {personalTemplates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 text-5xl">📝</div>
              <h3 className="mb-2 text-lg font-semibold text-text-primary">No personal templates</h3>
              <p className="mb-4 text-center text-sm text-text-secondary">
                Create your own templates or clone from global templates
              </p>
              <Button asChild>
                <Link href="/templates/new">Create Template</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {personalTemplates.map((template) => (
              <Card key={template.id} data-testid={`template-card-${template.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle data-testid={`template-name-${template.id}`}>{template.name}</CardTitle>
                      <CardDescription>{template.modality} - {template.bodyPart}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-text-secondary line-clamp-2">
                    {template.description}
                  </p>
                </CardContent>
                <CardFooter className="justify-between">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/templates/${template.id}`}>Edit</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                    className="text-error hover:text-error"
                  >
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Global Templates */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Global Templates ({globalTemplates.length})
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {globalTemplates.map((template) => (
            <Card key={template.id} data-testid={`template-card-${template.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle data-testid={`template-name-${template.id}`}>{template.name}</CardTitle>
                    <CardDescription>{template.modality} - {template.bodyPart}</CardDescription>
                  </div>
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                    Global
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary line-clamp-2">
                  {template.description}
                </p>
              </CardContent>
              <CardFooter className="justify-between">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/templates/${template.id}`}>View</Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleClone(template.id)}
                  data-testid={`clone-template-${template.id}`}
                >
                  Clone
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Empty state if no templates match filter */}
      {filteredTemplates.length === 0 && templates.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-text-secondary">No templates match your search criteria</p>
          <Button variant="ghost" onClick={() => { setSearchQuery(''); setSelectedModality('all'); }}>
            Clear filters
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent data-testid="delete-confirmation-dialog">
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{templateToDelete?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteDialogOpen(false)}
              data-testid="cancel-delete-button"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              data-testid="confirm-delete-button"
            >
              Delete Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clone Template Dialog */}
      <Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
        <DialogContent data-testid="clone-template-dialog">
          <DialogHeader>
            <DialogTitle>Clone Template</DialogTitle>
            <DialogDescription>
              Create a personal copy of &quot;{templateToClone?.name}&quot;. You can customize the name below.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label htmlFor="clone-name" className="mb-2 block text-sm font-medium text-text-primary">
              Template Name
            </label>
            <Input
              id="clone-name"
              value={cloneName}
              onChange={(e) => setCloneName(e.target.value)}
              placeholder="Enter template name"
              data-testid="clone-name-input"
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCloneDialogOpen(false)}
              data-testid="cancel-clone-button"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmClone}
              data-testid="confirm-clone-button"
            >
              Clone Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

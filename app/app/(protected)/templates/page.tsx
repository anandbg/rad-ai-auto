'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/ui/toast';
import { usePreferences } from '@/lib/preferences/preferences-context';
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
  // Institution sharing
  institutionId?: string;
  isSharedWithInstitution?: boolean;
  sharedBy?: string;
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

// Institution templates storage key
const INSTITUTION_TEMPLATES_KEY = 'ai-rad-institution-templates';

// Institution members storage key
const INSTITUTION_MEMBERS_KEY = 'ai-rad-institution-members';

// Institutions storage key
const INSTITUTIONS_KEY = 'ai-rad-institutions';

// Helper to get institution templates from localStorage
function getInstitutionTemplates(institutionId: string): Template[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(INSTITUTION_TEMPLATES_KEY);
  if (!stored) return [];
  try {
    const allTemplates: Template[] = JSON.parse(stored);
    return allTemplates.filter(t => t.institutionId === institutionId);
  } catch {
    return [];
  }
}

// Helper to save institution template
function saveInstitutionTemplate(template: Template) {
  if (typeof window === 'undefined') return;
  const stored = localStorage.getItem(INSTITUTION_TEMPLATES_KEY);
  const allTemplates: Template[] = stored ? JSON.parse(stored) : [];
  const existingIndex = allTemplates.findIndex(t => t.id === template.id);
  if (existingIndex >= 0) {
    allTemplates[existingIndex] = template;
  } else {
    allTemplates.push(template);
  }
  localStorage.setItem(INSTITUTION_TEMPLATES_KEY, JSON.stringify(allTemplates));
}

// Helper to get user's institution membership
function getUserInstitution(userId: string): string | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(INSTITUTION_MEMBERS_KEY);
  if (!stored) return null;
  try {
    const members: { id: string; institutionId: string; userId: string }[] = JSON.parse(stored);
    const membership = members.find(m => m.userId === userId);
    return membership?.institutionId || null;
  } catch {
    return null;
  }
}

// Helper to get institution name
function getInstitutionName(institutionId: string): string {
  if (typeof window === 'undefined') return '';
  const stored = localStorage.getItem(INSTITUTIONS_KEY);
  if (!stored) return '';
  try {
    const institutions = JSON.parse(stored);
    const inst = institutions.find((i: { id: string; name: string }) => i.id === institutionId);
    return inst?.name || '';
  } catch {
    return '';
  }
}

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
  const { preferences, updatePreference } = usePreferences();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
  const [isInitialized, setIsInitialized] = useState(false);
  const [userInstitutionId, setUserInstitutionId] = useState<string | null>(null);
  const [institutionName, setInstitutionName] = useState('');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [templateToShare, setTemplateToShare] = useState<Template | null>(null);

  // Read URL query params on mount
  useEffect(() => {
    const modalityParam = searchParams.get('modality');
    const searchParam = searchParams.get('search');
    const sortParam = searchParams.get('sort');

    if (modalityParam) {
      setSelectedModality(modalityParam);
    }
    if (searchParam) {
      setSearchQuery(searchParam);
    }
    if (sortParam && ['name-asc', 'name-desc', 'date-asc', 'date-desc'].includes(sortParam)) {
      setSortBy(sortParam as 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc');
    }
    setIsInitialized(true);
  }, [searchParams]);

  // Sync URL when filters change (after initial load)
  const updateUrlParams = useCallback((search: string, modality: string, sort: string) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (modality && modality !== 'all') params.set('modality', modality);
    if (sort && sort !== 'name-asc') params.set('sort', sort);

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [pathname, router]);

  // Debounced URL update when search/filter changes
  useEffect(() => {
    if (!isInitialized) return;
    const timeoutId = setTimeout(() => {
      updateUrlParams(searchQuery, selectedModality, sortBy);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedModality, sortBy, isInitialized, updateUrlParams]);

  // Load templates on mount and when user changes
  useEffect(() => {
    const storedTemplates = getStoredTemplates(user?.id);
    const globalTemplates = getGlobalTemplates();

    // Check if user belongs to an institution
    const instId = user?.id ? getUserInstitution(user.id) : null;
    setUserInstitutionId(instId);
    if (instId) {
      setInstitutionName(getInstitutionName(instId));
    }

    // Get institution templates if user belongs to one
    const instTemplates = instId ? getInstitutionTemplates(instId) : [];

    // Combine all templates (excluding duplicates)
    const seenIds = new Set<string>();
    const combinedTemplates: Template[] = [];

    // Add personal templates first
    for (const t of storedTemplates) {
      if (!seenIds.has(t.id)) {
        seenIds.add(t.id);
        combinedTemplates.push(t);
      }
    }

    // Add institution templates
    for (const t of instTemplates) {
      if (!seenIds.has(t.id)) {
        seenIds.add(t.id);
        combinedTemplates.push(t);
      }
    }

    // Add global templates
    for (const t of globalTemplates) {
      if (!seenIds.has(t.id)) {
        seenIds.add(t.id);
        combinedTemplates.push(t);
      }
    }

    setTemplates(combinedTemplates);
    setIsLoading(false);
  }, [user?.id]);

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const trimmedSearch = searchQuery.trim().toLowerCase();
    const matchesSearch = !trimmedSearch ||
      template.name.toLowerCase().includes(trimmedSearch) ||
      template.description.toLowerCase().includes(trimmedSearch) ||
      template.bodyPart.toLowerCase().includes(trimmedSearch);
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

  // Personal vs Institution vs Global templates (sorted)
  const personalTemplates = sortTemplates(filteredTemplates.filter(t => !t.isGlobal && !t.isSharedWithInstitution));
  const institutionTemplates = sortTemplates(filteredTemplates.filter(t => t.isSharedWithInstitution));
  const globalTemplates = sortTemplates(filteredTemplates.filter(t => t.isGlobal));

  const handleDelete = (id: string) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;

    // Open confirmation dialog
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
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

    // Clear default template preference if deleted template was the default
    if (preferences.defaultTemplate === templateToDelete.id) {
      await updatePreference('defaultTemplate', null);
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

  const handleShareWithInstitution = (id: string) => {
    const template = templates.find(t => t.id === id);
    if (!template || !userInstitutionId) return;

    // Open share dialog
    setTemplateToShare(template);
    setShareDialogOpen(true);
  };

  const confirmShare = () => {
    if (!templateToShare || !userInstitutionId) return;

    // Create a shared copy for the institution
    const sharedTemplate: Template = {
      ...templateToShare,
      id: 'tpl-inst-' + Math.random().toString(36).substring(2, 9),
      isSharedWithInstitution: true,
      institutionId: userInstitutionId,
      sharedBy: user?.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to institution templates
    saveInstitutionTemplate(sharedTemplate);

    // Update local state
    setTemplates([sharedTemplate, ...templates]);

    // Show success toast
    showToast(`Template "${sharedTemplate.name}" shared with ${institutionName}!`, 'success');

    // Log for verification
    console.log(`[Institution Template] Template "${sharedTemplate.name}" shared with institution ${userInstitutionId}`);

    // Close dialog
    setShareDialogOpen(false);
    setTemplateToShare(null);
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
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
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
                <CardFooter className="flex-wrap gap-2 justify-between">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/templates/${template.id}`}>Edit</Link>
                  </Button>
                  <div className="flex gap-2">
                    {userInstitutionId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShareWithInstitution(template.id)}
                        data-testid={`share-template-${template.id}`}
                      >
                        Share
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      className="text-error hover:text-error"
                    >
                      Delete
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Institution Templates */}
      {userInstitutionId && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">
            {institutionName || 'Institution'} Templates ({institutionTemplates.length})
          </h2>
          {institutionTemplates.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="mb-4 text-5xl">🏢</div>
                <h3 className="mb-2 text-lg font-semibold text-text-primary">No institution templates</h3>
                <p className="mb-4 text-center text-sm text-text-secondary">
                  Share your personal templates with your institution
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {institutionTemplates.map((template) => (
                <Card key={template.id} data-testid={`template-card-${template.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle data-testid={`template-name-${template.id}`}>{template.name}</CardTitle>
                        <CardDescription>{template.modality} - {template.bodyPart}</CardDescription>
                      </div>
                      <span className="shrink-0 rounded-full bg-info/10 px-2 py-0.5 text-xs font-medium text-info" data-testid="institution-badge">
                        Institution
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
          )}
        </div>
      )}

      {/* Global Templates */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Global Templates ({globalTemplates.length})
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {globalTemplates.map((template) => (
            <Card key={template.id} data-testid={`template-card-${template.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle data-testid={`template-name-${template.id}`}>{template.name}</CardTitle>
                    <CardDescription>{template.modality} - {template.bodyPart}</CardDescription>
                  </div>
                  <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
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

      {/* Share with Institution Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent data-testid="share-template-dialog">
          <DialogHeader>
            <DialogTitle>Share with Institution</DialogTitle>
            <DialogDescription>
              Share &quot;{templateToShare?.name}&quot; with {institutionName}. All members of your institution will be able to view and use this template.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 rounded-lg bg-info/10 px-4">
            <p className="text-sm text-info">
              <strong>Note:</strong> A copy of this template will be shared with your institution. You will keep your original personal template.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShareDialogOpen(false)}
              data-testid="cancel-share-button"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmShare}
              data-testid="confirm-share-button"
            >
              Share Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

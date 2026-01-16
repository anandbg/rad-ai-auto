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
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

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
  // Bulk selection state
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  // Action loading states
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Read URL query params on mount
  useEffect(() => {
    const modalityParam = searchParams.get('modality');
    const searchParam = searchParams.get('search');
    const sortParam = searchParams.get('sort');
    const pageParam = searchParams.get('page');

    if (modalityParam) {
      setSelectedModality(modalityParam);
    }
    if (searchParam) {
      setSearchQuery(searchParam);
    }
    if (sortParam && ['name-asc', 'name-desc', 'date-asc', 'date-desc'].includes(sortParam)) {
      setSortBy(sortParam as 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc');
    }
    if (pageParam) {
      const page = parseInt(pageParam, 10);
      if (!isNaN(page) && page > 0) {
        setCurrentPage(page);
      }
    }
    setIsInitialized(true);
  }, [searchParams]);

  // Sync URL when filters change (after initial load)
  const updateUrlParams = useCallback((search: string, modality: string, sort: string, page: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (modality && modality !== 'all') params.set('modality', modality);
    if (sort && sort !== 'name-asc') params.set('sort', sort);
    if (page > 1) params.set('page', page.toString());

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [pathname, router]);

  // Debounced URL update when search/filter changes
  useEffect(() => {
    if (!isInitialized) return;
    const timeoutId = setTimeout(() => {
      updateUrlParams(searchQuery, selectedModality, sortBy, currentPage);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedModality, sortBy, currentPage, isInitialized, updateUrlParams]);

  // Reset to page 1 when search/filter changes
  useEffect(() => {
    if (isInitialized) {
      setCurrentPage(1);
    }
  }, [searchQuery, selectedModality]);

  // Load templates from Supabase
  const loadTemplates = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();

    try {
      // Fetch personal templates
      const { data: personalTemplates, error: personalError } = await supabase
        .from('templates_personal')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (personalError) {
        console.error('Error fetching personal templates:', personalError);
      }

      // Fetch published global templates
      const { data: globalTemplates, error: globalError } = await supabase
        .from('templates_global')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (globalError) {
        console.error('Error fetching global templates:', globalError);
      }

      // Format templates
      const formattedTemplates: Template[] = [
        ...(personalTemplates || []).map(t => ({
          id: t.id,
          name: t.name,
          modality: t.modality,
          bodyPart: t.body_part,
          description: t.description || '',
          content: t.content,
          isGlobal: false,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        })),
        ...(globalTemplates || []).map(t => ({
          id: t.id,
          name: t.name,
          modality: t.modality,
          bodyPart: t.body_part,
          description: t.description || '',
          content: t.content,
          isGlobal: true,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        })),
      ];

      setTemplates(formattedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

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

  // Personal vs Global templates (sorted)
  const allPersonalTemplates = sortTemplates(filteredTemplates.filter(t => !t.isGlobal));
  const globalTemplatesList = sortTemplates(filteredTemplates.filter(t => t.isGlobal));

  // Pagination calculations for personal templates
  const totalPersonalTemplates = allPersonalTemplates.length;
  const totalPages = Math.ceil(totalPersonalTemplates / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const personalTemplates = allPersonalTemplates.slice(startIndex, endIndex);

  // Helper for page navigation
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleDelete = (id: string) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;

    // Open confirmation dialog
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!templateToDelete || !user?.id) return;

    setActionLoading(templateToDelete.id);

    try {
      const response = await fetch(`/api/templates/${templateToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok && response.status !== 204) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete template');
      }

      // Update local state
      setTemplates(templates.filter(t => t.id !== templateToDelete.id));

      // Clear default template preference if deleted template was the default
      if (preferences.defaultTemplate === templateToDelete.id) {
        await updatePreference('defaultTemplate', null);
      }

      showToast(`Template "${templateToDelete.name}" deleted successfully!`, 'success');
    } catch (error) {
      console.error('Error deleting template:', error);
      showToast(error instanceof Error ? error.message : 'Failed to delete template', 'error');
    } finally {
      setActionLoading(null);
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleClone = (id: string) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;

    // Open clone dialog
    setTemplateToClone(template);
    setCloneName(`${template.name} (Copy)`);
    setCloneDialogOpen(true);
  };

  const confirmClone = async () => {
    if (!templateToClone || !user?.id) return;

    setActionLoading('clone');

    try {
      const response = await fetch('/api/templates/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          globalTemplateId: templateToClone.id,
          name: cloneName.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to clone template');
      }

      const { data: newTemplate } = await response.json();

      // Add to local state
      const formattedTemplate: Template = {
        id: newTemplate.id,
        name: newTemplate.name,
        modality: newTemplate.modality,
        bodyPart: newTemplate.bodyPart,
        description: newTemplate.description || '',
        content: newTemplate.content,
        isGlobal: false,
        createdAt: newTemplate.createdAt,
        updatedAt: newTemplate.updatedAt,
      };

      setTemplates([formattedTemplate, ...templates]);
      showToast(`Template "${formattedTemplate.name}" cloned successfully!`, 'success');
    } catch (error) {
      console.error('Error cloning template:', error);
      showToast(error instanceof Error ? error.message : 'Failed to clone template', 'error');
    } finally {
      setActionLoading(null);
      setCloneDialogOpen(false);
      setTemplateToClone(null);
      setCloneName('');
    }
  };

  // Bulk selection handlers
  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedTemplateIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTemplateIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTemplateIds.size === allPersonalTemplates.length && allPersonalTemplates.length > 0) {
      // Deselect all
      setSelectedTemplateIds(new Set());
    } else {
      // Select all personal templates (across all pages)
      setSelectedTemplateIds(new Set(allPersonalTemplates.map(t => t.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedTemplateIds.size === 0) return;
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    if (selectedTemplateIds.size === 0 || !user?.id) return;

    setActionLoading('bulk-delete');

    try {
      const idsToDelete = Array.from(selectedTemplateIds);

      // Delete each template via API endpoint
      const deletePromises = idsToDelete.map(async (id) => {
        const response = await fetch(`/api/templates/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok && response.status !== 204) {
          throw new Error(`Failed to delete template ${id}`);
        }
        return id;
      });

      await Promise.all(deletePromises);

      const deletedCount = selectedTemplateIds.size;

      // Update local state
      setTemplates(templates.filter(t => !selectedTemplateIds.has(t.id)));

      // Clear default template preference if any deleted template was the default
      if (preferences.defaultTemplate && selectedTemplateIds.has(preferences.defaultTemplate)) {
        await updatePreference('defaultTemplate', null);
      }

      // Clear selection
      setSelectedTemplateIds(new Set());

      showToast(`Successfully deleted ${deletedCount} template${deletedCount > 1 ? 's' : ''}!`, 'success');
    } catch (error) {
      console.error('Error bulk deleting templates:', error);
      showToast(error instanceof Error ? error.message : 'Failed to delete templates', 'error');
    } finally {
      setActionLoading(null);
      setBulkDeleteDialogOpen(false);
    }
  };

  // Export templates to JSON file
  const handleExportAll = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      templates: {
        personal: personalTemplates.map(t => ({
          name: t.name,
          modality: t.modality,
          bodyPart: t.bodyPart,
          description: t.description,
          content: t.content || '',
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        })),
        global: globalTemplatesList.map(t => ({
          name: t.name,
          modality: t.modality,
          bodyPart: t.bodyPart,
          description: t.description,
          content: t.content || '',
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        })),
      },
      totalCount: personalTemplates.length + globalTemplatesList.length,
    };

    // Create blob and download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `templates-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported ${exportData.totalCount} templates successfully!`, 'success');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent mx-auto" />
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportAll}
            data-testid="export-templates-button"
          >
            Export All
          </Button>
          <Button asChild data-testid="create-template-button">
            <Link href="/templates/new">
              + Create Template
            </Link>
          </Button>
        </div>
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
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {allPersonalTemplates.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer" data-testid="select-all-checkbox">
                <input
                  type="checkbox"
                  checked={selectedTemplateIds.size === allPersonalTemplates.length && allPersonalTemplates.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
                />
                <span className="text-sm text-text-secondary">Select All</span>
              </label>
            )}
            <h2 className="text-lg font-semibold text-text-primary">
              Personal Templates ({totalPersonalTemplates})
            </h2>
          </div>
          {selectedTemplateIds.size > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleBulkDelete}
              data-testid="bulk-delete-button"
            >
              Delete Selected ({selectedTemplateIds.size})
            </Button>
          )}
        </div>
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
              <Card
                key={template.id}
                data-testid={`template-card-${template.id}`}
                className={selectedTemplateIds.has(template.id) ? 'ring-2 ring-brand' : ''}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedTemplateIds.has(template.id)}
                        onChange={() => handleToggleSelect(template.id)}
                        className="mt-1 h-4 w-4 rounded border-border text-brand focus:ring-brand cursor-pointer"
                        data-testid={`checkbox-${template.id}`}
                      />
                      <div className="min-w-0 flex-1">
                        <CardTitle data-testid={`template-name-${template.id}`}>{template.name}</CardTitle>
                        <CardDescription>{template.modality} - {template.bodyPart}</CardDescription>
                      </div>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      className="text-error hover:text-error"
                      disabled={actionLoading === template.id}
                    >
                      Delete
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2" data-testid="pagination-controls">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              data-testid="pagination-prev"
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => goToPage(page)}
                  data-testid={`pagination-page-${page}`}
                  className="min-w-[36px]"
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              data-testid="pagination-next"
            >
              Next
            </Button>
            <span className="ml-2 text-sm text-text-secondary" data-testid="pagination-info">
              Showing {startIndex + 1}-{Math.min(endIndex, totalPersonalTemplates)} of {totalPersonalTemplates}
            </span>
          </div>
        )}
      </div>

      {/* Global Templates */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Global Templates ({globalTemplatesList.length})
        </h2>
        {globalTemplatesList.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 text-5xl">🌍</div>
              <h3 className="mb-2 text-lg font-semibold text-text-primary">No global templates</h3>
              <p className="text-center text-sm text-text-secondary">
                Global templates are managed by administrators
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {globalTemplatesList.map((template) => (
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
                    disabled={actionLoading === 'clone'}
                  >
                    Clone
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
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
              disabled={actionLoading !== null}
            >
              {actionLoading ? 'Deleting...' : 'Delete Template'}
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
              disabled={actionLoading === 'clone'}
            >
              {actionLoading === 'clone' ? 'Cloning...' : 'Clone Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent data-testid="bulk-delete-dialog">
          <DialogHeader>
            <DialogTitle>Delete Multiple Templates</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedTemplateIds.size} template{selectedTemplateIds.size > 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-40 overflow-y-auto">
            <p className="text-sm font-medium text-text-primary mb-2">Templates to delete:</p>
            <ul className="text-sm text-text-secondary space-y-1">
              {Array.from(selectedTemplateIds).map(id => {
                const template = templates.find(t => t.id === id);
                return template ? (
                  <li key={id} className="flex items-center gap-2">
                    <span className="text-danger">•</span>
                    {template.name}
                  </li>
                ) : null;
              })}
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setBulkDeleteDialogOpen(false)}
              data-testid="cancel-bulk-delete-button"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmBulkDelete}
              data-testid="confirm-bulk-delete-button"
              disabled={actionLoading === 'bulk-delete'}
            >
              {actionLoading === 'bulk-delete' ? 'Deleting...' : `Delete ${selectedTemplateIds.size} Template${selectedTemplateIds.size > 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

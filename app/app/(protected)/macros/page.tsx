'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PageWrapper } from '@/components/motion/page-wrapper';
import { FadeIn } from '@/components/motion/fade-in';
import { StaggerContainer } from '@/components/motion/stagger-container';

// Category interface
interface MacroCategory {
  id: string;
  name: string;
  createdAt: string;
}

// Context expansion interface
interface ContextExpansion {
  bodyPart: string;
  text: string;
}

// Macro interface
interface Macro {
  id: string;
  name: string;
  replacementText: string;
  isActive: boolean;
  isGlobal: boolean;
  createdAt: string;
  categoryId?: string;
  // Smart macro support
  isSmartMacro?: boolean;
  contextExpansions?: ContextExpansion[];
}

// Global macros (available to all users - hardcoded for now)
const globalMacros: Macro[] = [
  {
    id: 'macro-global-001',
    name: 'neg',
    replacementText: 'negative for acute findings',
    isActive: true,
    isGlobal: true,
    createdAt: '2024-01-12T09:15:00Z',
  },
];

export default function MacrosPage() {
  const { showToast } = useToast();
  const [macros, setMacros] = useState<Macro[]>([]);
  const [categories, setCategories] = useState<MacroCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMacroName, setNewMacroName] = useState('');
  const [newMacroText, setNewMacroText] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMacro, setEditingMacro] = useState<Macro | null>(null);
  const [editMacroText, setEditMacroText] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [macroToDelete, setMacroToDelete] = useState<Macro | null>(null);
  // Category state
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [macroToMove, setMacroToMove] = useState<Macro | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  // Delete category state
  const [isDeleteCategoryDialogOpen, setIsDeleteCategoryDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<MacroCategory | null>(null);
  // Smart macro state
  const [isSmartMacro, setIsSmartMacro] = useState(false);
  const [contextExpansions, setContextExpansions] = useState<ContextExpansion[]>([]);
  const [newContextBodyPart, setNewContextBodyPart] = useState('');
  const [newContextText, setNewContextText] = useState('');

  // Load macros and categories from API
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch macros and categories in parallel
      const [macrosRes, categoriesRes] = await Promise.all([
        fetch('/api/macros'),
        fetch('/api/macros/categories'),
      ]);

      if (macrosRes.ok) {
        const macrosData = await macrosRes.json();
        // Combine user macros with global macros
        const allMacros = [...(macrosData.data || []), ...globalMacros];
        setMacros(allMacros);
      } else {
        showToast('Failed to load macros', 'error');
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.data || []);
      } else {
        showToast('Failed to load categories', 'error');
      }
    } catch (error) {
      console.error('Error loading macros:', error);
      showToast('Failed to load macros', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Load macros and categories on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateMacro = async () => {
    if (!newMacroName.trim() || !newMacroText.trim()) return;

    try {
      const response = await fetch('/api/macros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMacroName.trim().toLowerCase(),
          replacementText: newMacroText.trim(),
          isActive: true,
          isSmartMacro: isSmartMacro && contextExpansions.length > 0,
          contextExpansions: isSmartMacro && contextExpansions.length > 0 ? contextExpansions : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newMacro = data.data;
        setMacros([newMacro, ...macros]);
        setNewMacroName('');
        setNewMacroText('');
        setIsSmartMacro(false);
        setContextExpansions([]);
        setIsDialogOpen(false);

        if (newMacro.isSmartMacro) {
          showToast(`Smart macro "${newMacro.name}" created with ${contextExpansions.length} context expansion(s)!`, 'success');
        } else {
          showToast(`Macro "${newMacro.name}" created!`, 'success');
        }
      } else {
        const error = await response.json();
        showToast(error.message || 'Failed to create macro', 'error');
      }
    } catch (error) {
      console.error('Error creating macro:', error);
      showToast('Failed to create macro', 'error');
    }
  };

  // Add context expansion for smart macro
  const addContextExpansion = () => {
    if (!newContextBodyPart.trim() || !newContextText.trim()) return;
    setContextExpansions([
      ...contextExpansions,
      { bodyPart: newContextBodyPart.trim(), text: newContextText.trim() }
    ]);
    setNewContextBodyPart('');
    setNewContextText('');
  };

  // Remove context expansion
  const removeContextExpansion = (index: number) => {
    setContextExpansions(contextExpansions.filter((_, i) => i !== index));
  };

  const toggleMacro = async (id: string) => {
    const macro = macros.find(m => m.id === id);
    if (!macro || macro.isGlobal) return;

    try {
      const response = await fetch(`/api/macros/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !macro.isActive }),
      });

      if (response.ok) {
        const data = await response.json();
        setMacros(macros.map(m => m.id === id ? data.data : m));
      } else {
        showToast('Failed to toggle macro', 'error');
      }
    } catch (error) {
      console.error('Error toggling macro:', error);
      showToast('Failed to toggle macro', 'error');
    }
  };

  const openDeleteDialog = (macro: Macro) => {
    setMacroToDelete(macro);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteMacro = async () => {
    if (!macroToDelete) return;

    try {
      const response = await fetch(`/api/macros/${macroToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok || response.status === 204) {
        setMacros(macros.filter(macro => macro.id !== macroToDelete.id));
        showToast(`Macro "${macroToDelete.name}" deleted`, 'success');
      } else {
        showToast('Failed to delete macro', 'error');
      }
    } catch (error) {
      console.error('Error deleting macro:', error);
      showToast('Failed to delete macro', 'error');
    } finally {
      setIsDeleteDialogOpen(false);
      setMacroToDelete(null);
    }
  };

  const openEditDialog = (macro: Macro) => {
    setEditingMacro(macro);
    setEditMacroText(macro.replacementText);
    setIsEditDialogOpen(true);
  };

  const handleEditMacro = async () => {
    if (!editingMacro || !editMacroText.trim()) return;

    try {
      const response = await fetch(`/api/macros/${editingMacro.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replacementText: editMacroText.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setMacros(macros.map(macro =>
          macro.id === editingMacro.id ? data.data : macro
        ));
        showToast(`Macro "${editingMacro.name}" updated`, 'success');
      } else {
        showToast('Failed to update macro', 'error');
      }
    } catch (error) {
      console.error('Error updating macro:', error);
      showToast('Failed to update macro', 'error');
    } finally {
      setIsEditDialogOpen(false);
      setEditingMacro(null);
      setEditMacroText('');
    }
  };

  // Category handlers
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const response = await fetch('/api/macros/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setCategories([data.data, ...categories]);
        setNewCategoryName('');
        setIsCategoryDialogOpen(false);
        showToast(`Category "${data.data.name}" created!`, 'success');
      } else {
        const error = await response.json();
        showToast(error.message || 'Failed to create category', 'error');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      showToast('Failed to create category', 'error');
    }
  };

  const openMoveDialog = (macro: Macro) => {
    setMacroToMove(macro);
    setSelectedCategoryId(macro.categoryId || '');
    setIsMoveDialogOpen(true);
  };

  const handleMoveMacro = async () => {
    if (!macroToMove) return;

    try {
      const response = await fetch(`/api/macros/${macroToMove.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: selectedCategoryId || null }),
      });

      if (response.ok) {
        const data = await response.json();
        setMacros(macros.map(macro =>
          macro.id === macroToMove.id ? data.data : macro
        ));

        const categoryName = selectedCategoryId
          ? categories.find(c => c.id === selectedCategoryId)?.name || 'category'
          : 'Uncategorized';
        showToast(`Macro moved to "${categoryName}"`, 'success');
      } else {
        showToast('Failed to move macro', 'error');
      }
    } catch (error) {
      console.error('Error moving macro:', error);
      showToast('Failed to move macro', 'error');
    } finally {
      setIsMoveDialogOpen(false);
      setMacroToMove(null);
      setSelectedCategoryId('');
    }
  };

  // Delete category handler
  const openDeleteCategoryDialog = (category: MacroCategory) => {
    setCategoryToDelete(category);
    setIsDeleteCategoryDialogOpen(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    // Count macros in this category for the toast message
    const macrosInCategory = macros.filter(m => m.categoryId === categoryToDelete.id);
    const macroCount = macrosInCategory.length;

    try {
      const response = await fetch(`/api/macros/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok || response.status === 204) {
        // Update local state: move macros to uncategorized and remove category
        setMacros(macros.map(macro =>
          macro.categoryId === categoryToDelete.id
            ? { ...macro, categoryId: undefined }
            : macro
        ));
        setCategories(categories.filter(c => c.id !== categoryToDelete.id));

        // Show toast with count of moved macros
        if (macroCount > 0) {
          showToast(`Category "${categoryToDelete.name}" deleted. ${macroCount} macro${macroCount !== 1 ? 's' : ''} moved to Uncategorized.`, 'success');
        } else {
          showToast(`Category "${categoryToDelete.name}" deleted.`, 'success');
        }
      } else {
        showToast('Failed to delete category', 'error');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      showToast('Failed to delete category', 'error');
    } finally {
      setIsDeleteCategoryDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const activeMacros = macros.filter(m => m.isActive);
  const inactiveMacros = macros.filter(m => !m.isActive);

  // Export all macros to JSON file
  const handleExportMacros = () => {
    const userMacros = macros.filter(m => !m.isGlobal);
    const globalMacrosList = macros.filter(m => m.isGlobal);

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      macros: {
        personal: userMacros.map(m => ({
          name: m.name,
          replacementText: m.replacementText,
          isActive: m.isActive,
          categoryId: m.categoryId,
          isSmartMacro: m.isSmartMacro,
          contextExpansions: m.contextExpansions,
          createdAt: m.createdAt,
        })),
        global: globalMacrosList.map(m => ({
          name: m.name,
          replacementText: m.replacementText,
          isActive: m.isActive,
          createdAt: m.createdAt,
        })),
      },
      categories: categories.map(c => ({
        name: c.name,
        createdAt: c.createdAt,
      })),
      totalCount: macros.length,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `macros-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported ${macros.length} macros successfully!`, 'success');
  };

  // Import macros from JSON file
  const handleImportMacros = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importData = JSON.parse(content);

        // Validate the import structure
        if (!importData.macros || !importData.macros.personal) {
          showToast('Invalid file format. Please select a valid macros export file.', 'error');
          return;
        }

        // Import categories first (if any)
        let importedCategoriesCount = 0;
        const categoryIdMap: Record<string, string> = {};

        if (importData.categories && Array.isArray(importData.categories)) {
          for (const cat of importData.categories) {
            // Check if category with same name already exists
            const existing = categories.find(c => c.name.toLowerCase() === cat.name.toLowerCase());
            if (existing) {
              categoryIdMap[cat.name] = existing.id;
            } else {
              // Create new category via API
              try {
                const response = await fetch('/api/macros/categories', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: cat.name }),
                });
                if (response.ok) {
                  const data = await response.json();
                  categoryIdMap[cat.name] = data.data.id;
                  setCategories(prev => [data.data, ...prev]);
                  importedCategoriesCount++;
                }
              } catch {
                // Continue with other categories
              }
            }
          }
        }

        // Import personal macros
        let importedCount = 0;
        let skippedCount = 0;

        for (const m of importData.macros.personal) {
          // Check if macro with same name already exists
          const existingMacro = macros.find(existing => existing.name.toLowerCase() === m.name.toLowerCase());
          if (existingMacro) {
            skippedCount++;
            continue;
          }

          // Find new category ID if this macro had a category
          let newCategoryId: string | undefined;
          if (m.categoryId && importData.categories) {
            const originalCategory = importData.categories.find((c: { name: string }) =>
              categoryIdMap[c.name]
            );
            if (originalCategory) {
              newCategoryId = categoryIdMap[originalCategory.name];
            }
          }

          // Create macro via API
          try {
            const response = await fetch('/api/macros', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: m.name,
                replacementText: m.replacementText,
                isActive: m.isActive ?? true,
                categoryId: newCategoryId,
                isSmartMacro: m.isSmartMacro,
                contextExpansions: m.contextExpansions,
              }),
            });
            if (response.ok) {
              const data = await response.json();
              setMacros(prev => [data.data, ...prev]);
              importedCount++;
            }
          } catch {
            // Continue with other macros
          }
        }

        // Build success message
        let message = `Imported ${importedCount} macro${importedCount !== 1 ? 's' : ''}`;
        if (importedCategoriesCount > 0) {
          message += ` and ${importedCategoriesCount} categor${importedCategoriesCount !== 1 ? 'ies' : 'y'}`;
        }
        if (skippedCount > 0) {
          message += ` (${skippedCount} skipped - already exist)`;
        }
        message += '!';

        showToast(message, 'success');
      } catch {
        showToast('Failed to parse import file. Please ensure it is valid JSON.', 'error');
      }
    };

    reader.readAsText(file);
    // Reset the input so the same file can be selected again
    event.target.value = '';
  };

  // Group active macros by category
  const uncategorizedMacros = activeMacros.filter(m => !m.categoryId);
  const categorizedMacros = categories.map(cat => ({
    category: cat,
    macros: activeMacros.filter(m => m.categoryId === cat.id)
  })).filter(group => group.macros.length > 0);

  if (isLoading) {
    return (
      <PageWrapper className="p-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Macros</h1>
            <p className="mt-2 text-text-secondary">Loading...</p>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="p-6">
      <div className="mx-auto max-w-5xl">
        <FadeIn>
          <div className="mb-8 flex items-center justify-between">
            <header>
              <h1 className="text-3xl font-bold tracking-tight">Macros</h1>
              <p className="mt-2 text-text-secondary">
                Create shortcuts for commonly used terms and phrases
              </p>
            </header>
            <div className="flex gap-2">
              <input
                type="file"
                id="import-macros-input"
                accept=".json"
                onChange={handleImportMacros}
                className="hidden"
                data-testid="import-macros-input"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('import-macros-input')?.click()}
                data-testid="import-macros-button"
              >
                Import
              </Button>
              <Button
                variant="outline"
                onClick={handleExportMacros}
                data-testid="export-macros-button"
              >
                Export
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsCategoryDialogOpen(true)}
                data-testid="create-category-button"
              >
                + Create Category
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="create-macro-button">
                    + Create Macro
                  </Button>
                </DialogTrigger>
              <DialogContent data-testid="create-macro-dialog">
                <DialogHeader>
                  <DialogTitle>Create New Macro</DialogTitle>
                  <DialogDescription>
                    Define a shortcut that expands to longer text during transcription
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 px-6 py-4 max-h-[60vh] overflow-y-auto">
                  <div>
                    <label htmlFor="macro-name" className="mb-2 block text-sm font-medium text-text-primary">
                      Shortcut
                    </label>
                    <Input
                      id="macro-name"
                      placeholder="e.g., nml"
                      value={newMacroName}
                      onChange={(e) => setNewMacroName(e.target.value)}
                      data-testid="macro-name-input"
                    />
                    <p className="mt-1 text-xs text-text-secondary">
                      The abbreviation you&apos;ll type during transcription
                    </p>
                  </div>
                  <div>
                    <label htmlFor="macro-text" className="mb-2 block text-sm font-medium text-text-primary">
                      {isSmartMacro ? 'Default Expansion Text' : 'Expansion Text'}
                    </label>
                    <Textarea
                      id="macro-text"
                      placeholder="e.g., within normal limits"
                      value={newMacroText}
                      onChange={(e) => setNewMacroText(e.target.value)}
                      data-testid="macro-text-input"
                    />
                    <p className="mt-1 text-xs text-text-secondary">
                      {isSmartMacro ? 'Used when no specific body part context matches' : 'The full text that replaces the shortcut'}
                    </p>
                  </div>
                  {/* Smart Macro Toggle */}
                  <div className="flex items-center gap-3 rounded-lg border border-border p-3 bg-surface-muted">
                    <input
                      type="checkbox"
                      id="smart-macro"
                      checked={isSmartMacro}
                      onChange={(e) => setIsSmartMacro(e.target.checked)}
                      className="h-4 w-4 rounded border-border"
                      data-testid="smart-macro-checkbox"
                    />
                    <div>
                      <label htmlFor="smart-macro" className="text-sm font-medium text-text-primary cursor-pointer">
                        Smart Macro (Context-Aware)
                      </label>
                      <p className="text-xs text-text-secondary">
                        Expands differently based on the body part being examined
                      </p>
                    </div>
                  </div>
                  {/* Context Expansions for Smart Macros */}
                  {isSmartMacro && (
                    <div className="space-y-3 rounded-lg border border-brand/30 p-4 bg-brand/5">
                      <h4 className="text-sm font-medium text-text-primary">Context-Specific Expansions</h4>
                      <p className="text-xs text-text-secondary">
                        Add different expansions for specific body parts (e.g., Chest, Abdomen, Head)
                      </p>
                      {/* Existing context expansions */}
                      {contextExpansions.map((ctx, index) => (
                        <div key={index} className="flex items-start gap-2 rounded bg-surface p-2">
                          <div className="flex-1">
                            <span className="text-xs font-semibold text-brand">{ctx.bodyPart}</span>
                            <p className="text-sm text-text-secondary">{ctx.text}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeContextExpansion(index)}
                            className="text-danger"
                          >
                            X
                          </Button>
                        </div>
                      ))}
                      {/* Add new context expansion */}
                      <div className="space-y-2">
                        <select
                          value={newContextBodyPart}
                          onChange={(e) => setNewContextBodyPart(e.target.value)}
                          className="w-full h-9 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
                          data-testid="context-bodypart-select"
                        >
                          <option value="">Select body part...</option>
                          <option value="Head">Head</option>
                          <option value="Neck">Neck</option>
                          <option value="Chest">Chest</option>
                          <option value="Abdomen">Abdomen</option>
                          <option value="Pelvis">Pelvis</option>
                          <option value="Spine">Spine</option>
                          <option value="Upper Extremity">Upper Extremity</option>
                          <option value="Lower Extremity">Lower Extremity</option>
                        </select>
                        <Input
                          placeholder="Context-specific expansion text"
                          value={newContextText}
                          onChange={(e) => setNewContextText(e.target.value)}
                          data-testid="context-text-input"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addContextExpansion}
                          disabled={!newContextBodyPart || !newContextText.trim()}
                          data-testid="add-context-btn"
                        >
                          + Add Context Expansion
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateMacro}
                    disabled={!newMacroName.trim() || !newMacroText.trim()}
                    data-testid="save-macro-button"
                  >
                    Create Macro
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </FadeIn>

        {/* Categories Section */}
        {categories.length > 0 && (
          <FadeIn delay={0.1}>
            <div className="mb-6">
              <h2 className="mb-3 text-sm font-medium text-text-secondary uppercase tracking-wide">
                Categories
              </h2>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const macroCount = macros.filter(m => m.categoryId === cat.id).length;
                  return (
                    <span
                      key={cat.id}
                      className="group inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand"
                      data-testid={`category-badge-${cat.id}`}
                    >
                      {cat.name}
                      {macroCount > 0 && (
                        <span className="text-xs opacity-70">({macroCount})</span>
                      )}
                      <button
                        onClick={() => openDeleteCategoryDialog(cat)}
                        className="ml-1 rounded-full p-0.5 hover:bg-danger/20 hover:text-danger transition-colors"
                        title={`Delete category "${cat.name}"`}
                        data-testid={`delete-category-${cat.id}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          </FadeIn>
        )}

        {/* Categorized Macros */}
        {categorizedMacros.map(({ category, macros: categoryMacros }, index) => (
          <FadeIn key={category.id} delay={0.15 + index * 0.05}>
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold text-text-primary flex items-center gap-2">
                <span className="text-brand">[Folder]</span>
                {category.name} ({categoryMacros.length})
              </h2>
              <StaggerContainer className="grid gap-4 md:grid-cols-2">
                {categoryMacros.map((macro) => (
                  <FadeIn key={macro.id}>
                    <Card data-testid={`macro-card-${macro.id}`}>
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <code className="rounded bg-surface-muted px-2 py-1 text-sm font-semibold text-brand">
                                {macro.name}
                              </code>
                              {macro.isGlobal && (
                                <span className="rounded-full bg-info/10 px-2 py-0.5 text-xs font-medium text-info">
                                  Global
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-sm text-text-secondary">
                              {macro.replacementText}
                            </p>
                          </div>
                          {!macro.isGlobal && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openMoveDialog(macro)}
                                title="Move to category"
                                data-testid={`move-macro-${macro.id}`}
                              >
                                Move
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(macro)}
                                title="Edit macro"
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleMacro(macro.id)}
                                title="Disable macro"
                              >
                                Disable
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteDialog(macro)}
                                className="text-danger hover:text-danger"
                                title="Delete macro"
                              >
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </FadeIn>
                ))}
              </StaggerContainer>
            </div>
          </FadeIn>
        ))}

        {/* Uncategorized / Active Macros */}
        <FadeIn delay={0.2}>
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">
              {categories.length > 0 ? 'Uncategorized Macros' : 'Active Macros'} ({uncategorizedMacros.length})
            </h2>
            {uncategorizedMacros.length > 0 ? (
              <StaggerContainer className="grid gap-4 md:grid-cols-2">
                {uncategorizedMacros.map((macro) => (
                  <FadeIn key={macro.id}>
                    <Card data-testid={`macro-card-${macro.id}`}>
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <code className="rounded bg-surface-muted px-2 py-1 text-sm font-semibold text-brand">
                                {macro.name}
                              </code>
                              {macro.isGlobal && (
                                <span className="rounded-full bg-info/10 px-2 py-0.5 text-xs font-medium text-info">
                                  Global
                                </span>
                              )}
                              {macro.isSmartMacro && (
                                <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning" data-testid={`smart-badge-${macro.id}`}>
                                  Smart
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-sm text-text-secondary">
                              {macro.replacementText}
                            </p>
                            {macro.isSmartMacro && macro.contextExpansions && macro.contextExpansions.length > 0 && (
                              <div className="mt-2 text-xs text-text-muted">
                                Context expansions: {macro.contextExpansions.map(c => c.bodyPart).join(', ')}
                              </div>
                            )}
                          </div>
                          {!macro.isGlobal && (
                            <div className="flex gap-1">
                              {categories.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openMoveDialog(macro)}
                                  title="Move to category"
                                  data-testid={`move-macro-${macro.id}`}
                                >
                                  Move
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(macro)}
                                title="Edit macro"
                                data-testid={`edit-macro-${macro.id}`}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleMacro(macro.id)}
                                title="Disable macro"
                              >
                                Disable
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteDialog(macro)}
                                className="text-danger hover:text-danger"
                                title="Delete macro"
                                data-testid={`delete-macro-${macro.id}`}
                              >
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </FadeIn>
                ))}
              </StaggerContainer>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <p className="text-sm text-text-secondary">No {categories.length > 0 ? 'uncategorized' : 'active'} macros</p>
              </div>
            )}
          </div>
        </FadeIn>

        {/* Inactive Macros */}
        {inactiveMacros.length > 0 && (
          <FadeIn delay={0.3}>
            <div>
              <h2 className="mb-4 text-lg font-semibold text-text-secondary">
                Inactive Macros ({inactiveMacros.length})
              </h2>
              <StaggerContainer className="grid gap-4 md:grid-cols-2 opacity-60">
                {inactiveMacros.map((macro) => (
                  <FadeIn key={macro.id}>
                    <Card data-testid={`macro-card-${macro.id}`}>
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <code className="rounded bg-surface-muted px-2 py-1 text-sm font-semibold text-text-secondary">
                                {macro.name}
                              </code>
                            </div>
                            <p className="mt-2 text-sm text-text-secondary">
                              {macro.replacementText}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleMacro(macro.id)}
                              title="Enable macro"
                            >
                              Enable
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(macro)}
                              className="text-danger hover:text-danger"
                              title="Delete macro"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </FadeIn>
                ))}
              </StaggerContainer>
            </div>
          </FadeIn>
        )}

        {macros.length === 0 && (
          <FadeIn delay={0.1}>
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
              <div className="mb-4 text-5xl">[Lightning]</div>
              <h3 className="mb-2 text-lg font-semibold text-text-primary">No macros yet</h3>
              <p className="mb-4 text-sm text-text-secondary">
                Create your first macro to speed up transcription
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                Create Macro
              </Button>
            </div>
          </FadeIn>
        )}

        {/* Edit Macro Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent data-testid="edit-macro-dialog">
            <DialogHeader>
              <DialogTitle>Edit Macro</DialogTitle>
              <DialogDescription>
                Modify the expansion text for &quot;{editingMacro?.name}&quot;
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 px-6 py-4">
              <div>
                <label htmlFor="edit-macro-text" className="mb-2 block text-sm font-medium text-text-primary">
                  Expansion Text
                </label>
                <Textarea
                  id="edit-macro-text"
                  placeholder="Enter expansion text"
                  value={editMacroText}
                  onChange={(e) => setEditMacroText(e.target.value)}
                  data-testid="edit-macro-text-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleEditMacro}
                disabled={!editMacroText.trim()}
                data-testid="save-edit-macro-button"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Macro Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent data-testid="delete-macro-dialog">
            <DialogHeader>
              <DialogTitle>Delete Macro</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the macro &quot;{macroToDelete?.name}&quot;? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} data-testid="cancel-delete-macro-button">
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmDeleteMacro}
                data-testid="confirm-delete-macro-button"
              >
                Delete Macro
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Category Dialog */}
        <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
          <DialogContent data-testid="create-category-dialog">
            <DialogHeader>
              <DialogTitle>Create Category</DialogTitle>
              <DialogDescription>
                Create a new category to organize your macros
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 px-6 py-4">
              <div>
                <label htmlFor="category-name" className="mb-2 block text-sm font-medium text-text-primary">
                  Category Name
                </label>
                <Input
                  id="category-name"
                  placeholder="e.g., Anatomy, Findings, Impressions"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  data-testid="category-name-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim()}
                data-testid="save-category-button"
              >
                Create Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Move Macro to Category Dialog */}
        <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
          <DialogContent data-testid="move-macro-dialog">
            <DialogHeader>
              <DialogTitle>Move Macro</DialogTitle>
              <DialogDescription>
                Move &quot;{macroToMove?.name}&quot; to a category
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 px-6 py-4">
              <div>
                <label htmlFor="select-category" className="mb-2 block text-sm font-medium text-text-primary">
                  Select Category
                </label>
                <select
                  id="select-category"
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
                  data-testid="select-category-dropdown"
                >
                  <option value="">Uncategorized</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMoveDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleMoveMacro}
                data-testid="confirm-move-macro-button"
              >
                Move Macro
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Category Confirmation Dialog */}
        <Dialog open={isDeleteCategoryDialogOpen} onOpenChange={setIsDeleteCategoryDialogOpen}>
          <DialogContent data-testid="delete-category-dialog">
            <DialogHeader>
              <DialogTitle>Delete Category</DialogTitle>
              <DialogDescription>
                {(() => {
                  const macroCount = categoryToDelete
                    ? macros.filter(m => m.categoryId === categoryToDelete.id).length
                    : 0;
                  if (macroCount > 0) {
                    return `Are you sure you want to delete the category "${categoryToDelete?.name}"? The ${macroCount} macro${macroCount !== 1 ? 's' : ''} in this category will be moved to Uncategorized.`;
                  }
                  return `Are you sure you want to delete the category "${categoryToDelete?.name}"?`;
                })()}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteCategoryDialogOpen(false)} data-testid="cancel-delete-category-button">
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteCategory}
                data-testid="confirm-delete-category-button"
              >
                Delete Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageWrapper>
  );
}

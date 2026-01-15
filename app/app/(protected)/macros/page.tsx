'use client';

import { useState, useEffect } from 'react';
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
import { useAuth } from '@/lib/auth/auth-context';

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

// Global macros (available to all users)
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

// Helper to get user-specific storage key
function getStorageKey(userId: string | undefined): string {
  return userId ? `ai-rad-macros-${userId}` : 'ai-rad-macros';
}

// Helper to get categories storage key
function getCategoriesStorageKey(userId: string | undefined): string {
  return userId ? `ai-rad-macro-categories-${userId}` : 'ai-rad-macro-categories';
}

// Helper to get macros from localStorage
function getStoredMacros(userId: string | undefined): Macro[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(getStorageKey(userId));
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Helper to get categories from localStorage
function getStoredCategories(userId: string | undefined): MacroCategory[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(getCategoriesStorageKey(userId));
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Helper to save macros to localStorage
function saveMacros(macros: Macro[], userId: string | undefined) {
  if (typeof window === 'undefined') return;
  // Only save non-global macros
  const userMacros = macros.filter(m => !m.isGlobal);
  localStorage.setItem(getStorageKey(userId), JSON.stringify(userMacros));
}

// Helper to save categories to localStorage
function saveCategories(categories: MacroCategory[], userId: string | undefined) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getCategoriesStorageKey(userId), JSON.stringify(categories));
}

export default function MacrosPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [macros, setMacros] = useState<Macro[]>([]);
  const [categories, setCategories] = useState<MacroCategory[]>([]);
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
  // Smart macro state
  const [isSmartMacro, setIsSmartMacro] = useState(false);
  const [contextExpansions, setContextExpansions] = useState<ContextExpansion[]>([]);
  const [newContextBodyPart, setNewContextBodyPart] = useState('');
  const [newContextText, setNewContextText] = useState('');

  // Load macros and categories on mount and when user changes
  useEffect(() => {
    const storedMacros = getStoredMacros(user?.id);
    const storedCategories = getStoredCategories(user?.id);
    // Combine user macros with global macros
    const allMacros = [...storedMacros, ...globalMacros];
    setMacros(allMacros);
    setCategories(storedCategories);
  }, [user?.id]);

  const handleCreateMacro = () => {
    if (!newMacroName.trim() || !newMacroText.trim()) return;

    const newMacro: Macro = {
      id: `macro-${Date.now()}`,
      name: newMacroName.trim().toLowerCase(),
      replacementText: newMacroText.trim(),
      isActive: true,
      isGlobal: false,
      createdAt: new Date().toISOString(),
      isSmartMacro: isSmartMacro && contextExpansions.length > 0,
      contextExpansions: isSmartMacro && contextExpansions.length > 0 ? contextExpansions : undefined,
    };

    const updatedMacros = [newMacro, ...macros];
    setMacros(updatedMacros);
    saveMacros(updatedMacros, user?.id);
    setNewMacroName('');
    setNewMacroText('');
    setIsSmartMacro(false);
    setContextExpansions([]);
    setIsDialogOpen(false);

    if (newMacro.isSmartMacro) {
      showToast(`Smart macro "${newMacro.name}" created with ${contextExpansions.length} context expansion(s)!`, 'success');
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

  const toggleMacro = (id: string) => {
    const updatedMacros = macros.map(macro =>
      macro.id === id ? { ...macro, isActive: !macro.isActive } : macro
    );
    setMacros(updatedMacros);
    saveMacros(updatedMacros, user?.id);
  };

  const openDeleteDialog = (macro: Macro) => {
    setMacroToDelete(macro);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteMacro = () => {
    if (!macroToDelete) return;
    const updatedMacros = macros.filter(macro => macro.id !== macroToDelete.id);
    setMacros(updatedMacros);
    saveMacros(updatedMacros, user?.id);
    setIsDeleteDialogOpen(false);
    setMacroToDelete(null);
  };

  const openEditDialog = (macro: Macro) => {
    setEditingMacro(macro);
    setEditMacroText(macro.replacementText);
    setIsEditDialogOpen(true);
  };

  const handleEditMacro = () => {
    if (!editingMacro || !editMacroText.trim()) return;

    const updatedMacros = macros.map(macro =>
      macro.id === editingMacro.id
        ? { ...macro, replacementText: editMacroText.trim() }
        : macro
    );
    setMacros(updatedMacros);
    saveMacros(updatedMacros, user?.id);
    setIsEditDialogOpen(false);
    setEditingMacro(null);
    setEditMacroText('');
  };

  // Category handlers
  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;

    const newCategory: MacroCategory = {
      id: `cat-${Date.now()}`,
      name: newCategoryName.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedCategories = [newCategory, ...categories];
    setCategories(updatedCategories);
    saveCategories(updatedCategories, user?.id);
    setNewCategoryName('');
    setIsCategoryDialogOpen(false);
    showToast(`Category "${newCategory.name}" created!`, 'success');
  };

  const openMoveDialog = (macro: Macro) => {
    setMacroToMove(macro);
    setSelectedCategoryId(macro.categoryId || '');
    setIsMoveDialogOpen(true);
  };

  const handleMoveMacro = () => {
    if (!macroToMove) return;

    const updatedMacros = macros.map(macro =>
      macro.id === macroToMove.id
        ? { ...macro, categoryId: selectedCategoryId || undefined }
        : macro
    );
    setMacros(updatedMacros);
    saveMacros(updatedMacros, user?.id);

    const categoryName = selectedCategoryId
      ? categories.find(c => c.id === selectedCategoryId)?.name || 'category'
      : 'Uncategorized';
    showToast(`Macro moved to "${categoryName}"`, 'success');

    setIsMoveDialogOpen(false);
    setMacroToMove(null);
    setSelectedCategoryId('');
  };

  const getCategoryName = (categoryId: string | undefined): string => {
    if (!categoryId) return '';
    return categories.find(c => c.id === categoryId)?.name || '';
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

  // Group active macros by category
  const uncategorizedMacros = activeMacros.filter(m => !m.categoryId);
  const categorizedMacros = categories.map(cat => ({
    category: cat,
    macros: activeMacros.filter(m => m.categoryId === cat.id)
  })).filter(group => group.macros.length > 0);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Macros</h1>
          <p className="mt-1 text-text-secondary">
            Create shortcuts for commonly used terms and phrases
          </p>
        </div>
        <div className="flex gap-2">
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
                  The abbreviation you'll type during transcription
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
                    🧠 Smart Macro (Context-Aware)
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
                        ✕
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

      {/* Categories Section */}
      {categories.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-text-secondary uppercase tracking-wide">
            Categories
          </h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span
                key={cat.id}
                className="rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand"
                data-testid={`category-badge-${cat.id}`}
              >
                {cat.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Categorized Macros */}
      {categorizedMacros.map(({ category, macros: categoryMacros }) => (
        <div key={category.id} className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-text-primary flex items-center gap-2">
            <span className="text-brand">📁</span>
            {category.name} ({categoryMacros.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {categoryMacros.map((macro) => (
              <Card key={macro.id} data-testid={`macro-card-${macro.id}`}>
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
            ))}
          </div>
        </div>
      ))}

      {/* Uncategorized / Active Macros */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          {categories.length > 0 ? 'Uncategorized Macros' : 'Active Macros'} ({uncategorizedMacros.length})
        </h2>
        {uncategorizedMacros.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {uncategorizedMacros.map((macro) => (
              <Card key={macro.id} data-testid={`macro-card-${macro.id}`}>
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
                            🧠 Smart
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
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-text-secondary">No {categories.length > 0 ? 'uncategorized' : 'active'} macros</p>
          </div>
        )}
      </div>

      {/* Inactive Macros */}
      {inactiveMacros.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-text-secondary">
            Inactive Macros ({inactiveMacros.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 opacity-60">
            {inactiveMacros.map((macro) => (
              <Card key={macro.id} data-testid={`macro-card-${macro.id}`}>
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
            ))}
          </div>
        </div>
      )}

      {macros.length === 0 && (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
          <div className="mb-4 text-5xl">⚡</div>
          <h3 className="mb-2 text-lg font-semibold text-text-primary">No macros yet</h3>
          <p className="mb-4 text-sm text-text-secondary">
            Create your first macro to speed up transcription
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            Create Macro
          </Button>
        </div>
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
    </div>
  );
}

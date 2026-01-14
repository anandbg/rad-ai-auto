'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

// Macro interface
interface Macro {
  id: string;
  name: string;
  replacementText: string;
  isActive: boolean;
  isGlobal: boolean;
  createdAt: string;
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

// Helper to save macros to localStorage
function saveMacros(macros: Macro[], userId: string | undefined) {
  if (typeof window === 'undefined') return;
  // Only save non-global macros
  const userMacros = macros.filter(m => !m.isGlobal);
  localStorage.setItem(getStorageKey(userId), JSON.stringify(userMacros));
}

export default function MacrosPage() {
  const { user } = useAuth();
  const [macros, setMacros] = useState<Macro[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMacroName, setNewMacroName] = useState('');
  const [newMacroText, setNewMacroText] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMacro, setEditingMacro] = useState<Macro | null>(null);
  const [editMacroText, setEditMacroText] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [macroToDelete, setMacroToDelete] = useState<Macro | null>(null);

  // Load macros on mount and when user changes
  useEffect(() => {
    const storedMacros = getStoredMacros(user?.id);
    // Combine user macros with global macros
    const allMacros = [...storedMacros, ...globalMacros];
    setMacros(allMacros);
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
    };

    const updatedMacros = [newMacro, ...macros];
    setMacros(updatedMacros);
    saveMacros(updatedMacros, user?.id);
    setNewMacroName('');
    setNewMacroText('');
    setIsDialogOpen(false);
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

  const activeMacros = macros.filter(m => m.isActive);
  const inactiveMacros = macros.filter(m => !m.isActive);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Macros</h1>
          <p className="mt-1 text-text-secondary">
            Create shortcuts for commonly used terms and phrases
          </p>
        </div>
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
            <div className="space-y-4 px-6 py-4">
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
                  Expansion Text
                </label>
                <Textarea
                  id="macro-text"
                  placeholder="e.g., within normal limits"
                  value={newMacroText}
                  onChange={(e) => setNewMacroText(e.target.value)}
                  data-testid="macro-text-input"
                />
                <p className="mt-1 text-xs text-text-secondary">
                  The full text that replaces the shortcut
                </p>
              </div>
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

      {/* Active Macros */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Active Macros ({activeMacros.length})
        </h2>
        {activeMacros.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {activeMacros.map((macro) => (
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
            <p className="text-sm text-text-secondary">No active macros</p>
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
    </div>
  );
}

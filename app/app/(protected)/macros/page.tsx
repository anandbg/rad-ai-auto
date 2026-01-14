'use client';

import { useState } from 'react';
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

// Mock macros for development
const initialMacros = [
  {
    id: 'macro-001',
    name: 'nml',
    replacementText: 'within normal limits',
    isActive: true,
    isGlobal: false,
    createdAt: '2024-01-10T10:00:00Z',
  },
  {
    id: 'macro-002',
    name: 'nad',
    replacementText: 'no acute disease',
    isActive: true,
    isGlobal: false,
    createdAt: '2024-01-11T14:30:00Z',
  },
  {
    id: 'macro-003',
    name: 'neg',
    replacementText: 'negative for acute findings',
    isActive: true,
    isGlobal: true,
    createdAt: '2024-01-12T09:15:00Z',
  },
  {
    id: 'macro-004',
    name: 'wnl',
    replacementText: 'within normal limits',
    isActive: false,
    isGlobal: false,
    createdAt: '2024-01-13T16:45:00Z',
  },
];

export default function MacrosPage() {
  const [macros, setMacros] = useState(initialMacros);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMacroName, setNewMacroName] = useState('');
  const [newMacroText, setNewMacroText] = useState('');

  const handleCreateMacro = () => {
    if (!newMacroName.trim() || !newMacroText.trim()) return;

    const newMacro = {
      id: `macro-${Date.now()}`,
      name: newMacroName.trim().toLowerCase(),
      replacementText: newMacroText.trim(),
      isActive: true,
      isGlobal: false,
      createdAt: new Date().toISOString(),
    };

    setMacros([newMacro, ...macros]);
    setNewMacroName('');
    setNewMacroText('');
    setIsDialogOpen(false);
  };

  const toggleMacro = (id: string) => {
    setMacros(macros.map(macro =>
      macro.id === id ? { ...macro, isActive: !macro.isActive } : macro
    ));
  };

  const deleteMacro = (id: string) => {
    setMacros(macros.filter(macro => macro.id !== id));
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
                          onClick={() => toggleMacro(macro.id)}
                          title="Disable macro"
                        >
                          Disable
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMacro(macro.id)}
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
                        onClick={() => deleteMacro(macro.id)}
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
    </div>
  );
}

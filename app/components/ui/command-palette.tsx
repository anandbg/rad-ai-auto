'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  icon: string;
  action: () => void;
  category: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    // Navigation
    { id: 'go-dashboard', label: 'Go to Dashboard', shortcut: 'G D', icon: '🏠', action: () => router.push('/dashboard'), category: 'Navigation' },
    { id: 'go-transcribe', label: 'Go to Transcribe', shortcut: 'G T', icon: '🎤', action: () => router.push('/transcribe'), category: 'Navigation' },
    { id: 'go-generate', label: 'Go to Generate', shortcut: 'G G', icon: '📝', action: () => router.push('/generate'), category: 'Navigation' },
    { id: 'go-templates', label: 'Go to Templates', shortcut: 'G L', icon: '📋', action: () => router.push('/templates'), category: 'Navigation' },
    { id: 'go-macros', label: 'Go to Macros', shortcut: 'G M', icon: '⚡', action: () => router.push('/macros'), category: 'Navigation' },
    { id: 'go-billing', label: 'Go to Billing', shortcut: 'G B', icon: '💳', action: () => router.push('/billing'), category: 'Navigation' },
    { id: 'go-settings', label: 'Go to Settings', shortcut: 'G S', icon: '⚙️', action: () => router.push('/settings'), category: 'Navigation' },
    { id: 'go-productivity', label: 'Go to Productivity', shortcut: 'G P', icon: '📊', action: () => router.push('/productivity'), category: 'Navigation' },

    // Actions
    { id: 'new-template', label: 'Create New Template', shortcut: 'N T', icon: '➕', action: () => router.push('/templates/new'), category: 'Actions' },
    { id: 'start-recording', label: 'Start Recording', shortcut: 'R', icon: '🔴', action: () => router.push('/transcribe?autostart=true'), category: 'Actions' },
    { id: 'new-report', label: 'Generate New Report', shortcut: 'N R', icon: '📄', action: () => router.push('/generate'), category: 'Actions' },

    // Help
    { id: 'show-shortcuts', label: 'Show Keyboard Shortcuts', shortcut: '?', icon: '⌨️', action: () => {}, category: 'Help' },
    { id: 'view-tutorial', label: 'View Tutorial', icon: '📚', action: () => router.push('/welcome'), category: 'Help' },
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  const flatFilteredCommands = filteredCommands;

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, flatFilteredCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (flatFilteredCommands[selectedIndex]) {
          flatFilteredCommands[selectedIndex].action();
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [flatFilteredCommands, selectedIndex, onClose]);

  const executeCommand = (command: Command) => {
    command.action();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden" data-testid="command-palette">
        <DialogTitle className="sr-only">Command Palette</DialogTitle>

        {/* Search input */}
        <div className="border-b border-border p-3">
          <div className="flex items-center gap-2">
            <span className="text-text-muted">🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent text-text-primary outline-none placeholder:text-text-muted"
              data-testid="command-palette-search"
            />
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-surface-secondary px-1.5 font-mono text-[10px] text-text-muted">
              ESC
            </kbd>
          </div>
        </div>

        {/* Commands list */}
        <div className="max-h-80 overflow-y-auto p-2" data-testid="command-palette-results">
          {Object.entries(groupedCommands).map(([category, cmds]) => (
            <div key={category} className="mb-2">
              <div className="px-2 py-1 text-xs font-semibold text-text-muted uppercase tracking-wider">
                {category}
              </div>
              {cmds.map((cmd) => {
                const globalIndex = flatFilteredCommands.indexOf(cmd);
                const isSelected = globalIndex === selectedIndex;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => executeCommand(cmd)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                      isSelected
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-primary hover:bg-surface-secondary'
                    }`}
                    data-testid={`command-${cmd.id}`}
                  >
                    <span className="text-lg">{cmd.icon}</span>
                    <span className="flex-1">{cmd.label}</span>
                    {cmd.shortcut && (
                      <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-surface-secondary px-1.5 font-mono text-[10px] text-text-muted">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {flatFilteredCommands.length === 0 && (
            <div className="p-8 text-center text-text-muted">
              No commands found for "{search}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-2 flex items-center justify-between text-xs text-text-muted">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded border border-border bg-surface-secondary">↑</kbd>
              <kbd className="px-1 py-0.5 rounded border border-border bg-surface-secondary">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded border border-border bg-surface-secondary">↵</kbd>
              to select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded border border-border bg-surface-secondary">⌘</kbd>
            <kbd className="px-1 py-0.5 rounded border border-border bg-surface-secondary">K</kbd>
            to toggle
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to manage keyboard shortcuts globally
export function useKeyboardShortcuts() {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette: Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      // Don't trigger shortcuts if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Show shortcuts help: ?
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
        return;
      }

      // Quick navigation shortcuts (G + letter)
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey) {
        // Set up listener for next key
        const handleNextKey = (nextE: KeyboardEvent) => {
          window.removeEventListener('keydown', handleNextKey);

          const routes: Record<string, string> = {
            'd': '/dashboard',
            't': '/transcribe',
            'g': '/generate',
            'l': '/templates',
            'm': '/macros',
            'b': '/billing',
            's': '/settings',
            'p': '/productivity',
          };

          if (routes[nextE.key]) {
            nextE.preventDefault();
            router.push(routes[nextE.key]);
          }
        };

        // Listen for the next key within 1 second
        window.addEventListener('keydown', handleNextKey);
        setTimeout(() => {
          window.removeEventListener('keydown', handleNextKey);
        }, 1000);
      }

      // Start recording: R
      if (e.key === 'r' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        router.push('/transcribe?autostart=true');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    openCommandPalette: () => setIsCommandPaletteOpen(true),
    closeCommandPalette: () => setIsCommandPaletteOpen(false),
  };
}

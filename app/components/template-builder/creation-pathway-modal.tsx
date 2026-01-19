'use client';

import { FileEdit, Sparkles, Copy, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export type PathwayType = 'manual' | 'ai' | 'clone' | 'import';

interface CreationPathwayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (pathway: PathwayType) => void;
}

interface PathwayOption {
  type: PathwayType;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}

const pathwayOptions: PathwayOption[] = [
  {
    type: 'manual',
    icon: FileEdit,
    label: 'Start from scratch',
    description: 'Build your template section by section',
  },
  {
    type: 'ai',
    icon: Sparkles,
    label: 'Describe your template',
    description: 'AI generates a structured template from your description',
  },
  {
    type: 'clone',
    icon: Copy,
    label: 'Start from existing',
    description: 'Copy an existing template and customize it',
  },
  {
    type: 'import',
    icon: Upload,
    label: 'Import JSON',
    description: 'Import a template from a JSON file',
  },
];

/**
 * CreationPathwayModal - Modal for selecting template creation method
 *
 * Provides 4 pathways:
 * - Manual: Build from scratch with section editor
 * - AI-Assisted: Generate template from description
 * - Clone: Start from existing template
 * - Import: Load template from JSON file
 */
export function CreationPathwayModal({
  open,
  onOpenChange,
  onSelect,
}: CreationPathwayModalProps) {
  const handleSelect = (pathway: PathwayType) => {
    onSelect(pathway);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Template</DialogTitle>
          <DialogDescription>
            Choose how you&apos;d like to create your template
          </DialogDescription>
        </DialogHeader>

        {/* Pathway options grid */}
        <div className="grid gap-4 py-4 sm:grid-cols-2">
          {pathwayOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.type}
                onClick={() => handleSelect(option.type)}
                className="group relative flex flex-col items-start gap-3 rounded-lg border border-border bg-surface p-4 text-left transition-all hover:border-brand hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                {/* Icon */}
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
                  <Icon className="h-5 w-5" />
                </div>

                {/* Label and description */}
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-text-primary">
                    {option.label}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {option.description}
                  </div>
                </div>

                {/* Hover indicator */}
                <div className="absolute inset-0 rounded-lg ring-2 ring-brand opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

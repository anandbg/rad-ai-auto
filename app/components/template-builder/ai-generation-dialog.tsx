'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { type AIGeneratedTemplate } from '@/lib/validation/template-schema';

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

// Generation mode type
type GenerationMode = 'describe' | 'structure';

interface AIGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (data: AIGeneratedTemplate) => void;
  initialModality?: string;
  initialBodyPart?: string;
}

export function AIGenerationDialog({
  open,
  onOpenChange,
  onGenerated,
  initialModality = '',
  initialBodyPart = '',
}: AIGenerationDialogProps) {
  const { showToast } = useToast();
  const [mode, setMode] = useState<GenerationMode>('describe');
  const [description, setDescription] = useState('');
  const [rawTemplate, setRawTemplate] = useState('');
  const [modality, setModality] = useState(initialModality);
  const [bodyPart, setBodyPart] = useState(initialBodyPart);
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setMode('describe');
      setDescription('');
      setRawTemplate('');
      setModality(initialModality);
      setBodyPart(initialBodyPart);
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate based on mode
    if (mode === 'describe' && !description.trim()) {
      showToast('Please enter a template description', 'error');
      return;
    }

    if (mode === 'structure' && !rawTemplate.trim()) {
      showToast('Please paste your template text', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/templates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          description: mode === 'describe' ? description.trim() : undefined,
          rawTemplate: mode === 'structure' ? rawTemplate.trim() : undefined,
          modality: modality || undefined,
          bodyPart: bodyPart || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to generate template');
      }

      const { data } = await response.json();

      // Call the callback with generated data
      onGenerated(data);

      // Close dialog and reset form
      handleOpenChange(false);
    } catch (error) {
      console.error('Error generating template:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to generate template',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate Template with AI</DialogTitle>
          <DialogDescription>
            {mode === 'describe'
              ? 'Describe the template you need, and AI will create a structured template for you to customize.'
              : 'Paste your existing template text, and AI will convert it into a structured format.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Mode toggle */}
            <div className="flex rounded-lg border border-border p-1 bg-surface-muted">
              <button
                type="button"
                onClick={() => setMode('describe')}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  mode === 'describe'
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                data-testid="mode-describe"
              >
                Describe New Template
              </button>
              <button
                type="button"
                onClick={() => setMode('structure')}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  mode === 'structure'
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                data-testid="mode-structure"
              >
                Structure Existing Text
              </button>
            </div>

            {/* Description textarea (describe mode) */}
            {mode === 'describe' && (
              <div>
                <label htmlFor="ai-description" className="mb-2 block text-sm font-medium text-text-primary">
                  Template Description <span className="text-error">*</span>
                </label>
                <Textarea
                  id="ai-description"
                  placeholder="Describe your template... e.g., 'CT chest with contrast for pulmonary embolism workup'"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  disabled={isLoading}
                  className="resize-none"
                  data-testid="ai-description-input"
                />
                <p className="mt-1 text-xs text-text-secondary">
                  Be specific about the clinical context and what you need in the template
                </p>
              </div>
            )}

            {/* Raw template textarea (structure mode) */}
            {mode === 'structure' && (
              <div>
                <label htmlFor="ai-raw-template" className="mb-2 block text-sm font-medium text-text-primary">
                  Paste Your Template Text <span className="text-error">*</span>
                </label>
                <Textarea
                  id="ai-raw-template"
                  placeholder="Paste your existing template here...

Example:
# MRI lumbar spine template

Clinical Information:
Technique:
Comparison:
Findings:
...

AI will parse and structure this into organized sections."
                  value={rawTemplate}
                  onChange={(e) => setRawTemplate(e.target.value)}
                  rows={10}
                  disabled={isLoading}
                  className="resize-none font-mono text-sm"
                  data-testid="ai-raw-template-input"
                />
                <p className="mt-1 text-xs text-text-secondary">
                  Paste any text-based template. AI will extract sections, checklists, and instructions.
                </p>
              </div>
            )}

            {/* Optional filters */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ai-modality" className="mb-2 block text-sm font-medium text-text-primary">
                  Modality {mode === 'describe' ? '(Optional)' : '(Auto-detected)'}
                </label>
                <select
                  id="ai-modality"
                  value={modality}
                  onChange={(e) => setModality(e.target.value)}
                  disabled={isLoading}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  data-testid="ai-modality-select"
                >
                  <option value="">Select modality</option>
                  {modalityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="ai-bodypart" className="mb-2 block text-sm font-medium text-text-primary">
                  Body Part {mode === 'describe' ? '(Optional)' : '(Auto-detected)'}
                </label>
                <select
                  id="ai-bodypart"
                  value={bodyPart}
                  onChange={(e) => setBodyPart(e.target.value)}
                  disabled={isLoading}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  data-testid="ai-bodypart-select"
                >
                  <option value="">Select body part</option>
                  {bodyPartOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || (mode === 'describe' ? !description.trim() : !rawTemplate.trim())}
              data-testid="generate-template-btn"
            >
              {isLoading ? 'Processing...' : mode === 'describe' ? 'Generate Template' : 'Structure Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

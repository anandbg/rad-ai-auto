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
  const [description, setDescription] = useState('');
  const [modality, setModality] = useState(initialModality);
  const [bodyPart, setBodyPart] = useState(initialBodyPart);
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setDescription('');
      setModality(initialModality);
      setBodyPart(initialBodyPart);
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      showToast('Please enter a template description', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/templates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
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
            Describe the template you need, and AI will create a structured template for you to customize.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Description textarea */}
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

            {/* Optional filters */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ai-modality" className="mb-2 block text-sm font-medium text-text-primary">
                  Modality (Optional)
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
                  Body Part (Optional)
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
              disabled={isLoading || !description.trim()}
              data-testid="generate-template-btn"
            >
              {isLoading ? 'Generating...' : 'Generate Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { type TemplateSection } from '@/lib/validation/template-schema';

export interface SortableSectionProps {
  id: string;
  section: TemplateSection;
  onUpdate: (id: string, field: 'name' | 'content', value: string) => void;
  onRemove: (id: string) => void;
}

export function SortableSection({ id, section, onUpdate, onRemove }: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            {/* Drag handle */}
            <button
              {...listeners}
              aria-label="Drag to reorder section"
              className="mt-2 cursor-grab active:cursor-grabbing text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:rounded p-1"
            >
              <GripVertical className="h-5 w-5" />
            </button>

            {/* Section content */}
            <div className="flex-1 space-y-4">
              <div>
                <label htmlFor={`section-name-${id}`} className="block text-sm font-medium text-text-primary mb-1.5">
                  Section Name
                </label>
                <Input
                  id={`section-name-${id}`}
                  value={section.name}
                  onChange={(e) => onUpdate(id, 'name', e.target.value)}
                  placeholder="e.g., FINDINGS, IMPRESSION"
                  className="uppercase"
                />
              </div>

              <div>
                <label htmlFor={`section-content-${id}`} className="block text-sm font-medium text-text-primary mb-1.5">
                  Section Content
                </label>
                <Textarea
                  id={`section-content-${id}`}
                  value={section.content}
                  onChange={(e) => onUpdate(id, 'content', e.target.value)}
                  placeholder="Enter template content with [placeholders] and (instructions)"
                  rows={4}
                />
              </div>
            </div>

            {/* Remove button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(id)}
              aria-label="Remove section"
              className="mt-2 text-danger hover:text-danger hover:bg-danger/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

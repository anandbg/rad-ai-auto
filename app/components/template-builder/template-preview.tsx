'use client';

import { useMemo } from 'react';
import type { TemplateSection } from '@/lib/validation/template-schema';

interface TemplatePreviewProps {
  name: string;
  description: string;
  sections: TemplateSection[];
}

/**
 * TemplatePreview - Live preview of template with syntax highlighting
 *
 * Highlights:
 * - [placeholders] - dynamic content markers (brand color)
 * - (instructions) - conditional guidance (muted italic)
 * - "verbatim" - exact text to include (bold)
 */
export function TemplatePreview({ name, description, sections }: TemplatePreviewProps) {
  // Render each section with highlighted syntax
  const renderedSections = useMemo(() => {
    return sections.map((section) => {
      const renderedContent = section.content
        // [placeholders] - highlight in brand color with background
        .replace(
          /\[([^\]]+)\]/g,
          '<span class="inline-block px-1 py-0.5 bg-brand/20 text-brand rounded text-sm">[$1]</span>'
        )
        // (instructions) - muted italic text
        .replace(
          /\(([^)]+)\)/g,
          '<span class="text-text-secondary italic">($1)</span>'
        )
        // "verbatim" - bold text
        .replace(
          /"([^"]+)"/g,
          '<span class="font-semibold">"$1"</span>'
        );

      return {
        ...section,
        renderedContent,
      };
    });
  }, [sections]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-surface">
      {/* Header */}
      <div className="border-b border-border bg-surface-muted px-6 py-4">
        <h2 className="text-lg font-semibold text-text-primary">
          {name || 'Untitled Template'}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {description || 'No description provided'}
        </p>
      </div>

      {/* Preview content */}
      <div className="flex-1 overflow-y-auto p-6">
        {sections.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-text-muted">No sections added yet</p>
              <p className="mt-1 text-xs text-text-muted">
                Add sections to see the preview
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {renderedSections.map((section) => (
              <div key={section.id} className="space-y-2">
                {/* Section name in uppercase */}
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  {section.name}
                </h3>

                {/* Section content with highlighted syntax */}
                <div
                  className="prose prose-sm max-w-none text-text-primary"
                  dangerouslySetInnerHTML={{ __html: section.renderedContent }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

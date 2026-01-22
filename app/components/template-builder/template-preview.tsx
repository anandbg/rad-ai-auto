'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { TemplateSection } from '@/lib/validation/template-schema';
import { useTemplateMarkdownComponents } from '@/lib/template/syntax-highlighter';

interface TemplatePreviewProps {
  name: string;
  description: string;
  sections: TemplateSection[];
}

/**
 * TemplatePreview - Live preview of template with markdown rendering and syntax highlighting
 *
 * Renders markdown content (headers, lists, bold, italic, etc.) while also highlighting:
 * - [placeholders] - dynamic content markers (brand color)
 * - (instructions) - conditional guidance (muted italic)
 * - "verbatim" - exact text to include (bold)
 */
export function TemplatePreview({ name, description, sections }: TemplatePreviewProps) {
  // Custom components for ReactMarkdown that apply template syntax highlighting
  const markdownComponents = useTemplateMarkdownComponents();

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
            {sections.map((section) => (
              <div key={section.id} className="space-y-2">
                {/* Section name in uppercase */}
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary border-b border-border pb-1">
                  {section.name}
                </h3>

                {/* Section content with markdown rendering and syntax highlighting */}
                <article className="prose prose-sm max-w-none text-text-primary prose-headings:text-text-primary prose-p:text-text-primary prose-li:text-text-primary prose-strong:text-text-primary prose-ul:my-2 prose-ol:my-2 prose-p:my-2">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {section.content || ''}
                  </ReactMarkdown>
                </article>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

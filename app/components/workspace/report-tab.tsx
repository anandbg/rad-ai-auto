'use client';

import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ScrollText,
  ChevronDown,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/shared/cn';
import { PageWarning } from '@/components/legal/page-warning';
import { usePreferences } from '@/lib/preferences/preferences-context';
import { transformMarkdownListStyles } from '@/lib/report/list-styles';

export interface Template {
  id: string;
  label: string;
  category: string;
  bodyPart?: string;
}

export interface ReportTabProps {
  content: string | null;
  selectedTemplateId?: string;
  onTemplateSelect: (id: string) => void;
  templateOpen: boolean;
  setTemplateOpen: (open: boolean) => void;
  templates: Template[];
  isLoadingTemplates: boolean;
}

export function ReportTab({
  content,
  selectedTemplateId,
  onTemplateSelect,
  templateOpen,
  setTemplateOpen,
  templates,
  isLoadingTemplates,
}: ReportTabProps) {
  const { preferences } = usePreferences();
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  // Get unique categories from templates (dynamic grouping)
  const categories = [...new Set(templates.map(t => t.category))];

  // Transform markdown content to apply list style preferences
  const transformedContent = content
    ? transformMarkdownListStyles(content, preferences.listStylePreferences)
    : null;

  return (
    <div className="h-full flex flex-col gap-4">
      <PageWarning variant="report" />
      <div className="flex-1 flex flex-col">
      {/* Template selector bar at top of report */}
      <div className={cn(
        "flex items-center justify-between px-5 py-3 rounded-t-2xl",
        "bg-slate-50 dark:bg-slate-800/70",
        "border border-b-0 border-slate-200/80 dark:border-slate-700/50"
      )}>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Template:
          </span>

          {/* Template Selector */}
          <div className="relative">
            <button
              onClick={() => setTemplateOpen(!templateOpen)}
              disabled={isLoadingTemplates}
              className={cn(
                "group flex items-center gap-2 rounded-lg px-3 py-2",
                "bg-white dark:bg-slate-700",
                "border border-slate-200 dark:border-slate-600",
                "hover:border-brand/50 dark:hover:border-brand/50",
                "transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
                "shadow-sm",
                "disabled:opacity-50 disabled:cursor-wait"
              )}
            >
              {isLoadingTemplates ? (
                <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 text-slate-400" />
              )}
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {isLoadingTemplates ? 'Loading...' : (selectedTemplate?.label || 'Select Template')}
              </span>
              <ChevronDown className={cn(
                "h-4 w-4 text-slate-400 transition-transform duration-200",
                templateOpen && "rotate-180"
              )} />
            </button>

            {/* Dropdown */}
            <AnimatePresence>
              {templateOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setTemplateOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full z-20 mt-2 w-64 origin-top-left rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-800"
                  >
                    {categories.map(category => {
                      const categoryTemplates = templates.filter(t => t.category === category);
                      if (categoryTemplates.length === 0) return null;
                      return (
                        <div key={category} className="mb-2 last:mb-0">
                          <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            {category}
                          </div>
                          {categoryTemplates.map(template => (
                            <button
                              key={template.id}
                              onClick={() => onTemplateSelect(template.id)}
                              className={cn(
                                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm",
                                "transition-colors duration-100",
                                selectedTemplateId === template.id
                                  ? "bg-brand/10 text-brand font-medium"
                                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50"
                              )}
                            >
                              {selectedTemplateId === template.id && (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                              {template.label}
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {content && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Generated
          </span>
        )}
      </div>

      {/* Report Content */}
      <div className={cn(
        "flex-1 rounded-b-2xl overflow-hidden",
        "bg-white dark:bg-slate-900",
        "border border-t-0 border-slate-200/80 dark:border-slate-700/50",
        "shadow-sm"
      )}>
        {!content ? (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700">
                <ScrollText className="h-8 w-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                No Report Yet
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Record your observations using Voice Input, select a template above, then click{' '}
                <span className="font-medium text-brand">&quot;Generate Report&quot;</span>{' '}
                to create your AI-assisted radiology report.
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-auto">
            {/* Report Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <ScrollText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Generated Report
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  AI-generated - Review and edit before finalizing
                </p>
              </div>
            </div>

            {/* Disclaimer Header */}
            <div className="mx-6 mt-6 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3">
              <div className="flex items-center justify-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-sm font-bold text-amber-700 dark:text-amber-300 text-center">
                  AI-GENERATED DRAFT - NOT REVIEWED
                </span>
              </div>
            </div>

            {/* Report Body - Markdown rendered with typography styles */}
            <div className="p-6 bg-white dark:bg-slate-900">
              <article className="prose prose-slate dark:prose-invert prose-sm max-w-none prose-headings:font-semibold prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3 prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2 prose-p:leading-relaxed prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-li:text-slate-700 dark:prose-li:text-slate-300 prose-ul:my-2 prose-ol:my-2">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {transformedContent || ''}
                </ReactMarkdown>
              </article>
            </div>

            {/* Disclaimer Footer */}
            <div className="mx-6 mb-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Generated with AI assistance. User is solely responsible for accuracy. Not medical advice.
              </p>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

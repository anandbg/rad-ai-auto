'use client';

import { motion } from 'framer-motion';
import { FileText, Mic, ScrollText, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/shared/cn';

export type WorkspaceTab = 'context' | 'transcribe' | 'report';

interface WorkspaceTabsProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  hasReport?: boolean;
  hasContext?: boolean;
}

const tabs = [
  { id: 'context' as const, label: 'Clinical Context', icon: FileText, step: 1 },
  { id: 'transcribe' as const, label: 'Voice Input', icon: Mic, step: 2 },
  { id: 'report' as const, label: 'Generated Report', icon: ScrollText, step: 3 },
];

export function WorkspaceTabs({ activeTab, onTabChange, hasReport, hasContext }: WorkspaceTabsProps) {
  return (
    <div className="relative">
      {/* Subtle top border accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="flex items-center bg-gradient-to-b from-slate-50/50 to-transparent dark:from-slate-800/30">
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          const isCompleted = (tab.id === 'context' && hasContext) || (tab.id === 'report' && hasReport);

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "group relative flex items-center gap-3 px-6 py-4 text-sm font-medium",
                "transition-all duration-200 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2",
                isActive
                  ? "text-slate-900 dark:text-slate-100"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              {/* Step indicator */}
              <span className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200",
                isActive
                  ? "bg-brand text-white shadow-sm shadow-brand/25"
                  : isCompleted
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
              )}>
                {isCompleted && !isActive ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  tab.step
                )}
              </span>

              {/* Tab content */}
              <div className="flex flex-col items-start">
                <span className={cn(
                  "text-[13px] font-semibold tracking-tight transition-colors",
                  isActive ? "text-slate-900 dark:text-slate-100" : ""
                )}>
                  {tab.label}
                </span>
                <span className={cn(
                  "text-[11px] font-normal transition-colors",
                  isActive ? "text-slate-500 dark:text-slate-400" : "text-slate-400 dark:text-slate-500"
                )}>
                  {tab.id === 'context' && 'Patient history & findings'}
                  {tab.id === 'transcribe' && 'Dictate your observations'}
                  {tab.id === 'report' && 'AI-generated analysis'}
                </span>
              </div>

              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-brand"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}

              {/* Hover highlight */}
              <div className={cn(
                "absolute inset-0 -z-10 transition-opacity duration-200",
                "bg-gradient-to-b from-slate-100/80 to-transparent dark:from-slate-700/30",
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50"
              )} />

              {/* Separator */}
              {index < tabs.length - 1 && (
                <div className="absolute right-0 top-1/2 h-8 w-px -translate-y-1/2 bg-slate-200/60 dark:bg-slate-700/60" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom border */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />
    </div>
  );
}
